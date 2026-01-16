import { BaseAgent } from '../base.js';
import * as fs from 'fs';
import * as path from 'path';
// Import all SpecZero Agents (we will need to register them or import them here to instantiate sub-agents)
// For now, we assume they are registered in the global registry or we'll inject them into the orchestrator.
// To keep it simple, we will assume the Orchestrator has access to them via `this.subAgents` or `context.agentRegistry`.
// But `BaseAgent` doesn't have `agentRegistry`. 
// We will register them as sub-agents in `index.ts`.
export class RepoSpecZeroOrchestrator extends BaseAgent {
    detectionSkill;
    gitSkill;
    taskSpecAgent;
    id = 'orchestrator';
    name = 'RepoSpecZero Orchestrator';
    description = 'Coordinates the RepoSpecZero analysis swarm.';
    systemPrompt = 'You are the orchestrator of the SpecZero swarm.';
    triggers = [/^analyze repo/, /^generate spec/];
    constructor(detectionSkill, gitSkill, taskSpecAgent) {
        super();
        this.detectionSkill = detectionSkill;
        this.gitSkill = gitSkill;
        this.taskSpecAgent = taskSpecAgent;
        // Register TaskSpecAgent as a sub-agent strictly speaking? 
        // Or just use it directly. We'll use it directly since we passed it in.
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
                return { success: false, message: `Could not find repo URL in task ${taskId} ` };
            }
            await this.notify(client, `Found valid Repo URL: ${repoUrl} `);
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
                return { success: false, message: `Clone failed: ${e.message} ` };
            }
        }
        else {
            // DEFAULT: use current working directory
            workDir = process.cwd();
            projectSlug = path.basename(workDir) || 'unknown-repo';
            await this.notify(client, `Analyzing current directory: ${workDir}`);
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
            try {
                const treeResult = await treeExecutor.execute({ repoPath: workDir });
                // Improved validation with type checking
                if (treeResult?.success && treeResult?.data && typeof treeResult.data === 'string') {
                    repoStructure = treeResult.data.trim();
                    if (repoStructure.length === 0) {
                        repoStructure = "(empty repository structure)";
                    }
                }
                else {
                    await this.notify(client, `⚠️ Tree generation failed, using empty structure`, 'warning');
                    repoStructure = "(tree generation failed)";
                }
            }
            catch (e) {
                await this.notify(client, `⚠️ Tree skill error: ${e.message}`, 'warning');
                repoStructure = "(tree skill error)";
            }
        }
        // 4. Execution Plan (Topological Sort)
        // We assume subAgents are populated with our 17 agents.
        // We need to order them based on `contextDeps`.
        // Let's create a map of id -> agent
        const agentMap = new Map(this.subAgents.map(a => [a.id, a]));
        // Initialize execution log
        const executionLog = [];
        const startTime = Date.now();
        // 3. Execute Agents via Topological Sort
        const results = {};
        const executionOrder = this.getExecutionOrder(this.subAgents);
        let index = 0;
        for (const agentId of executionOrder) {
            index++;
            const agent = agentMap.get(agentId);
            if (!agent)
                continue;
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
            const agentContext = {
                ...context,
                params: agentParams
            };
            try {
                const result = await agent.process(agentContext);
                const duration = Date.now() - agentStart;
                if (!result.success) {
                    await this.notify(client, `⚠️ Agent ${agent.name} failed: ${result.message} `, 'warning');
                    executionLog.push({ agent: agent.name, status: 'failed', durationMs: duration, message: result.message });
                }
                else {
                    // results[agentId] = result.data.output; // Assuming data.output is the string content
                    // The result.data could be complex object returned by `RepoSpecZeroAgent`
                    // In `base.ts`, it returns { output: string, path: string }
                    if (result.data && typeof result.data === 'object' && 'output' in result.data) {
                        results[agentId] = result.data.output;
                    }
                    else {
                        results[agentId] = JSON.stringify(result.data);
                    }
                    executionLog.push({ agent: agent.name, status: 'success', durationMs: duration });
                }
            }
            catch (e) {
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
        const auditPath = path.join(workDir, `${projectSlug}-spec`, '_meta', 'analysis_audit.md');
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
        const outputDir = path.join(workDir, `${projectSlug}-spec`);
        // Ensure standard output dirs exist even if empty
        fs.mkdirSync(path.join(outputDir, 'analysis'), { recursive: true });
        fs.mkdirSync(path.join(outputDir, '_meta'), { recursive: true });
        return {
            success: true,
            message: `Analysis Complete. Spec generated at ${outputDir} `,
            data: {
                specDir: outputDir,
                repoType
            }
        };
    }
    getSlug(url) {
        const safeUrl = String(url || '');
        if (!safeUrl || safeUrl === 'undefined')
            return 'unknown-repo';
        // Handle file paths
        const lastPart = safeUrl.split('/').pop() || 'unknown-repo';
        return lastPart.replace('.git', '');
    }
    async notify(client, message, variant = 'info') {
        console.log(`[Orchestrator] ${message} `);
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
    // Topological sort
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
            // Visit deps first
            // Need to access `contextDeps` from agent. 
            // Cast to any since BaseAgent doesn't have it, but RepoSpecZeroAgent does.
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