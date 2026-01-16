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
    summary: string;      // Max 500 chars for token economy
    fullContent: string;  // Full content if needed
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

export class SharedContext {
    // Metadata
    readonly projectSlug: string;
    readonly repoType: string;
    readonly baseDir: string;
    readonly startTime: Date;

    // Repository data
    readonly repoStructure: string;
    readonly keyFiles: Map<string, KeyFile>;
    
    // Agent outputs (accumulates during execution)
    private agentOutputs: Map<string, AgentOutput> = new Map();
    
    // Prompt versions used
    private promptVersions: PromptVersion[] = [];

    constructor(params: ContextParams) {
        this.projectSlug = params.projectSlug;
        this.repoType = params.repoType;
        this.baseDir = params.baseDir;
        this.startTime = new Date();
        this.repoStructure = params.repoStructure;
        this.keyFiles = new Map();
    }

    /**
     * Add key file content with optional truncation
     */
    addKeyFile(relativePath: string, content: string, maxChars = 5000): void {
        this.keyFiles.set(relativePath, {
            relativePath,
            content: content.slice(0, maxChars),
            truncated: content.length > maxChars
        });
    }

    /**
     * Get a specific key file
     */
    getKeyFile(relativePath: string): KeyFile | undefined {
        return this.keyFiles.get(relativePath);
    }

    /**
     * Check if a key file exists
     */
    hasKeyFile(relativePath: string): boolean {
        return this.keyFiles.has(relativePath);
    }

    /**
     * Register agent output
     */
    registerOutput(output: AgentOutput): void {
        this.agentOutputs.set(output.agentId, output);
        this.promptVersions.push(output.promptVersion);
    }

    /**
     * Get outputs from specific agents (for dependency resolution)
     */
    getOutputs(agentIds: string[]): AgentOutput[] {
        return agentIds
            .map(id => this.agentOutputs.get(id))
            .filter((o): o is AgentOutput => o !== undefined);
    }

    /**
     * Get summary-only view (token economy)
     */
    getSummaries(agentIds: string[]): string {
        return this.getOutputs(agentIds)
            .map(o => `## ${o.agentId}\n${o.summary}`)
            .join('\n\n');
    }

    /**
     * Get all summaries
     */
    getAllSummaries(): string {
        const allIds = Array.from(this.agentOutputs.keys());
        return this.getSummaries(allIds);
    }

    /**
     * Get full content for specific agent
     */
    getFullContent(agentId: string): string | undefined {
        return this.agentOutputs.get(agentId)?.fullContent;
    }

    /**
     * Check if an agent has produced output
     */
    hasOutput(agentId: string): boolean {
        return this.agentOutputs.has(agentId);
    }

    /**
     * Get all executed agent IDs
     */
    getExecutedAgentIds(): string[] {
        return Array.from(this.agentOutputs.keys());
    }

    /**
     * Build context for an agent based on its dependencies
     * This is the key method for token economy - only passes what's needed
     */
    buildAgentContext(dependencies: string[]): string {
        const parts: string[] = [];
        
        // Add repository structure (always available)
        parts.push('## Repository Structure\n```\n' + this.repoStructure + '\n```');
        
        // Add key files (always available)
        if (this.keyFiles.size > 0) {
            parts.push('\n## Key Files\n');
            for (const [path, file] of this.keyFiles) {
                const truncationNote = file.truncated ? ' (truncated)' : '';
                parts.push(`### ${path}${truncationNote}\n\`\`\`\n${file.content}\n\`\`\``);
            }
        }
        
        // Add dependency outputs (summaries only for token economy)
        if (dependencies.length > 0) {
            const summaries = this.getSummaries(dependencies);
            if (summaries) {
                parts.push('\n## Previous Analysis Results\n');
                parts.push(summaries);
            }
        }
        
        return parts.join('\n');
    }

    /**
     * Build minimal context (structure + key files only, no previous results)
     */
    buildMinimalContext(): string {
        return this.buildAgentContext([]);
    }

    /**
     * Build full context (all previous results)
     */
    buildFullContext(): string {
        const allIds = Array.from(this.agentOutputs.keys());
        return this.buildAgentContext(allIds);
    }

    /**
     * Generate final metadata for audit trail
     */
    generateMetadata(): object {
        return {
            projectSlug: this.projectSlug,
            repoType: this.repoType,
            baseDir: this.baseDir,
            analysisDate: this.startTime.toISOString(),
            durationMs: Date.now() - this.startTime.getTime(),
            agentsExecuted: Array.from(this.agentOutputs.keys()),
            keyFilesLoaded: Array.from(this.keyFiles.keys()),
            promptVersions: this.promptVersions
        };
    }

    /**
     * Serialize context to JSON (for debugging/persistence)
     */
    toJSON(): object {
        return {
            metadata: this.generateMetadata(),
            keyFiles: Object.fromEntries(this.keyFiles),
            agentOutputs: Object.fromEntries(
                Array.from(this.agentOutputs.entries()).map(([k, v]) => [k, {
                    ...v,
                    timestamp: v.timestamp.toISOString()
                }])
            )
        };
    }

    /**
     * Create a snapshot for a specific agent (what it can "see")
     */
    createAgentSnapshot(agentId: string, dependencies: string[]): {
        projectSlug: string;
        repoType: string;
        baseDir: string;
        context: string;
        availableDeps: string[];
    } {
        return {
            projectSlug: this.projectSlug,
            repoType: this.repoType,
            baseDir: this.baseDir,
            context: this.buildAgentContext(dependencies),
            availableDeps: dependencies.filter(d => this.hasOutput(d))
        };
    }
}
