import type { Plugin } from '@opencode-ai/plugin';
export { SharedContext, type ContextParams, type AgentOutput, type KeyFile } from './core/context.js';
export { FeatureDetector } from './core/feature-detector.js';
export { PromptLoader, createPromptLoader, type PromptMetadata, type LoadedPrompt } from './core/prompt-loader.js';
export { DAGExecutor, DEFAULT_DAG, GENERATION_DAG, AUDIT_DAG, selectDAG, createCustomDAG, type DAGNode, type DAGDefinition } from './core/dag-executor.js';
export { OutputValidator, validateOutput, validateAndFix } from './core/output-validator.js';
export { SmartDAGPlanner } from './core/smart-dag-planner.js';
export { TemplateLoader } from './core/template-loader.js';
export { GenericAnalysisAgent } from './agents/generic-analysis.agent.js';
export { analyzeCommand, applyCommand, parseAnalyzeArgs, parseApplyArgs } from './commands/index.js';
export { SubmoduleManager } from './skills/submodule-manager.skill.js';
export { getSystemContext, getFullSystemContext, getSummarySystemContext } from './prompts/system-context.js';
export { getOutputSchema, getFullOutputSchema, generateFrontmatter, parseFrontmatter } from './prompts/output-schema.js';
declare const RepoSpecZeroPlugin: Plugin;
export default RepoSpecZeroPlugin;
export { RepoSpecZeroPlugin };
export declare const plugin: Plugin;
//# sourceMappingURL=index.d.ts.map