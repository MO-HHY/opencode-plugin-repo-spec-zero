/**
 * PromptLoader - Versioned prompt loading system
 *
 * Features:
 * - Load prompts from type-specific, generic, or shared directories
 * - Extract and track version numbers
 * - Generate content hashes for traceability
 * - Cache loaded prompts for performance
 * - Compose prompts with system context
 */
export interface PromptMetadata {
    id: string;
    version: string;
    hash: string;
    lastModified: string;
    sourcePath: string;
}
export interface LoadedPrompt {
    content: string;
    metadata: PromptMetadata;
}
export declare class PromptLoader {
    private promptsDir;
    private cache;
    constructor(promptsDir: string);
    /**
     * Load prompt with version tracking
     * Searches in order: type-specific > generic > shared
     */
    load(promptId: string, repoType?: string): LoadedPrompt;
    /**
     * Extract version from first line (format: version=X or <!-- version=X -->)
     */
    private extractVersion;
    /**
     * Remove version line from content
     */
    private stripVersionLine;
    /**
     * Compose full prompt with system context and variable substitution
     */
    compose(promptId: string, repoType: string, variables: Record<string, string>, systemContext?: string): {
        prompt: string;
        metadata: PromptMetadata;
    };
    /**
     * Load system context prompt
     */
    loadSystemContext(): string;
    /**
     * Load output schema prompt
     */
    loadOutputSchema(): string;
    /**
     * Clear the cache (useful for hot-reloading prompts)
     */
    clearCache(): void;
    /**
     * Get all cached prompts
     */
    getCachedPrompts(): Map<string, LoadedPrompt>;
    /**
     * Check if a prompt exists
     */
    exists(promptId: string, repoType?: string): boolean;
    /**
     * List all available prompts
     */
    listPrompts(): {
        directory: string;
        prompts: string[];
    }[];
    /**
     * Default SPEC-OS output schema
     */
    private getDefaultOutputSchema;
}
/**
 * Factory function to create a PromptLoader with default paths
 */
export declare function createPromptLoader(pluginRoot: string): PromptLoader;
//# sourceMappingURL=prompt-loader.d.ts.map