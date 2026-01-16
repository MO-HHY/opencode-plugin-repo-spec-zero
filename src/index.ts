import { z } from 'zod';
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

/**
 * Helper to convert agent result to string for OpenCode tool response.
 * OpenCode tools MUST return Promise<string>, not objects.
 */
function resultToString(result: any): string {
    if (typeof result === 'string') {
        return result;
    }
    if (result === null || result === undefined) {
        return 'No result';
    }
    // If it's our standard result object
    if (typeof result === 'object') {
        if (result.success === false) {
            return `Error: ${result.message || result.error || 'Unknown error'}`;
        }
        if (result.success === true) {
            // Return the message or stringify data
            if (result.message) {
                return result.message;
            }
            if (result.data) {
                if (typeof result.data === 'string') {
                    return result.data;
                }
                return JSON.stringify(result.data, null, 2);
            }
            return 'Success';
        }
        // Generic object - stringify it
        return JSON.stringify(result, null, 2);
    }
    return String(result);
}

const plugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
    const { client } = input;
    console.log('RepoSpecZero Plugin Initializing...');

    // 1. Initialize Skills
    const detectionSkill = new SpecZeroDetectionSkill();
    const nativeLLMSkill = new NativeLLMSkill(client);

    // Writer Skill Executor (Mock for internal writes, but orchestrated via Node fs usually)
    const writerSkillExecutor: SkillExecutor = {
        execute: async (params: any): Promise<any> => {
            return { success: true };
        }
    };

    const treeSkill = new BuildRepoTreeSkill();
    const treeSkillExecutor: SkillExecutor = {
        execute: async (params: any): Promise<any> => {
            try {
                const tree = treeSkill.generateTree(params.repoPath);  // Sync function - no await!
                if (!tree || typeof tree !== 'string') {
                    return { success: false, error: 'Failed to generate tree' };
                }
                return { success: true, data: tree };
            } catch (error: any) {
                return { success: false, error: `Tree generation failed: ${error.message}` };
            }
        }
    };

    const gitSkill = new GitSkill(console);

    // 2. Initialize Agents
    const taskSpecAgent = new TaskSpecAgent();

    const orchestrator = new RepoSpecZeroOrchestrator(
        detectionSkill,
        gitSkill,
        taskSpecAgent
    );

    // 3. Register SpecZero Agents as Sub-Agents
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
        agent.registerSkill('native_llm', nativeLLMSkill);
        agent.registerSkill('repo_spec_zero_write_output', writerSkillExecutor);
        orchestrator.registerSubAgent(agent);
    });

    // Also register skills to orchestrator
    orchestrator.registerSkill('repo_spec_zero_build_tree', treeSkillExecutor);

    // 4. Build Agent Tools Dynamic Map
    const agentTools: Record<string, any> = {};

    specAgents.forEach(agent => {
        const toolName = `repo_spec_zero_agent_${agent.id}`;
        agentTools[toolName] = {
            description: `[Agent] ${agent.name}: ${agent.description}`,
            args: {
                projectSlug: z.string().describe('Project slug (e.g. my-repo).').optional(),
                baseDir: z.string().describe('Base directory of the repo analysis (where output goes).').optional(),
                repoStructure: z.string().describe('Repository file structure string.').optional(),
                repoType: z.string().describe('Detected repository type.').optional(),
                contextData: z.string().describe('JSON string of previous agent results if needed.').optional()
            },
            execute: async (params: any): Promise<string> => {
                // DEFENSIVE: Ensure all string params have defaults to prevent undefined.split() errors
                const safeParams = {
                    ...params,
                    baseDir: String(params.baseDir || process.cwd()),
                    projectSlug: String(params.projectSlug || 'unknown-manual-run'),
                    repoStructure: String(params.repoStructure || 'No structure provided - agent called directly'),
                    repoType: String(params.repoType || 'generic'),
                    allResults: params.contextData ? JSON.parse(params.contextData) : {}
                };

                const context = {
                    client,
                    params: safeParams,
                    messages: [],
                    intent: { name: agent.id, confidence: 1.0 }
                };
                const result = await agent.process(context as any);
                return resultToString(result);
            }
        };
    });

    // 5. Delegation Tool
    const delegationTool = {
        'repo_spec_zero_delegate': {
            description: 'Delegate a request to a specific SpecZero sub-agent or the orchestrator.',
            args: {
                query: z.string().describe('The user query or intent.'),
                preferredAgent: z.string().describe('ID of the agent to delegate to (e.g. "overview", "api").').optional(),
                repoPath: z.string().describe('Path to the repo to contextuaize.').optional()
            },
            execute: async ({ query, preferredAgent, repoPath }: { query: string; preferredAgent?: string; repoPath?: string }): Promise<string> => {

                // If preferred agent exists, call it
                if (preferredAgent) {
                    const toolName = `repo_spec_zero_agent_${preferredAgent}`;
                    if (agentTools[toolName]) {
                        return await agentTools[toolName].execute({
                            baseDir: repoPath,
                            projectSlug: repoPath ? 'unknown-delegated' : undefined
                        });
                    }
                    return `Error: Agent ${preferredAgent} not found.`;
                }

                // Fallback: analyze request to pick agent (Simple Router)
                // For now, just return list of agents suggestions
                const validAgents = specAgents.map(a => a.id).join(', ');
                return `Auto-routing not yet implemented. Please specify 'preferredAgent'. Available: ${validAgents}`;
            }
        }
    };

    return {
        tool: {
            // Main entry point
            'repo_spec_zero_analyze': {
                description: 'Analyze a repository to generate Spec Zero documentation.',
                args: {
                    repoUrl: z.string().describe('The Git URL of the repository to analyze.').optional(),
                    repoPath: z.string().describe('Absolute path to a local repository (defaults to current working directory).').optional(),
                    taskId: z.string().describe('Optional task ID (e.g. from ClickUp) to update progress on.').optional()
                },
                execute: async (params: { repoUrl?: string; repoPath?: string; taskId?: string }): Promise<string> => {
                    // Input validation to prevent undefined values propagating
                    const validParams = {
                        repoUrl: params.repoUrl?.trim() || undefined,
                        repoPath: params.repoPath?.trim() || undefined,
                        taskId: params.taskId?.trim() || undefined
                    };

                    const context = {
                        client,
                        params: validParams,
                        messages: [],
                        intent: { name: 'analyze_repo', confidence: 1.0 }
                    };
                    const result = await orchestrator.process(context as any);
                    return resultToString(result);
                }
            },

            // Debugging tool
            'repo_spec_zero_detect_type': {
                description: 'Detect the type of repository (library, service, etc).',
                args: {
                    repoPath: z.string().describe('Absolute path to the repository.')
                },
                execute: async ({ repoPath }: { repoPath: string }): Promise<string> => {
                    const result = await detectionSkill.detect(repoPath);
                    return String(result);
                }
            },

            // Sub-Agent Tools
            ...agentTools,

            // Delegation Tool
            ...delegationTool
        },
        // Event handling
        event: async ({ event }) => {
            if (event.type === 'session.created') {
                try {
                    await client.tui.showToast({
                        body: {
                            title: 'RepoSpecZero Active',
                            message: 'Repo Spec Zero Plugin v0.1.14 is ready.',
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
