/**
 * SharedContext - Accumulates knowledge progressively during DAG execution
 *
 * This class maintains shared state across all agents, enabling:
 * - Key file content caching
 * - Agent output accumulation
 * - Prompt version tracking
 * - Token-efficient context building
 */
export interface PromptVersion {
    id: string;
    version: string;
    hash: string;
}
export interface AgentOutput {
    agentId: string;
    filePath: string;
    summary: string;
    fullContent: string;
    promptVersion: PromptVersion;
    timestamp: Date;
}
export interface KeyFile {
    relativePath: string;
    content: string;
    truncated: boolean;
}
export interface ContextParams {
    projectSlug: string;
    repoType: string;
    baseDir: string;
    repoStructure: string;
}
export declare class SharedContext {
    readonly projectSlug: string;
    readonly repoType: string;
    readonly baseDir: string;
    readonly startTime: Date;
    readonly repoStructure: string;
    readonly keyFiles: Map<string, KeyFile>;
    private agentOutputs;
    private promptVersions;
    constructor(params: ContextParams);
    /**
     * Add key file content with optional truncation
     */
    addKeyFile(relativePath: string, content: string, maxChars?: number): void;
    /**
     * Get a specific key file
     */
    getKeyFile(relativePath: string): KeyFile | undefined;
    /**
     * Check if a key file exists
     */
    hasKeyFile(relativePath: string): boolean;
    /**
     * Register agent output
     */
    registerOutput(output: AgentOutput): void;
    /**
     * Get outputs from specific agents (for dependency resolution)
     */
    getOutputs(agentIds: string[]): AgentOutput[];
    /**
     * Get summary-only view (token economy)
     */
    getSummaries(agentIds: string[]): string;
    /**
     * Get all summaries
     */
    getAllSummaries(): string;
    /**
     * Get full content for specific agent
     */
    getFullContent(agentId: string): string | undefined;
    /**
     * Check if an agent has produced output
     */
    hasOutput(agentId: string): boolean;
    /**
     * Get all executed agent IDs
     */
    getExecutedAgentIds(): string[];
    /**
     * Build context for an agent based on its dependencies
     * This is the key method for token economy - only passes what's needed
     */
    buildAgentContext(dependencies: string[]): string;
    /**
     * Build minimal context (structure + key files only, no previous results)
     */
    buildMinimalContext(): string;
    /**
     * Build full context (all previous results)
     */
    buildFullContext(): string;
    /**
     * Generate final metadata for audit trail
     */
    generateMetadata(): object;
    /**
     * Serialize context to JSON (for debugging/persistence)
     */
    toJSON(): object;
    /**
     * Create a snapshot for a specific agent (what it can "see")
     */
    createAgentSnapshot(agentId: string, dependencies: string[]): {
        projectSlug: string;
        repoType: string;
        baseDir: string;
        context: string;
        availableDeps: string[];
    };
}
//# sourceMappingURL=context.d.ts.map