/**
 * SharedContext - Accumulates knowledge progressively during DAG execution
 *
 * This class maintains shared state across all agents, enabling:
 * - Key file content caching
 * - Agent output accumulation
 * - Prompt version tracking
 * - Token-efficient context building
 */
export class SharedContext {
    // Metadata
    projectSlug;
    repoType;
    baseDir;
    startTime;
    // Repository data
    repoStructure;
    keyFiles;
    // Agent outputs (accumulates during execution)
    agentOutputs = new Map();
    // Prompt versions used
    promptVersions = [];
    constructor(params) {
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
    addKeyFile(relativePath, content, maxChars = 5000) {
        this.keyFiles.set(relativePath, {
            relativePath,
            content: content.slice(0, maxChars),
            truncated: content.length > maxChars
        });
    }
    /**
     * Get a specific key file
     */
    getKeyFile(relativePath) {
        return this.keyFiles.get(relativePath);
    }
    /**
     * Check if a key file exists
     */
    hasKeyFile(relativePath) {
        return this.keyFiles.has(relativePath);
    }
    /**
     * Register agent output
     */
    registerOutput(output) {
        this.agentOutputs.set(output.agentId, output);
        this.promptVersions.push(output.promptVersion);
    }
    /**
     * Get outputs from specific agents (for dependency resolution)
     */
    getOutputs(agentIds) {
        return agentIds
            .map(id => this.agentOutputs.get(id))
            .filter((o) => o !== undefined);
    }
    /**
     * Get summary-only view (token economy)
     */
    getSummaries(agentIds) {
        return this.getOutputs(agentIds)
            .map(o => `## ${o.agentId}\n${o.summary}`)
            .join('\n\n');
    }
    /**
     * Get all summaries
     */
    getAllSummaries() {
        const allIds = Array.from(this.agentOutputs.keys());
        return this.getSummaries(allIds);
    }
    /**
     * Get full content for specific agent
     */
    getFullContent(agentId) {
        return this.agentOutputs.get(agentId)?.fullContent;
    }
    /**
     * Check if an agent has produced output
     */
    hasOutput(agentId) {
        return this.agentOutputs.has(agentId);
    }
    /**
     * Get all executed agent IDs
     */
    getExecutedAgentIds() {
        return Array.from(this.agentOutputs.keys());
    }
    /**
     * Build context for an agent based on its dependencies
     * This is the key method for token economy - only passes what's needed
     */
    buildAgentContext(dependencies) {
        const parts = [];
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
    buildMinimalContext() {
        return this.buildAgentContext([]);
    }
    /**
     * Build full context (all previous results)
     */
    buildFullContext() {
        const allIds = Array.from(this.agentOutputs.keys());
        return this.buildAgentContext(allIds);
    }
    /**
     * Generate final metadata for audit trail
     */
    generateMetadata() {
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
    toJSON() {
        return {
            metadata: this.generateMetadata(),
            keyFiles: Object.fromEntries(this.keyFiles),
            agentOutputs: Object.fromEntries(Array.from(this.agentOutputs.entries()).map(([k, v]) => [k, {
                    ...v,
                    timestamp: v.timestamp.toISOString()
                }]))
        };
    }
    /**
     * Create a snapshot for a specific agent (what it can "see")
     */
    createAgentSnapshot(agentId, dependencies) {
        return {
            projectSlug: this.projectSlug,
            repoType: this.repoType,
            baseDir: this.baseDir,
            context: this.buildAgentContext(dependencies),
            availableDeps: dependencies.filter(d => this.hasOutput(d))
        };
    }
}
//# sourceMappingURL=context.js.map