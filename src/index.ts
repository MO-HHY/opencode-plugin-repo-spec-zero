import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import { AgentRegistry, SkillExecutor } from './agents/base.js';

// Skills
import { SpecZeroDetectionSkill } from './skills/spec-zero-detection.skill.js';
import { NativeLLMSkill } from './skills/native-llm.skill.js';
import { BuildRepoTreeSkill } from './skills/build-repo-tree.skill.js';
import { OutputWriterSkill } from './skills/output-writer.skill.js';
import { GitSkill } from './skills/git.skill.js';

// Agents
import { RepoSpecZeroOrchestrator } from './agents/core/orchestrator.agent.js';
import { TaskSpecAgent } from './agents/core/task-spec.agent.js';

// SpecZero Agents
import { OverviewAgent } from './agents/spec-zero/core/overview.agent.js';
import { ModuleAgent } from './agents/spec-zero/core/module.agent.js';
import { EntityAgent } from './agents/spec-zero/core/entity.agent.js';
import { DbAgent } from './agents/spec-zero/data/db.agent.js';
import { DataMapAgent } from './agents/spec-zero/data/data-map.agent.js';
import { EventAgent } from './agents/spec-zero/data/event.agent.js';
import { ApiAgent } from './agents/spec-zero/integration/api.agent.js';
import { DependencyAgent } from './agents/spec-zero/integration/dependency.agent.js';
import { ServiceDepAgent } from './agents/spec-zero/integration/service-dep.agent.js';
import { AuthAgent } from './agents/spec-zero/security/auth.agent.js';
import { AuthzAgent } from './agents/spec-zero/security/authz.agent.js';
import { SecurityAgent } from './agents/spec-zero/security/security.agent.js';
import { PromptSecAgent } from './agents/spec-zero/security/prompt-sec.agent.js';
import { DeploymentAgent } from './agents/spec-zero/ops/deployment.agent.js';
import { MonitorAgent } from './agents/spec-zero/ops/monitor.agent.js';
import { MlAgent } from './agents/spec-zero/ops/ml.agent.js';
import { FlagAgent } from './agents/spec-zero/ops/flag.agent.js';

const plugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
    const { client } = input;
    console.log('RepoSpecZero Plugin Initializing...');

    // 1. Initialize Skills
    const detectionSkill = new SpecZeroDetectionSkill();

    const nativeLLMSkill = new NativeLLMSkill(client);

    const writerSkillOriginal = new OutputWriterSkill();
    const writerSkillExecutor: SkillExecutor = {
        execute: async (params: any): Promise<any> => {
            return { success: true };
        }
    };

    const treeSkill = new BuildRepoTreeSkill();
    const treeSkillExecutor: SkillExecutor = {
        execute: async (params: any): Promise<any> => {
            const tree = await treeSkill.generateTree(params.repoPath);
            return { success: true, data: tree };
        }
    };

    const gitSkill = new GitSkill(console);

    // 2. Initialize Agents
    const taskSpecAgent = new TaskSpecAgent();
    // TaskSpecAgent needs `client` in context, which is passed in `process`.

    const orchestrator = new RepoSpecZeroOrchestrator(
        detectionSkill,
        gitSkill,
        taskSpecAgent
    );

    // 3. Register SpecZero Agents as Sub-Agents
    // Order doesn't strictly matter here, orchestrator handles topological sort.
    const specAgents = [
        new OverviewAgent(),
        new ModuleAgent(),
        new EntityAgent(),
        new DbAgent(),
        new DataMapAgent(),
        new EventAgent(),
        new ApiAgent(),
        new DependencyAgent(),
        new ServiceDepAgent(),
        new AuthAgent(),
        new AuthzAgent(),
        new SecurityAgent(),
        new PromptSecAgent(),
        new DeploymentAgent(),
        new MonitorAgent(),
        new MlAgent(),
        new FlagAgent()
    ];

    specAgents.forEach(agent => {
        // Register required skills
        agent.registerSkill('native_llm', nativeLLMSkill);
        agent.registerSkill('repo_spec_zero_write_output', writerSkillExecutor);

        // Register as sub-agent
        // The orchestrator class I implemented extends BaseAgent.
        // BaseAgent has `registerSubAgent`.
        orchestrator.registerSubAgent(agent);
    });

    // Also register skills to orchestrator so they propagate if we add more sub-agents later
    orchestrator.registerSkill('repo_spec_zero_build_tree', treeSkillExecutor);


    return {
        tool: {
            // Main entry point
            'repo_spec_zero_analyze': async (params: { repoUrl?: string, taskId?: string }): Promise<any> => {
                // Create context with client
                const context = {
                    client,
                    params,
                    messages: [], // Empty for tool call
                    intent: { name: 'analyze_repo', confidence: 1.0 }
                };
                return await orchestrator.process(context as any);
            },

            // Expose internal tools for debugging or direct use
            'repo_spec_zero_detect_type': async ({ repoPath }: { repoPath: string }): Promise<any> => {
                return await detectionSkill.detect(repoPath);
            },
        } as any,
        // Event handling
        event: async ({ event }) => {
            if (event.type === 'session.created') {
                try {
                    await client.tui.showToast({
                        body: {
                            title: 'RepoSpecZero Active',
                            message: 'Repo Spec Zero Plugin is ready.',
                            variant: 'info',
                            duration: 3000,
                        },
                    });
                } catch (e) {
                    console.error('Failed to show toast', e);
                }
            }
        },
    };
};

export default plugin;
