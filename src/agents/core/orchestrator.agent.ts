import { BaseAgent, SubAgent } from '../base.js';
import type { AgentContext, AgentResult, SpecZeroMode } from '../../types.js';
import * as fs from 'fs';
import * as path from 'path';
import { SpecZeroDetectionSkill } from '../../skills/spec-zero-detection.skill.js';
import { GitSkill } from '../../skills/git.skill.js';
import { TaskSpecAgent } from './task-spec.agent.js';
import { CONFIG } from '../../core/config.js';
import { SharedContext } from '../../core/context.js';
import { DAGExecutor, DEFAULT_DAG, GENERATION_DAG, AUDIT_DAG, selectDAG } from '../../core/dag-executor.js';
import type { DAGExecutionSummary, DAGDefinition } from '../../types.js';

export class RepoSpecZeroOrchestrator extends BaseAgent {
    readonly id = 'orchestrator';
    readonly name = 'RepoSpecZero Orchestrator';
    readonly description = 'Coordinates the RepoSpecZero analysis swarm using DAG execution.';
    readonly systemPrompt = 'You are the orchestrator of the SpecZero swarm.';
    readonly triggers = [/^analyze repo/, /^generate spec/];

    constructor(
        private detectionSkill: SpecZeroDetectionSkill,
        private gitSkill: GitSkill,
        private taskSpecAgent: TaskSpecAgent
    ) {
        super();
    }

    async process(context: AgentContext): Promise<AgentResult> {
        const { client } = context;
        const params = context.params || {};

        console.log('[Orchestrator] Processing with params:', JSON.stringify(params));

        // 1. Resolve Input (TaskId or RepoUrl or RepoPath)
        let repoUrl = params.repoUrl as string | undefined;
        let taskId = params.taskId as string | undefined;
        let repoPath = (params.repoPath || params.path || params.repoDir) as string | undefined;
        let targetDir = params.targetDir as string | undefined;

        // If taskId provided, fetch repoUrl
        if (taskId) {
            await this.notify(client, `Fetching task ${taskId}...`);
            const taskResult = await this.taskSpecAgent.fetchTask(taskId, context);
            if (!taskResult.success) {
                return taskResult;
            }
            repoUrl = taskResult.data.repoUrl;
            if (!repoUrl) {
                return { success: false, message: `Could not find repo URL in task ${taskId}` };
            }
            await this.notify(client, `Found valid Repo URL: ${repoUrl}`);
        }

        // 2. Resolve working directory (local path or cloned repo)
        let projectSlug: string;
        let workDir: string;

        if (repoPath) {
            // LOCAL REPO MODE: use provided path directly
            workDir = path.resolve(repoPath);
            projectSlug = path.basename(workDir) || 'unknown-repo';
            if (!fs.existsSync(workDir)) {
                return { success: false, message: `Local path does not exist: ${workDir}` };
            }
            await this.notify(client, `Analyzing local repository: ${workDir}`);
        } else if (repoUrl) {
            // REMOTE REPO MODE: clone to targetDir
            if (!targetDir) {
                return { 
                    success: false, 
                    message: `Error: targetDir is required when cloning a remote repository. Please specify where to clone ${repoUrl}` 
                };
            }

            projectSlug = this.getSlug(repoUrl);
            
            // targetDir is where we create the project folder
            const resolvedTargetDir = path.resolve(targetDir);
            workDir = path.join(resolvedTargetDir, projectSlug);

            // Ensure targetDir exists
            if (!fs.existsSync(resolvedTargetDir)) {
                await this.notify(client, `Creating target directory: ${resolvedTargetDir}`);
                fs.mkdirSync(resolvedTargetDir, { recursive: true });
            }

            await this.notify(client, `Cloning ${repoUrl} to ${workDir}...`);
            try {
                await this.gitSkill.cloneOrUpdate(repoUrl as string, workDir);
                await this.notify(client, `Clone successful!`, 'success');
            } catch (e: any) {
                return { success: false, message: `Clone failed: ${e.message}` };
            }
        } else {
            // DEFAULT: use current working directory
            workDir = process.cwd();
            projectSlug = path.basename(workDir) || 'unknown-repo';
            await this.notify(client, `Analyzing current directory: ${workDir}`);
        }

        // 3. Detect Type
        await this.notify(client, `Detecting repository type...`);
        const repoType = await this.detectionSkill.detect(workDir);
        await this.notify(client, `Detected type: ${repoType}`);

        // 4. Generate directory structure
        const treeExecutor = this.skills.get('repo_spec_zero_build_tree');
        let repoStructure = "";

        if (treeExecutor) {
            try {
                const treeResult = await treeExecutor.execute<string>({ repoPath: workDir });
                if (treeResult?.success && treeResult?.data && typeof treeResult.data === 'string') {
                    repoStructure = treeResult.data.trim();
                    if (repoStructure.length === 0) {
                        repoStructure = "(empty repository structure)";
                    }
                } else {
                    await this.notify(client, `Warning: Tree generation failed, using empty structure`, 'warning');
                    repoStructure = "(tree generation failed)";
                }
            } catch (e: any) {
                await this.notify(client, `Warning: Tree skill error: ${e.message}`, 'warning');
                repoStructure = "(tree skill error)";
            }
        }

        // 5. Create Shared Context
        const sharedContext = new SharedContext({
            projectSlug,
            repoType,
            baseDir: workDir,
            repoStructure
        });

        // 6. Build agent map from subAgents
        const agentMap = new Map(this.subAgents.map(a => [a.id, a]));

        // v2.0.0: Get options from params
        const useV2 = params.useV2 !== false; // Default to v2.0.0 behavior
        const specsFolder = String(params.specsFolder || 'specs');
        const noPush = Boolean(params.noPush);
        const pluginVersion = String(params.pluginVersion || '2.0.0');

        // v2.0.0: Select initial DAG (will be adjusted after submodule_check)
        const initialDag: DAGDefinition = useV2 ? GENERATION_DAG : DEFAULT_DAG;

        // 7. Create DAG Executor with progress tracking
        const startTime = Date.now();
        const executionLog: Array<{ agent: string, status: 'success' | 'failed', durationMs: number, message?: string }> = [];

        const dagExecutor = new DAGExecutor(
            initialDag,
            sharedContext,
            agentMap,
            {
                // v2.0.0: Pass options to agents
                specsFolder,
                noPush,
                pluginVersion,
                onProgress: (agentId, status, message) => {
                    if (status === 'start') {
                        console.log(`[DAG] Starting ${agentId}...`);
                    } else if (status === 'success') {
                        console.log(`[DAG] ${agentId} completed successfully`);
                    } else {
                        console.log(`[DAG] ${agentId} failed: ${message}`);
                    }
                },
                onLayerStart: async (layer, agents) => {
                    await this.notify(client, `Layer ${layer + 1}: ${agents.join(', ')}`, 'info');
                },
                onLayerComplete: (layer, results) => {
                    for (const result of results) {
                        executionLog.push({
                            agent: result.agentId,
                            status: result.success ? 'success' : 'failed',
                            durationMs: result.durationMs,
                            message: result.error
                        });
                    }
                }
            }
        );

        // 8. Validate DAG
        const validation = DAGExecutor.validate(initialDag);
        if (!validation.valid) {
            return { 
                success: false, 
                message: `DAG validation failed: ${validation.errors.join(', ')}` 
            };
        }

        // 9. Execute DAG
        await this.notify(client, `Starting ${useV2 ? 'v2.0' : 'v1.x'} DAG execution with ${initialDag.nodes.length} agents...`);
        let dagSummary: DAGExecutionSummary;
        
        try {
            dagSummary = await dagExecutor.execute(client);
        } catch (e: any) {
            return { 
                success: false, 
                message: `DAG execution failed: ${e.message}` 
            };
        }

        // 10. Generate Audit Log with context metadata
        const totalDuration = Date.now() - startTime;
        const contextMetadata = sharedContext.generateMetadata();
        const detectedMode = dagExecutor.getMode();
        
        const auditContent = `# Analysis Audit Log
Date: ${new Date().toISOString()}
Repo: ${projectSlug}
Type: ${repoType}
Mode: ${detectedMode}
Duration: ${Math.round(totalDuration / 1000)}s

## DAG Execution Summary
- DAG Version: ${initialDag.version}
- Total Agents: ${dagSummary.totalAgents}
- Executed: ${dagSummary.executed}
- Success: ${dagSummary.successful}
- Failed: ${dagSummary.failed}
- Skipped: ${dagSummary.skipped}

## Execution Details
| Agent | Status | Duration | Message |
|-------|--------|----------|---------|
${executionLog.map(l => `| ${l.agent} | ${l.status === 'success' ? 'Success' : 'Failed'} | ${l.durationMs}ms | ${l.message || ''} |`).join('\n')}

## Context Metadata
\`\`\`json
${JSON.stringify(contextMetadata, null, 2)}
\`\`\`

## Key Files Loaded
${Array.from(sharedContext.keyFiles.keys()).map(f => `- ${f}`).join('\n') || '(none)'}

## Prompt Versions Used
${(contextMetadata as any).promptVersions?.map((p: any) => `- ${p.id}@v${p.version} (${p.hash})`).join('\n') || '(none)'}
`;

        // v2.0.0: Output directory is now based on mode
        const outputDir = useV2 
            ? path.join(workDir, specsFolder)  // v2.0.0: specs submodule
            : path.join(workDir, `${projectSlug}-spec`);  // v1.x: arch-docs style
        const auditPath = path.join(outputDir, useV2 ? '.meta' : '_meta', 'analysis_audit.md');
        
        // Ensure directories exist
        if (!useV2) {
            fs.mkdirSync(path.join(outputDir, 'analysis'), { recursive: true });
        }
        fs.mkdirSync(path.dirname(auditPath), { recursive: true });
        fs.writeFileSync(auditPath, auditContent);

        // 11. Write context snapshot for debugging
        const contextPath = path.join(outputDir, useV2 ? '.meta' : '_meta', 'context_snapshot.json');
        fs.mkdirSync(path.dirname(contextPath), { recursive: true });
        fs.writeFileSync(contextPath, JSON.stringify(sharedContext.toJSON(), null, 2));

        // 12. Update ClickUp task if applicable
        if (taskId) {
            await this.notify(client, `Updating ClickUp task ${taskId}...`);
            await this.taskSpecAgent.updateProgress(taskId, 'review', 'Analysis complete. Spec generated.', context);
        }

        await this.notify(client, `Analysis complete! ${dagSummary.successful}/${dagSummary.executed} agents succeeded.`, 'success');

        // v2.0.0: Mode-specific completion message
        const modeMessage = useV2 
            ? detectedMode === 'generation'
                ? `Initial specs generated at ${outputDir}`
                : `Audit report generated at ${outputDir}/AUDIT_REPORT.md`
            : `Spec generated at ${outputDir}`;

        return {
            success: dagSummary.failed === 0 || dagSummary.successful > 0,
            message: `Analysis Complete. ${modeMessage}`,
            data: {
                specDir: outputDir,
                repoType,
                dagSummary,
                contextMetadata,
                // v2.0.0: Additional info
                mode: detectedMode,
                version: useV2 ? '2.0.0' : '1.0.0',
                specsFolder: useV2 ? specsFolder : undefined,
            }
        };
    }

    private getSlug(url: string | undefined | null): string {
        const safeUrl = String(url || '');
        if (!safeUrl || safeUrl === 'undefined') return 'unknown-repo';
        const lastPart = safeUrl.split('/').pop() || 'unknown-repo';
        return lastPart.replace('.git', '');
    }

    private async notify(client: any, message: string, variant: 'info' | 'success' | 'warning' | 'error' = 'info') {
        console.log(`[Orchestrator] ${message}`);
        if (client && client.tui && client.tui.showToast) {
            try {
                await client.tui.showToast({
                    body: { title: 'RepoSpecZero', message, variant, duration: 3000 }
                });
            } catch (e) {
                // ignore
            }
        }
    }

    // Legacy method for backwards compatibility (used by tests)
    private getExecutionOrder(agents: any[]): string[] {
        const visited = new Set<string>();
        const order: string[] = [];
        const agentMap = new Map(agents.map(a => [a.id, a]));

        const visit = (agentId: string) => {
            if (visited.has(agentId)) return;

            const agent = agentMap.get(agentId);
            if (!agent) return;

            const deps = (agent as any).contextDeps || [];
            for (const dep of deps) {
                visit(dep);
            }

            visited.add(agentId);
            order.push(agentId);
        };

        for (const agent of agents) {
            visit(agent.id);
        }

        return order;
    }
}
