/**
 * DAG Executor - Directed Acyclic Graph execution engine for agents
 * 
 * Features:
 * - Topological sorting for dependency resolution
 * - Parallel execution within layers
 * - Shared context propagation
 * - Progress tracking and logging
 * - v2.0.0: GENERATION and AUDIT mode DAGs with submodule support
 */

import type { SharedContext, AgentOutput } from './context.js';
import type { BaseAgent } from '../agents/base.js';
import type { 
    DAGNode, DAGDefinition, DAGExecutionResult, DAGExecutionSummary, 
    PromptVersion, SpecZeroMode, SkipResult, DetectedFeatures, PlannedAgent 
} from '../types.js';
import { SmartDAGPlanner } from './smart-dag-planner.js';

// Re-export types for convenience
export type { DAGNode, DAGDefinition };

/**
 * Analysis nodes shared between GENERATION and AUDIT modes
 * These agents perform the actual codebase analysis
 */
const ANALYSIS_NODES: DAGNode[] = [
    // Layer 2: Overview (depends on bootstrap/submodule_check)
    { agentId: 'overview', dependencies: ['bootstrap'] },
    
    // Layer 3: Core analysis (parallel, depend on overview)
    { agentId: 'module', dependencies: ['overview'], parallel: true },
    { agentId: 'entity', dependencies: ['overview'], parallel: true },
    
    // Layer 4: Data layer (depend on module + entity)
    { agentId: 'db', dependencies: ['module', 'entity'], parallel: true },
    { agentId: 'data_map', dependencies: ['module', 'entity'], parallel: true },
    { agentId: 'event', dependencies: ['module', 'entity'], parallel: true },
    
    // Layer 5: Integration (depend on data layer)
    { agentId: 'api', dependencies: ['db', 'entity'], parallel: true },
    { agentId: 'dependency', dependencies: ['module'], parallel: true },
    { agentId: 'service_dep', dependencies: ['api'], parallel: true },
    
    // Layer 6: Security (depend on api)
    { agentId: 'auth', dependencies: ['api'], parallel: true },
    { agentId: 'authz', dependencies: ['auth'], parallel: true },
    { agentId: 'security', dependencies: ['api', 'db'], parallel: true },
    { agentId: 'prompt_sec', dependencies: ['api'], parallel: true, optional: true },
    
    // Layer 7: Ops (depend on various)
    { agentId: 'deployment', dependencies: ['module', 'dependency'], parallel: true },
    { agentId: 'monitor', dependencies: ['api', 'db'], parallel: true },
    { agentId: 'ml', dependencies: ['api', 'data_map'], parallel: true, optional: true },
    { agentId: 'flag', dependencies: ['module'], parallel: true, optional: true },
    
    // Layer 8: Summary (depends on all analysis)
    { agentId: 'summary', dependencies: ['*'] }
];

/**
 * v2.0.0: GENERATION Mode DAG
 * First-time analysis: creates submodule, runs analysis, writes specs, commits
 */
export const GENERATION_DAG: DAGDefinition = {
    version: '2.0.0',
    nodes: [
        // Layer 0: Submodule check (creates submodule if needed)
        { agentId: 'submodule_check', dependencies: [] },
        
        // Layer 1: Bootstrap (reads key files)
        { agentId: 'bootstrap', dependencies: ['submodule_check'] },
        
        // Layers 2-8: Analysis nodes
        ...ANALYSIS_NODES,
        
        // Layer 9: Structure Builder (prepares hierarchical folders)
        {
            agentId: 'structure_builder',
            dependencies: ['summary'],
            parallel: false,
            optional: false,
        },
        
        // Layer 10: Write specs to _generated/
        {
            agentId: 'write_specs',
            dependencies: ['structure_builder'],
            parallel: false,
            optional: false,
        },
        
        // Layer 11: Commit and push
        { agentId: 'commit_push', dependencies: ['write_specs'] }
    ]
};

/**
 * v2.0.0: AUDIT Mode DAG
 * Subsequent analyses: loads existing specs, runs analysis, generates audit report
 */
export const AUDIT_DAG: DAGDefinition = {
    version: '2.0.0',
    nodes: [
        // Layer 0: Submodule check (loads existing specs for comparison)
        { agentId: 'submodule_check', dependencies: [] },
        
        // Layer 1: Bootstrap (reads key files + existing specs context)
        { agentId: 'bootstrap', dependencies: ['submodule_check'] },
        
        // Layers 2-8: Analysis nodes (same as generation)
        ...ANALYSIS_NODES,
        
        // Layer 9: Generate audit report (compares with existing)
        { agentId: 'audit_report', dependencies: ['summary'] },
        
        // Layer 10: Commit and push (only audit report)
        { agentId: 'commit_push', dependencies: ['audit_report'] }
    ]
};

/**
 * Legacy/Default DAG (v1.x compatibility)
 * @deprecated Use GENERATION_DAG or AUDIT_DAG for v2.0.0
 */
export const DEFAULT_DAG: DAGDefinition = {
    version: '1.0.0',
    nodes: [
        // Layer 0: Bootstrap (no deps) - reads key files into context
        { agentId: 'bootstrap', dependencies: [] },
        
        // Layer 1: Overview (depends on bootstrap)
        { agentId: 'overview', dependencies: ['bootstrap'] },
        
        // Layer 2: Core analysis (parallel, depend on overview)
        { agentId: 'module', dependencies: ['overview'], parallel: true },
        { agentId: 'entity', dependencies: ['overview'], parallel: true },
        
        // Layer 3: Data layer (depend on module + entity)
        { agentId: 'db', dependencies: ['module', 'entity'], parallel: true },
        { agentId: 'data_map', dependencies: ['module', 'entity'], parallel: true },
        { agentId: 'event', dependencies: ['module', 'entity'], parallel: true },
        
        // Layer 4: Integration (depend on data layer)
        { agentId: 'api', dependencies: ['db', 'entity'], parallel: true },
        { agentId: 'dependency', dependencies: ['module'], parallel: true },
        { agentId: 'service_dep', dependencies: ['api'], parallel: true },
        
        // Layer 5: Security (depend on api)
        { agentId: 'auth', dependencies: ['api'], parallel: true },
        { agentId: 'authz', dependencies: ['auth'], parallel: true },
        { agentId: 'security', dependencies: ['api', 'db'], parallel: true },
        { agentId: 'prompt_sec', dependencies: ['api'], parallel: true, optional: true },
        
        // Layer 6: Ops (depend on various)
        { agentId: 'deployment', dependencies: ['module', 'dependency'], parallel: true },
        { agentId: 'monitor', dependencies: ['api', 'db'], parallel: true },
        { agentId: 'ml', dependencies: ['api', 'data_map'], parallel: true, optional: true },
        { agentId: 'flag', dependencies: ['module'], parallel: true, optional: true },
        
        // Layer 7: Finalizer (depends on all)
        { agentId: 'summary', dependencies: ['*'] }  // * = all previous
    ]
};

/**
 * Select appropriate DAG based on mode
 */
export function selectDAG(mode: SpecZeroMode): DAGDefinition {
    switch (mode) {
        case 'generation':
            return GENERATION_DAG;
        case 'audit':
            return AUDIT_DAG;
        default:
            return GENERATION_DAG;
    }
}

export interface DAGExecutorOptions {
    onProgress?: (agentId: string, status: 'start' | 'success' | 'error' | 'skip', message?: string) => void;
    onLayerStart?: (layer: number, agents: string[]) => void;
    onLayerComplete?: (layer: number, results: DAGExecutionResult[]) => void;
    skipOptionalOnFailure?: boolean;
    /** v2.0.0: Operation mode (generation/audit) */
    mode?: SpecZeroMode;
    /** v2.0.0: Specs folder name */
    specsFolder?: string;
    /** v2.0.0: Plugin version */
    pluginVersion?: string;
    /** v2.0.0: Skip push operations */
    noPush?: boolean;
    /** v2.1.0: Smart planner for skip logic */
    planner?: SmartDAGPlanner;
    /** v2.1.0: Detected features for skip logic */
    features?: DetectedFeatures;
}

export class DAGExecutor {
    private dag: DAGDefinition;
    private context: SharedContext;
    private agents: Map<string, BaseAgent>;
    private options: DAGExecutorOptions;
    private executionResults: DAGExecutionResult[] = [];
    /** v2.0.0: Detected mode after submodule check */
    private detectedMode: SpecZeroMode = 'generation';
    /** v2.1.0: Tracking for skip logic */
    private completedAgents = new Set<string>();
    private failedAgents = new Set<string>();
    
    constructor(
        dag: DAGDefinition,
        context: SharedContext,
        agents: Map<string, BaseAgent>,
        options: DAGExecutorOptions = {}
    ) {
        this.dag = dag;
        this.context = context;
        this.agents = agents;
        this.options = options;
        this.detectedMode = options.mode || 'generation';
    }

    /**
     * Update mode after submodule check
     */
    setMode(mode: SpecZeroMode): void {
        this.detectedMode = mode;
    }

    /**
     * Get current mode
     */
    getMode(): SpecZeroMode {
        return this.detectedMode;
    }

    /**
     * Compute execution layers (topologically sorted)
     */
    getLayers(): string[][] {
        const layers: string[][] = [];
        const executed = new Set<string>();
        const remaining = new Set(this.dag.nodes.map(n => n.agentId));
        
        while (remaining.size > 0) {
            const layer: string[] = [];
            
            for (const node of this.dag.nodes) {
                if (executed.has(node.agentId)) continue;
                if (!remaining.has(node.agentId)) continue;
                
                // Handle '*' (all previous) - only ready when it's the last one
                if (node.dependencies.includes('*')) {
                    if (remaining.size === 1) {
                        layer.push(node.agentId);
                    }
                    continue;
                }
                
                // Check if all dependencies are satisfied
                const allDepsExecuted = node.dependencies.every(d => executed.has(d));
                
                if (allDepsExecuted) {
                    layer.push(node.agentId);
                }
            }
            
            if (layer.length === 0 && remaining.size > 0) {
                // Check for missing agents
                const missingDeps = new Set<string>();
                for (const nodeId of remaining) {
                    const node = this.dag.nodes.find(n => n.agentId === nodeId);
                    if (node) {
                        for (const dep of node.dependencies) {
                            if (dep !== '*' && !executed.has(dep) && !this.agents.has(dep)) {
                                missingDeps.add(dep);
                            }
                        }
                    }
                }
                
                if (missingDeps.size > 0) {
                    console.warn(`[DAG] Missing agents: ${Array.from(missingDeps).join(', ')}. Skipping dependent nodes.`);
                    // Skip nodes that depend on missing agents
                    for (const nodeId of Array.from(remaining)) {
                        const node = this.dag.nodes.find(n => n.agentId === nodeId);
                        if (node) {
                            const hasMissingDep = node.dependencies.some(d => missingDeps.has(d));
                            if (hasMissingDep) {
                                remaining.delete(nodeId);
                            }
                        }
                    }
                    continue;
                }
                
                throw new Error(`Circular dependency detected in DAG. Remaining: ${Array.from(remaining).join(', ')}`);
            }
            
            if (layer.length > 0) {
                layers.push(layer);
                layer.forEach(id => {
                    executed.add(id);
                    remaining.delete(id);
                });
            }
        }
        
        return layers;
    }

    /**
     * Get dependencies for a specific agent
     */
    getDependencies(agentId: string): string[] {
        const node = this.dag.nodes.find(n => n.agentId === agentId);
        if (!node) return [];
        
        if (node.dependencies.includes('*')) {
            // Return all executed agents
            return this.context.getExecutedAgentIds();
        }
        
        return node.dependencies;
    }

    /**
     * Execute a single agent
     */
    private async executeAgent(
        agentId: string,
        client: any
    ): Promise<DAGExecutionResult> {
        const startTime = Date.now();
        const agent = this.agents.get(agentId);
        
        if (!agent) {
            return {
                agentId,
                success: false,
                durationMs: 0,
                error: `Agent ${agentId} not found in registry`
            };
        }

        this.options.onProgress?.(agentId, 'start');
        
        try {
            const dependencies = this.getDependencies(agentId);
            const agentContext = this.context.buildAgentContext(dependencies);
            
            // Build enhanced context for agent
            const enhancedContext = {
                client,
                params: {
                    repoStructure: this.context.repoStructure,
                    projectSlug: this.context.projectSlug,
                    baseDir: this.context.baseDir,
                    repoType: this.context.repoType,
                    allResults: this.buildAllResults(),
                    // New DAG-specific params
                    sharedContext: this.context,
                    previousResults: agentContext,
                    dependencies,
                    // v2.0.0: Mode and specs params
                    mode: this.detectedMode,
                    specsFolder: this.options.specsFolder || 'specs',
                    pluginVersion: this.options.pluginVersion || '2.0.0',
                    noPush: this.options.noPush || false,
                },
                messages: [],
                intent: null
            };
            
            const result = await agent.process(enhancedContext);
            const durationMs = Date.now() - startTime;
            
            // v2.0.0: Update mode if submodule_check agent detected it
            if (agentId === 'submodule_check' && result.success && result.data?.mode) {
                this.setMode(result.data.mode);
                console.log(`[DAG] Mode detected: ${this.detectedMode}`);
            }
            
            if (!result.success) {
                this.options.onProgress?.(agentId, 'error', result.message);
                return {
                    agentId,
                    success: false,
                    durationMs,
                    error: result.message
                };
            }
            
            // Register output in context
            if (result.data) {
                const output: AgentOutput = {
                    agentId,
                    filePath: result.data.path || '',
                    summary: this.extractSummary(result.data.output || JSON.stringify(result.data)),
                    fullContent: result.data.output || JSON.stringify(result.data),
                    promptVersion: result.data.promptVersion || { id: agentId, version: '1', hash: 'unknown' },
                    diagrams: result.data.diagrams,
                    timestamp: new Date()
                };
                this.context.registerOutput(output);
            }
            
            this.options.onProgress?.(agentId, 'success');
            
            return {
                agentId,
                success: true,
                durationMs,
                output: result.data ? {
                    agentId,
                    filePath: result.data.path || '',
                    summary: this.extractSummary(result.data.output || ''),
                    fullContent: result.data.output || '',
                    promptVersion: result.data.promptVersion || { id: agentId, version: '1', hash: 'unknown' },
                    diagrams: result.data.diagrams,
                    timestamp: new Date()
                } : undefined
            };
            
        } catch (error: any) {
            const durationMs = Date.now() - startTime;
            this.options.onProgress?.(agentId, 'error', error.message);
            
            return {
                agentId,
                success: false,
                durationMs,
                error: error.message
            };
        }
    }

    /**
     * Extract summary from output (first 500 chars or first paragraph)
     */
    private extractSummary(content: string, maxLength = 500): string {
        if (!content) return '';
        
        // Try to extract executive summary or first meaningful section
        const summaryMatch = content.match(/## Executive Summary\n([\s\S]*?)(?=\n##|$)/);
        if (summaryMatch) {
            return summaryMatch[1].trim().slice(0, maxLength);
        }
        
        // Otherwise, take first paragraph after frontmatter
        const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');
        const firstParagraph = withoutFrontmatter.split('\n\n')[0];
        
        return (firstParagraph || content).slice(0, maxLength);
    }

    /**
     * Build allResults map from context (for backwards compatibility)
     */
    private buildAllResults(): Record<string, string> {
        const results: Record<string, string> = {};
        for (const agentId of this.context.getExecutedAgentIds()) {
            const content = this.context.getFullContent(agentId);
            if (content) {
                results[agentId] = content;
            }
        }
        return results;
    }

    /**
     * Execute the entire DAG
     */
    async execute(client: any): Promise<DAGExecutionSummary> {
        const layers = this.getLayers();
        const allResults: DAGExecutionResult[] = [];
        const startTime = Date.now();
        
        // Reset tracking
        this.completedAgents.clear();
        this.failedAgents.clear();
        
        console.log(`[DAG] Executing ${this.dag.nodes.length} agents in ${layers.length} layers`);
        
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            console.log(`[DAG] Layer ${i + 1}/${layers.length}: ${layer.join(', ')}`);
            
            this.options.onLayerStart?.(i, layer);
            
            // Execute agents in parallel within layer
            const layerResults = await Promise.all(
                layer.map(async (agentId) => {
                    // v2.1.0: Check if agent should be skipped using SmartDAGPlanner
                    if (this.options.planner && this.options.features) {
                        const node = this.dag.nodes.find(n => n.agentId === agentId);
                        if (node) {
                            // Resolve '*' dependencies for the skip checker
                            let dependencies = node.dependencies;
                            if (dependencies.includes('*')) {
                                dependencies = this.dag.nodes
                                    .map(n => n.agentId)
                                    .filter(id => id !== agentId);
                            }

                            // Map DAGNode to a subset of PlannedAgent that shouldSkipAgent needs
                            const plannedAgent: Partial<PlannedAgent> = {
                                id: node.agentId,
                                dependencies: dependencies,
                                optional: node.optional || false
                            };
                            
                            const skipResult = this.options.planner.shouldSkipAgent(
                                plannedAgent as PlannedAgent,
                                this.options.features,
                                this.completedAgents,
                                this.failedAgents
                            );
                            
                            if (skipResult.skip) {
                                console.log(`[DAG] Skipping agent ${agentId}: ${skipResult.reason}`);
                                this.options.onProgress?.(agentId, 'skip', skipResult.reason);
                                return {
                                    agentId,
                                    success: true,
                                    skipped: true,
                                    skipReason: skipResult.reason,
                                    durationMs: 0
                                };
                            }
                        }
                    }

                    const result = await this.executeAgent(agentId, client);
                    
                    // Track for cascade skip logic
                    if (result.success && !result.skipped) {
                        this.completedAgents.add(agentId);
                    } else if (!result.success) {
                        this.failedAgents.add(agentId);
                    }
                    
                    return result;
                })
            );
            
            allResults.push(...layerResults);
            this.options.onLayerComplete?.(i, layerResults);
            
            // Log layer results
            const successful = layerResults.filter(r => r.success && !r.skipped).length;
            const skipped = layerResults.filter(r => r.skipped).length;
            const failed = layerResults.filter(r => !r.success).length;
            console.log(`[DAG] Layer ${i + 1} complete: ${successful} success, ${skipped} skipped, ${failed} failed`);
        }
        
        this.executionResults = allResults;
        
        const summary: DAGExecutionSummary = {
            totalAgents: this.dag.nodes.length,
            executed: allResults.filter(r => !r.skipped).length,
            successful: allResults.filter(r => r.success && !r.skipped).length,
            failed: allResults.filter(r => !r.success).length,
            skipped: allResults.filter(r => r.skipped).length + (this.dag.nodes.length - allResults.length),
            totalDurationMs: Date.now() - startTime,
            results: allResults
        };
        
        console.log(`[DAG] Execution complete: ${summary.successful} successful, ${summary.skipped} skipped, ${summary.failed} failed in ${summary.totalDurationMs}ms`);
        
        return summary;
    }

    /**
     * Get execution results
     */
    getResults(): DAGExecutionResult[] {
        return this.executionResults;
    }

    /**
     * Validate DAG definition (check for cycles, missing deps, etc.)
     */
    static validate(dag: DAGDefinition): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const agentIds = new Set(dag.nodes.map(n => n.agentId));
        
        for (const node of dag.nodes) {
            // Check for self-dependency
            if (node.dependencies.includes(node.agentId)) {
                errors.push(`Agent ${node.agentId} depends on itself`);
            }
            
            // Check for missing dependencies (except '*')
            for (const dep of node.dependencies) {
                if (dep !== '*' && !agentIds.has(dep)) {
                    errors.push(`Agent ${node.agentId} depends on unknown agent ${dep}`);
                }
            }
        }
        
        // Check for cycles using DFS
        const visited = new Set<string>();
        const recStack = new Set<string>();
        
        const hasCycle = (nodeId: string): boolean => {
            if (!visited.has(nodeId)) {
                visited.add(nodeId);
                recStack.add(nodeId);
                
                const node = dag.nodes.find(n => n.agentId === nodeId);
                if (node) {
                    for (const dep of node.dependencies) {
                        if (dep === '*') continue;
                        if (!visited.has(dep) && hasCycle(dep)) {
                            return true;
                        } else if (recStack.has(dep)) {
                            errors.push(`Circular dependency detected involving ${nodeId} and ${dep}`);
                            return true;
                        }
                    }
                }
            }
            recStack.delete(nodeId);
            return false;
        };
        
        for (const node of dag.nodes) {
            if (hasCycle(node.agentId)) break;
        }
        
        return { valid: errors.length === 0, errors };
    }
}

/**
 * Create a custom DAG with only specific agents
 */
export function createCustomDAG(agentIds: string[], baseDag: DAGDefinition = DEFAULT_DAG): DAGDefinition {
    const agentSet = new Set(agentIds);
    
    return {
        version: baseDag.version,
        nodes: baseDag.nodes
            .filter(n => agentSet.has(n.agentId))
            .map(n => ({
                ...n,
                dependencies: n.dependencies.filter(d => d === '*' || agentSet.has(d))
            }))
    };
}
