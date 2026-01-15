import { BaseAgent, SubAgent } from '../base.js';
import type { AgentContext, AgentResult } from '../../types.js';
import * as fs from 'fs';
import * as path from 'path';
import { SpecZeroDetectionSkill } from '../../skills/spec-zero-detection.skill.js';
import { GitSkill } from '../../skills/git.skill.js';
import { TaskSpecAgent } from './task-spec.agent.js';
import { CONFIG } from '../../core/config.js';

// Import all SpecZero Agents (we will need to register them or import them here to instantiate sub-agents)
// For now, we assume they are registered in the global registry or we'll inject them into the orchestrator.
// To keep it simple, we will assume the Orchestrator has access to them via `this.subAgents` or `context.agentRegistry`.
// But `BaseAgent` doesn't have `agentRegistry`. 
// We will register them as sub-agents in `index.ts`.

export class RepoSpecZeroOrchestrator extends BaseAgent {
    readonly id = 'orchestrator';
    readonly name = 'RepoSpecZero Orchestrator';
    readonly description = 'Coordinates the RepoSpecZero analysis swarm.';
    readonly systemPrompt = 'You are the orchestrator of the SpecZero swarm.';
    readonly triggers = [/^analyze repo/, /^generate spec/];

    constructor(
        private detectionSkill: SpecZeroDetectionSkill,
        private gitSkill: GitSkill,
        private taskSpecAgent: TaskSpecAgent
    ) {
        super();
        // Register TaskSpecAgent as a sub-agent strictly speaking? 
        // Or just use it directly. We'll use it directly since we passed it in.
    }

    async process(context: AgentContext): Promise<AgentResult> {
        const { client } = context;
        const params = context.params || {};

        // 1. Resolve Input (TaskId or RepoUrl)
        let repoUrl = params.repoUrl as string;
        let taskId = params.taskId as string;

        if (!repoUrl && !taskId) {
            return { success: false, message: 'Please provide `taskId` (ClickUp) or `repoUrl`.' };
        }

        // If taskId provided, fetch repoUrl
        if (taskId) {
            await this.notify(client, `Fetching task ${taskId}...`);
            const taskResult = await this.taskSpecAgent.fetchTask(taskId, context);
            if (!taskResult.success) {
                return taskResult;
            }
            repoUrl = taskResult.data.repoUrl;
            if (!repoUrl) {
                return { success: false, message: `Could not find repo URL in task ${taskId} ` };
            }
            await this.notify(client, `Found valid Repo URL: ${repoUrl} `);
        }

        // 2. Clone Repo
        const projectSlug = this.getSlug(repoUrl);
        const workDir = path.join(process.cwd(), CONFIG.TEMP_DIR, projectSlug);

        await this.notify(client, `Cloning ${repoUrl} to ${workDir}...`);
        try {
            await this.gitSkill.cloneOrUpdate(repoUrl, workDir);
        } catch (e: any) {
            return { success: false, message: `Clone failed: ${e.message} ` };
        }

        // 3. Detect Type
        await this.notify(client, `Detecting repository type...`);
        const repoType = await this.detectionSkill.detect(workDir);
        await this.notify(client, `Detected type: ${repoType} `);

        // Generate directory structure
        const currentDir = process.cwd();
        const treeExecutor = this.skills.get('repo_spec_zero_build_tree');
        let repoStructure = "";
        if (treeExecutor) {
            const treeResult = await treeExecutor.execute<string>({ repoPath: workDir });
            repoStructure = treeResult.data || "";
        }

        // 4. Execution Plan (Topological Sort)
        // We assume subAgents are populated with our 17 agents.
        // We need to order them based on `contextDeps`.
        // Let's create a map of id -> agent
        const agentMap = new Map(this.subAgents.map(a => [a.id, a]));
        // Initialize execution log
        const executionLog: Array<{ agent: string, status: 'success' | 'failed', durationMs: number, message?: string }> = [];
        const startTime = Date.now();

        // 3. Execute Agents via Topological Sort
        const results: Record<string, string> = {};
        const executionOrder = this.getExecutionOrder(this.subAgents);

        let index = 0;
        for (const agentId of executionOrder) {
            index++;
            const agent = agentMap.get(agentId);
            if (!agent) continue;

            const agentStart = Date.now();
            await this.notify(client, `[${index}/${executionOrder.length}] Activating ${agent.name}...`, 'info');

            // Pass accumulated results to next agent
            // Also pass `repoStructure` and `projectSlug` which are in `context.params`
            // But we need to ensure they are propagated explicitly or via `params`.

            const agentParams = {
                repoStructure,
                projectSlug,
                baseDir: workDir,
                repoType,
                allResults: results
            };

            // DEBUG LOG
            // console.log(`[DEBUG] Agent Params for ${ agent.name }: `, JSON.stringify({ ...agentParams, repoStructure: agentParams.repoStructure ? "HAS_CONTENT" : "EMPTY" }, null, 2));

            const agentContext: AgentContext = {
                ...context,
                params: agentParams
            };

            try {
                const result = await agent.process(agentContext);
                const duration = Date.now() - agentStart;

                if (!result.success) {
                    await this.notify(client, `⚠️ Agent ${agent.name} failed: ${result.message} `, 'warning');
                    executionLog.push({ agent: agent.name, status: 'failed', durationMs: duration, message: result.message });
                } else {
                    // results[agentId] = result.data.output; // Assuming data.output is the string content
                    // The result.data could be complex object returned by `RepoSpecZeroAgent`
                    // In `base.ts`, it returns { output: string, path: string }
                    if (result.data && typeof result.data === 'object' && 'output' in result.data) {
                        results[agentId] = (result.data as any).output;
                    } else {
                        results[agentId] = JSON.stringify(result.data);
                    }
                    executionLog.push({ agent: agent.name, status: 'success', durationMs: duration });
                }
            } catch (e: any) {
                const duration = Date.now() - agentStart;
                await this.notify(client, `❌ Agent ${agent.name} crashed: ${e.message} `, 'error');
                executionLog.push({ agent: agent.name, status: 'failed', durationMs: duration, message: e.message });
            }
        }

        // 4. Generate Audit Log
        const totalDuration = Date.now() - startTime;
        const auditContent = `# Analysis Audit Log
Date: ${new Date().toISOString()}
Repo: ${projectSlug}
Duration: ${Math.round(totalDuration / 1000)} s

## Execution Summary
    - Total Agents: ${executionOrder.length}
- Executed: ${executionLog.length}
- Success: ${executionLog.filter(l => l.status === 'success').length}
- Failed: ${executionLog.filter(l => l.status === 'failed').length}

## Details
    | Agent | Status | Duration | Message |
| -------| --------| ----------| ---------|
    ${executionLog.map(l => `| ${l.agent} | ${l.status === 'success' ? '✅ Success' : '❌ Failed'} | ${l.durationMs}ms | ${l.message || ''} |`).join('\n')}
`;

        const auditPath = path.join(workDir, `${projectSlug} -spec`, '_meta', 'analysis_audit.md');
        // Ensure dir exists
        if (!fs.existsSync(path.dirname(auditPath))) {
            fs.mkdirSync(path.dirname(auditPath), { recursive: true });
        }
        fs.writeFileSync(auditPath, auditContent);

        if (taskId) {
            await this.notify(client, `Updating ClickUp task ${taskId}...`);
            // Use TaskSpecAgent to update
            // We could construct a summary linkage or just "Analysis Complete".
            await this.taskSpecAgent.updateProgress(taskId, 'review', 'Analysis complete. Spec generated.', context);
        }

        const outputDir = path.join(workDir, `${projectSlug} -spec`);
        return {
            success: true,
            message: `Analysis Complete.Spec generated at ${outputDir} `,
            data: {
                specDir: outputDir,
                repoType
            }
        };
    }

    private getSlug(url: string): string {
        const parts = url.split('/');
        return parts[parts.length - 1].replace('.git', '');
    }

    private async notify(client: any, message: string, variant: 'info' | 'success' | 'warning' | 'error' = 'info') {
        console.log(`[Orchestrator] ${message} `);
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

    // Topological sort
    private getExecutionOrder(agents: any[]): string[] {
        const visited = new Set<string>();
        const order: string[] = [];
        const agentMap = new Map(agents.map(a => [a.id, a]));

        const visit = (agentId: string) => {
            if (visited.has(agentId)) return;

            const agent = agentMap.get(agentId);
            if (!agent) return;

            // Visit deps first
            // Need to access `contextDeps` from agent. 
            // Cast to any since BaseAgent doesn't have it, but RepoSpecZeroAgent does.
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
