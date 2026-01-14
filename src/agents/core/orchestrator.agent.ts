import { BaseAgent } from '../base.js';
import type { AgentContext, AgentResult } from '../../types.js';
import { SpecZeroDetectionSkill } from '../../skills/spec-zero-detection.skill.js';
import { GitSkill } from '../../skills/git.skill.js';
import { TaskSpecAgent } from './task-spec.agent.js';
import * as path from 'path';
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
                return { success: false, message: `Could not find repo URL in task ${taskId}` };
            }
            await this.notify(client, `Found valid Repo URL: ${repoUrl}`);
        }

        // 2. Clone Repo
        const projectSlug = this.getSlug(repoUrl);
        const workDir = path.join(process.cwd(), CONFIG.TEMP_DIR, projectSlug);

        await this.notify(client, `Cloning ${repoUrl} to ${workDir}...`);
        try {
            await this.gitSkill.cloneOrUpdate(repoUrl, workDir);
        } catch (e: any) {
            return { success: false, message: `Clone failed: ${e.message}` };
        }

        // 3. Detect Type
        await this.notify(client, `Detecting repository type...`);
        const repoType = await this.detectionSkill.detect(workDir);
        await this.notify(client, `Detected type: ${repoType}`);

        // Generate directory structure
        const currentDir = process.cwd();
        const treeExecutor = this.skills.get('repo_spec_zero_build_tree');
        let repoStructure = "";
        if (treeExecutor) {
            repoStructure = await treeExecutor.execute<string>({ repoPath: workDir });
        }

        // 4. Execution Plan (Topological Sort)
        // We assume subAgents are populated with our 17 agents.
        // We need to order them based on `contextDeps`.
        // Let's create a map of id -> agent
        const agentMap = new Map(this.subAgents.map(a => [a.id, a]));
        const results: Record<string, string> = {};

        const executionOrder = this.getExecutionOrder(this.subAgents);

        await this.notify(client, `Starting analysis with ${executionOrder.length} agents...`);

        // 5. Execute Swarm
        let index = 0;
        for (const agentId of executionOrder) {
            index++;
            const agent = agentMap.get(agentId);
            if (!agent) continue;

            await this.notify(client, `[${index}/${executionOrder.length}] Running ${agent.name}...`);

            // Pass results of dependencies
            // `process` method signature: (context)
            // We need to inject params into a new context or pass them somehow.
            // BaseAgent.process takes context.

            const agentParams = {
                repoStructure,
                projectSlug,
                baseDir: workDir, // Write spec into temp dir for now? Or where? plan says `{project}-spec/`.
                repoType,
                allResults: results
            };

            const agentContext: AgentContext = {
                ...context,
                params: agentParams
            };

            const result = await agent.process(agentContext);
            if (!result.success) {
                await this.notify(client, `⚠️ Agent ${agent.name} failed: ${result.message}`);
                // define if we abort or continue?
                // continue for now
            } else {
                results[agentId] = result.data.output;
            }
        }

        if (taskId) {
            await this.notify(client, `Updating ClickUp task ${taskId}...`);
            // Use TaskSpecAgent to update
            // We could construct a summary linkage or just "Analysis Complete".
            await this.taskSpecAgent.updateProgress(taskId, 'review', 'Analysis complete. Spec generated.', context);
        }

        const outputDir = path.join(workDir, `${projectSlug}-spec`);
        return {
            success: true,
            message: `Analysis Complete. Spec generated at ${outputDir}`,
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

    private async notify(client: any, message: string) {
        console.log(message);
        if (client && client.tui && client.tui.showToast) {
            try {
                await client.tui.showToast({
                    body: { title: 'RepoSpecZero', message, variant: 'info', duration: 3000 }
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
