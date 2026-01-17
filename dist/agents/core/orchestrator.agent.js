import { BaseAgent } from '../base.js';
import * as fs from 'fs';
import * as path from 'path';
import { SharedContext } from '../../core/context.js';
import { DAGExecutor, DEFAULT_DAG, GENERATION_DAG } from '../../core/dag-executor.js';
// v2.1.0: Core Components
import { FeatureDetector } from '../../core/feature-detector.js';
import { PromptRegistry } from '../../core/prompt-registry.js';
import { SmartDAGPlanner } from '../../core/smart-dag-planner.js';
import { PromptRouter } from '../../core/prompt-router.js';
import { TemplateLoader } from '../../core/template-loader.js';
import { DiagramGenerator } from '../../core/diagram-generator.js';
import { GenericAnalysisAgent } from '../generic-analysis.agent.js';
export class RepoSpecZeroOrchestrator extends BaseAgent {
    detectionSkill;
    gitSkill;
    taskSpecAgent;
    id = 'orchestrator';
    name = 'RepoSpecZero Orchestrator';
    description = 'Coordinates the RepoSpecZero analysis swarm using DAG execution.';
    systemPrompt = 'You are the orchestrator of the SpecZero swarm.';
    triggers = [/^analyze repo/, /^generate spec/];
    constructor(detectionSkill, gitSkill, taskSpecAgent) {
        super();
        this.detectionSkill = detectionSkill;
        this.gitSkill = gitSkill;
        this.taskSpecAgent = taskSpecAgent;
    }
    async process(context) {
        const { client } = context;
        const params = context.params || {};
        console.log('[Orchestrator] Processing with params:', JSON.stringify(params));
        // 1. Resolve Input (TaskId or RepoUrl or RepoPath)
        let repoUrl = params.repoUrl;
        let taskId = params.taskId;
        let repoPath = (params.repoPath || params.path || params.repoDir);
        let targetDir = params.targetDir;
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
        let projectSlug;
        let workDir;
        if (repoPath) {
            // LOCAL REPO MODE: use provided path directly
            workDir = path.resolve(repoPath);
            projectSlug = path.basename(workDir) || 'unknown-repo';
            if (!fs.existsSync(workDir)) {
                return { success: false, message: `Local path does not exist: ${workDir}` };
            }
            await this.notify(client, `Analyzing local repository: ${workDir}`);
        }
        else if (repoUrl) {
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
                await this.gitSkill.cloneOrUpdate(repoUrl, workDir);
                await this.notify(client, `Clone successful!`, 'success');
            }
            catch (e) {
                return { success: false, message: `Clone failed: ${e.message}` };
            }
        }
        else {
            // DEFAULT: use current working directory
            workDir = process.cwd();
            projectSlug = path.basename(workDir) || 'unknown-repo';
            await this.notify(client, `Analyzing current directory: ${workDir}`);
        }
        // v2.1.0: Initialize Core Components early for detection
        const pluginRoot = process.cwd();
        const registry = new PromptRegistry(pluginRoot);
        const featureDetector = new FeatureDetector();
        const planner = new SmartDAGPlanner(registry, featureDetector);
        const router = new PromptRouter(registry, path.join(pluginRoot, 'prompts'));
        const templateLoader = new TemplateLoader(pluginRoot);
        const diagramGenerator = new DiagramGenerator();
        // 3. Detect Features and Type
        await this.notify(client, `Detecting repository features...`);
        const detectedFeatures = await featureDetector.detect(workDir);
        const repoType = detectedFeatures.repoType;
        await this.notify(client, `Detected type: ${repoType}`);
        // 4. Generate directory structure
        const treeExecutor = this.skills.get('repo_spec_zero_build_tree');
        let repoStructure = "";
        if (treeExecutor) {
            try {
                const treeResult = await treeExecutor.execute({ repoPath: workDir });
                if (treeResult?.success && treeResult?.data && typeof treeResult.data === 'string') {
                    repoStructure = treeResult.data.trim();
                    if (repoStructure.length === 0) {
                        repoStructure = "(empty repository structure)";
                    }
                }
                else {
                    await this.notify(client, `Warning: Tree generation failed, using empty structure`, 'warning');
                    repoStructure = "(tree generation failed)";
                }
            }
            catch (e) {
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
        let agentMap = new Map(this.subAgents.map(a => [a.id, a]));
        // v2.1.0: Get options from params
        const useSmartDag = params.smartDag !== false; // Default true
        const diagramMode = String(params.diagrams || 'both');
        const templateOverride = params.template ? String(params.template) : undefined;
        const skipAgents = Array.isArray(params.skipAgents) ? params.skipAgents : [];
        const useV2 = params.useV2 !== false; // Still needed for legacy mode
        const specsFolder = String(params.specsFolder || 'specs');
        const noPush = Boolean(params.noPush);
        const pluginVersion = String(params.pluginVersion || '2.1.0');
        let initialDag;
        if (useSmartDag) {
            await this.notify(client, `Planning dynamic DAG with SmartDAGPlanner...`);
            const plannedDag = planner.planFromFeatures(detectedFeatures);
            await this.notify(client, `Planned ${plannedDag.agents.length} agents across ${plannedDag.layers.length} layers.`);
            // Convert PlannedDAG to DAGDefinition
            initialDag = {
                version: plannedDag.version,
                nodes: plannedDag.agents.map(pa => ({
                    agentId: pa.id,
                    dependencies: pa.dependencies,
                    parallel: pa.parallel,
                    optional: pa.optional
                }))
            };
            // Register dynamic GenericAnalysisAgents
            for (const pa of plannedDag.agents) {
                // Skip core agents that are already in the registry
                const coreAgents = [
                    'bootstrap', 'submodule_check', 'summary', 'structure_builder',
                    'write_specs', 'commit_push', 'audit_report', 'apply_changes'
                ];
                if (coreAgents.includes(pa.id)) {
                    continue;
                }
                // Skip explicitly requested agents
                if (skipAgents.includes(pa.id)) {
                    continue;
                }
                // Apply overrides
                const agentPa = {
                    ...pa,
                    templateId: templateOverride || pa.templateId
                };
                const dynamicAgent = new GenericAnalysisAgent(agentPa, router, templateLoader, diagramGenerator);
                // Inherit skills from orchestrator
                for (const [skillId, executor] of this.skills.entries()) {
                    dynamicAgent.registerSkill(skillId, executor);
                }
                agentMap.set(pa.id, dynamicAgent);
            }
        }
        else {
            // v2.0.0: Select initial DAG
            initialDag = useV2 ? GENERATION_DAG : DEFAULT_DAG;
        }
        // 7. Create DAG Executor with progress tracking
        const startTime = Date.now();
        const executionLog = [];
        const dagExecutor = new DAGExecutor(initialDag, sharedContext, agentMap, {
            // v2.0.0 & v2.1.0: Pass options to agents
            specsFolder,
            noPush,
            pluginVersion,
            // v2.1.0: New options for skip logic and diagrams
            planner: useSmartDag ? planner : undefined,
            features: detectedFeatures,
            onProgress: (agentId, status, message) => {
                if (status === 'start') {
                    console.log(`[DAG] Starting ${agentId}...`);
                }
                else if (status === 'success') {
                    console.log(`[DAG] ${agentId} completed successfully`);
                }
                else if (status === 'skip') {
                    console.log(`[DAG] ${agentId} skipped: ${message}`);
                }
                else {
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
                        status: result.success ? (result.skipped ? 'skip' : 'success') : 'failed',
                        durationMs: result.durationMs,
                        message: result.error || result.skipReason
                    });
                }
            }
        });
        // 8. Validate DAG
        const validation = DAGExecutor.validate(initialDag);
        if (!validation.valid) {
            return {
                success: false,
                message: `DAG validation failed: ${validation.errors.join(', ')}`
            };
        }
        // 9. Execute DAG
        await this.notify(client, `Starting ${useSmartDag ? 'v2.1' : (useV2 ? 'v2.0' : 'v1.x')} DAG execution with ${initialDag.nodes.length} agents...`);
        let dagSummary;
        try {
            dagSummary = await dagExecutor.execute(client);
        }
        catch (e) {
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
${executionLog.map(l => `| ${l.agent} | ${l.status === 'success' ? 'Success' : (l.status === 'skip' ? 'Skipped' : 'Failed')} | ${l.durationMs}ms | ${l.message || ''} |`).join('\n')}

## Context Metadata
\`\`\`json
${JSON.stringify(contextMetadata, null, 2)}
\`\`\`

## Key Files Loaded
${Array.from(sharedContext.keyFiles.keys()).map(f => `- ${f}`).join('\n') || '(none)'}

## Prompt Versions Used
${contextMetadata.promptVersions?.map((p) => `- ${p.id}@v${p.version} (${p.hash})`).join('\n') || '(none)'}
`;
        // v2.0.0: Output directory is now based on mode
        const outputDir = useV2
            ? path.join(workDir, specsFolder) // v2.0.0: specs submodule
            : path.join(workDir, `${projectSlug}-spec`); // v1.x: arch-docs style
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
                version: useSmartDag ? '2.1.0' : (useV2 ? '2.0.0' : '1.0.0'),
                specsFolder: useV2 ? specsFolder : undefined,
            }
        };
    }
    getSlug(url) {
        const safeUrl = String(url || '');
        if (!safeUrl || safeUrl === 'undefined')
            return 'unknown-repo';
        const lastPart = safeUrl.split('/').pop() || 'unknown-repo';
        return lastPart.replace('.git', '');
    }
    async notify(client, message, variant = 'info') {
        console.log(`[Orchestrator] ${message}`);
        if (client && client.tui && client.tui.showToast) {
            try {
                await client.tui.showToast({
                    body: { title: 'RepoSpecZero', message, variant, duration: 3000 }
                });
            }
            catch (e) {
                // ignore
            }
        }
    }
    // Legacy method for backwards compatibility (used by tests)
    getExecutionOrder(agents) {
        const visited = new Set();
        const order = [];
        const agentMap = new Map(agents.map(a => [a.id, a]));
        const visit = (agentId) => {
            if (visited.has(agentId))
                return;
            const agent = agentMap.get(agentId);
            if (!agent)
                return;
            const deps = agent.contextDeps || [];
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
//# sourceMappingURL=orchestrator.agent.js.map