import { z } from 'zod';
import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import { AgentRegistry, SkillExecutor } from './agents/base.js';

// v2.1.0: Core Components
export { SharedContext, type ContextParams, type AgentOutput, type KeyFile } from './core/context.js';
export { FeatureDetector } from './core/feature-detector.js';
export { PromptLoader, createPromptLoader, type PromptMetadata, type LoadedPrompt } from './core/prompt-loader.js';
export { PromptRegistry, createPromptRegistry } from './core/prompt-registry.js';
export { DAGExecutor, DEFAULT_DAG, GENERATION_DAG, AUDIT_DAG, selectDAG, createCustomDAG, type DAGNode, type DAGDefinition } from './core/dag-executor.js';
export { OutputValidator, validateOutput, validateAndFix } from './core/output-validator.js';
export { SmartDAGPlanner } from './core/smart-dag-planner.js';
export { TemplateLoader } from './core/template-loader.js';

// v2.1.0: Generic Analysis Agent
export { GenericAnalysisAgent } from './agents/generic-analysis.agent.js';

// v2.0.0: Commands
export { analyzeCommand, applyCommand, parseAnalyzeArgs, parseApplyArgs } from './commands/index.js';

// v2.0.0: Skills
export { SubmoduleManager } from './skills/submodule-manager.skill.js';

// Prompts (NEW)
export { getSystemContext, getFullSystemContext, getSummarySystemContext } from './prompts/system-context.js';
export { getOutputSchema, getFullOutputSchema, generateFrontmatter, parseFrontmatter } from './prompts/output-schema.js';

// Skills
import { SpecZeroDetectionSkill } from './skills/spec-zero-detection.skill.js';
import { NativeLLMSkill } from './skills/native-llm.skill.js';
import { BuildRepoTreeSkill } from './skills/build-repo-tree.skill.js';
import { OutputWriterSkill } from './skills/output-writer.skill.js';
import { GitSkill } from './skills/git.skill.js';
import { ReadRepoFileSkill } from './skills/read-repo-file.skill.js';

// Agents
import { RepoSpecZeroOrchestrator } from './agents/core/orchestrator.agent.js';
import { TaskSpecAgent } from './agents/core/task-spec.agent.js';
import { BootstrapAgent } from './agents/core/bootstrap.agent.js';

// v2.1.0: Core Infrastructure Agents
import { SubmoduleCheckAgent } from './agents/core/submodule-check.agent.js';
import { StructureBuilderAgent } from './agents/spec-zero/finalizer/structure-builder.agent.js';
import { WriteSpecsAgent } from './agents/spec-zero/finalizer/write-specs.agent.js';
import { AuditReportAgent } from './agents/spec-zero/finalizer/audit-report.agent.js';
import { ApplyChangesAgent } from './agents/spec-zero/finalizer/apply-changes.agent.js';
import { CommitPushAgent } from './agents/spec-zero/finalizer/commit-push.agent.js';

// Core v2.1.0: Registry
import { PromptRegistry } from './core/prompt-registry.js';

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

const RepoSpecZeroPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
    const { client } = input;
    console.log('RepoSpecZero Plugin v2.1.1 Initializing with Smart DAG execution...');

    // 1. Initialize Skills
    const detectionSkill = new SpecZeroDetectionSkill();
    const nativeLLMSkill = new NativeLLMSkill(client);
    const readRepoFileSkill = new ReadRepoFileSkill();

    const pluginRoot = process.cwd();
    const registry = new PromptRegistry(pluginRoot);

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

    const readFileSkillExecutor: SkillExecutor = {
        execute: async (params: any): Promise<any> => {
            return readRepoFileSkill.execute(params);
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

    // 3. Register SpecZero Agents as Sub-Agents (v2.1.0: Core agents only)
    const specAgents = [
        // v2.0.0: Layer 0 - Submodule management
        new SubmoduleCheckAgent(),
        
        // Layer 1: Bootstrap
        new BootstrapAgent(),     // Layer 1
        
        // v2.0.0: Layer 9-12 - Finalizers & Core
        new StructureBuilderAgent(), // Layer 9 (Structure Builder)
        new WriteSpecsAgent(),     // Generation mode
        new AuditReportAgent(),    // Audit mode
        new CommitPushAgent(),     // Both modes
        new ApplyChangesAgent(),   // Apply command (not in DAG)
    ];

    specAgents.forEach(agent => {
        agent.registerSkill('native_llm', nativeLLMSkill);
        agent.registerSkill('repo_spec_zero_write_output', writerSkillExecutor);
        agent.registerSkill('repo_spec_zero_read_file', readFileSkillExecutor);
        orchestrator.registerSubAgent(agent);
    });

    // Also register skills to orchestrator
    orchestrator.registerSkill('repo_spec_zero_build_tree', treeSkillExecutor);

    // 4. Build Agent Tools Dynamic Map (v2.1.0: Load from PromptRegistry)
    const agentTools: Record<string, any> = {};

    // Register tools for Core Agents
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

    // Register tools for all prompts in Registry (Dynamic Analysis Agents)
    registry.list().forEach(promptDef => {
        // Map slash to underscore for tool name (e.g. analysis/overview -> analysis_overview)
        const toolId = promptDef.id.replace(/\//g, '_');
        const toolName = `repo_spec_zero_agent_${toolId}`;
        
        // Skip if already registered as core agent
        if (agentTools[toolName]) return;

        agentTools[toolName] = {
            description: `[Analysis] ${promptDef.id}: ${promptDef.category} analysis for ${promptDef.produces.join(', ')}`,
            args: {
                repoPath: z.string().describe('Path to the repository.').optional(),
                contextData: z.string().describe('JSON string of previous results.').optional()
            },
            execute: async (params: any): Promise<string> => {
                return `Analysis agent ${promptDef.id} is available via the 'repo_spec_zero_analyze' tool which manages the full DAG.`;
            }
        };
    });

    // 5. Delegation Tool
    const delegationTool = {
        'repo_spec_zero_delegate': {
            description: 'Delegate a request to a specific SpecZero sub-agent or the orchestrator.',
            args: {
                query: z.string().describe('The user query or intent.'),
                preferredAgent: z.string().describe('ID of the agent to delegate to (e.g. "overview", "api", "analysis/entities").').optional(),
                repoPath: z.string().describe('Path to the repo to contextuaize.').optional()
            },
            execute: async ({ query, preferredAgent, repoPath }: { query: string; preferredAgent?: string; repoPath?: string }): Promise<string> => {

                // If preferred agent exists, call it
                if (preferredAgent) {
                    // Try direct ID match first, then underscore mapping
                    let toolName = `repo_spec_zero_agent_${preferredAgent}`;
                    if (!agentTools[toolName]) {
                        toolName = `repo_spec_zero_agent_${preferredAgent.replace(/\//g, '_')}`;
                    }

                    if (agentTools[toolName]) {
                        return await agentTools[toolName].execute({
                            baseDir: repoPath,
                            projectSlug: repoPath ? 'unknown-delegated' : undefined
                        });
                    }
                    
                    // Try legacy mapping
                    const legacyMapping: Record<string, string> = {
                        'overview': 'analysis_overview',
                        'module': 'analysis_modules',
                        'entity': 'analysis_entities',
                        'db': 'data_detect-schema',
                        'api': 'api_detect-endpoints'
                    };
                    const mappedId = legacyMapping[preferredAgent];
                    if (mappedId && agentTools[`repo_spec_zero_agent_${mappedId}`]) {
                        return await agentTools[`repo_spec_zero_agent_${mappedId}`].execute({
                            baseDir: repoPath,
                            projectSlug: repoPath ? 'unknown-delegated' : undefined
                        });
                    }

                    return `Error: Agent ${preferredAgent} not found.`;
                }

                // Fallback: list all available agents (Core + Dynamic)
                const coreIds = specAgents.map(a => a.id);
                const dynamicIds = registry.list().map(p => p.id);
                return `Auto-routing not yet implemented. Please specify 'preferredAgent'. \nCore: ${coreIds.join(', ')}\nAnalysis: ${dynamicIds.join(', ')}`;
            }
        }
    };

    return {
        tool: {
            // Main entry point
            'repo_spec_zero_analyze': {
                description: 'Analyze a repository to generate Spec Zero documentation.',
                args: {
                    repoUrl: z.string().describe('The Git URL of the repository to analyze (will be cloned).').optional(),
                    repoPath: z.string().describe('Absolute path to a local repository (use this OR repoUrl, not both).').optional(),
                    targetDir: z.string().describe('Directory where to clone the repo and generate output. Required when using repoUrl.').optional(),
                    taskId: z.string().describe('Optional task ID (e.g. from ClickUp) to update progress on.').optional(),
                    
                    // v2.1.0: New flags
                    smartDag: z.boolean().describe('Use SmartDAGPlanner for dynamic agent selection (default: true)').optional(),
                    diagrams: z.enum(['inline', 'standalone', 'both', 'none']).describe('Diagram output mode (default: both)').optional(),
                    template: z.string().describe('Template ID to use for output (overrides prompt default)').optional(),
                    skipAgents: z.array(z.string()).describe('Agent IDs to explicitly skip').optional(),
                },
                execute: async (params: { 
                    repoUrl?: string; 
                    repoPath?: string; 
                    targetDir?: string; 
                    taskId?: string;
                    smartDag?: boolean;
                    diagrams?: 'inline' | 'standalone' | 'both' | 'none';
                    template?: string;
                    skipAgents?: string[];
                }): Promise<string> => {
                    // Input validation to prevent undefined values propagating
                    const validParams = {
                        repoUrl: params.repoUrl?.trim() || undefined,
                        repoPath: params.repoPath?.trim() || undefined,
                        targetDir: params.targetDir?.trim() || undefined,
                        taskId: params.taskId?.trim() || undefined,
                        // v2.1.0 flags
                        smartDag: params.smartDag !== undefined ? params.smartDag : true,
                        diagrams: params.diagrams || 'both',
                        template: params.template,
                        skipAgents: params.skipAgents || [],
                        pluginVersion: '2.1.0'
                    };

                    // Validation: if repoUrl is provided, targetDir should also be provided
                    if (validParams.repoUrl && !validParams.targetDir) {
                        return 'Error: When using repoUrl, you must also specify targetDir (the directory where the repo will be cloned and analyzed).';
                    }

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
                            title: 'RepoSpecZero v2.1.1',
                            message: 'Spec-Zero Plugin with Smart DAG execution is ready.',
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

// Default export for ESM
export default RepoSpecZeroPlugin;

// Named export (OpenCode uses named exports)
export { RepoSpecZeroPlugin };

// Alias for backward compatibility
export const plugin = RepoSpecZeroPlugin;
