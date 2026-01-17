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
import type { SharedContext } from './context.js';
import type { BaseAgent } from '../agents/base.js';
import type { DAGNode, DAGDefinition, DAGExecutionResult, DAGExecutionSummary, SpecZeroMode, DetectedFeatures } from '../types.js';
import { SmartDAGPlanner } from './smart-dag-planner.js';
export type { DAGNode, DAGDefinition };
/**
 * v2.0.0: GENERATION Mode DAG
 * First-time analysis: creates submodule, runs analysis, writes specs, commits
 */
export declare const GENERATION_DAG: DAGDefinition;
/**
 * v2.0.0: AUDIT Mode DAG
 * Subsequent analyses: loads existing specs, runs analysis, generates audit report
 */
export declare const AUDIT_DAG: DAGDefinition;
/**
 * Legacy/Default DAG (v1.x compatibility)
 * @deprecated Use GENERATION_DAG or AUDIT_DAG for v2.0.0
 */
export declare const DEFAULT_DAG: DAGDefinition;
/**
 * Select appropriate DAG based on mode
 */
export declare function selectDAG(mode: SpecZeroMode): DAGDefinition;
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
export declare class DAGExecutor {
    private dag;
    private context;
    private agents;
    private options;
    private executionResults;
    /** v2.0.0: Detected mode after submodule check */
    private detectedMode;
    /** v2.1.0: Tracking for skip logic */
    private completedAgents;
    private failedAgents;
    constructor(dag: DAGDefinition, context: SharedContext, agents: Map<string, BaseAgent>, options?: DAGExecutorOptions);
    /**
     * Update mode after submodule check
     */
    setMode(mode: SpecZeroMode): void;
    /**
     * Get current mode
     */
    getMode(): SpecZeroMode;
    /**
     * Compute execution layers (topologically sorted)
     */
    getLayers(): string[][];
    /**
     * Get dependencies for a specific agent
     */
    getDependencies(agentId: string): string[];
    /**
     * Execute a single agent
     */
    private executeAgent;
    /**
     * Extract summary from output (first 500 chars or first paragraph)
     */
    private extractSummary;
    /**
     * Build allResults map from context (for backwards compatibility)
     */
    private buildAllResults;
    /**
     * Execute the entire DAG
     */
    execute(client: any): Promise<DAGExecutionSummary>;
    /**
     * Get execution results
     */
    getResults(): DAGExecutionResult[];
    /**
     * Validate DAG definition (check for cycles, missing deps, etc.)
     */
    static validate(dag: DAGDefinition): {
        valid: boolean;
        errors: string[];
    };
}
/**
 * Create a custom DAG with only specific agents
 */
export declare function createCustomDAG(agentIds: string[], baseDag?: DAGDefinition): DAGDefinition;
//# sourceMappingURL=dag-executor.d.ts.map