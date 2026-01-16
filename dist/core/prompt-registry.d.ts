/**
 * PromptRegistry - Centralized catalog of all prompts
 *
 * Features:
 * - Load prompt definitions from _registry.json
 * - Find applicable prompts based on repo type and features
 * - Load prompt content with version tracking and hash
 * - Cache loaded prompts for performance
 */
import type { PromptDefinition, LoadedPromptV2, RepoType } from '../types.js';
export interface RegistryData {
    version: string;
    prompts: PromptDefinition[];
}
export declare class PromptRegistry {
    private prompts;
    private promptsDir;
    private cache;
    constructor(pluginRoot: string);
    /**
     * Load all definitions from prompts/_registry.json
     */
    private loadDefinitions;
    /**
     * Find prompts applicable for the given context
     */
    findApplicable(repoType: RepoType, detectedFeatures: Set<string>, completedPrompts: Set<string>): PromptDefinition[];
    /**
     * Load prompt content with version tracking
     */
    load(promptId: string): LoadedPromptV2;
    /**
     * Get prompt definition by ID
     */
    get(promptId: string): PromptDefinition | undefined;
    /**
     * List all registered prompts
     */
    list(): PromptDefinition[];
    /**
     * List prompts by category
     */
    listByCategory(category: string): PromptDefinition[];
    /**
     * Check if a prompt exists
     */
    has(promptId: string): boolean;
    /**
     * Clear the cache (useful for hot-reloading)
     */
    clearCache(): void;
    /**
     * Reload definitions from disk
     */
    reload(): void;
    /**
     * Extract version from content
     * Supports: <!-- version=X --> or version=X
     */
    private extractVersion;
    /**
     * Strip metadata lines from content
     */
    private stripMeta;
}
/**
 * Factory function to create PromptRegistry
 */
export declare function createPromptRegistry(pluginRoot: string): PromptRegistry;
//# sourceMappingURL=prompt-registry.d.ts.map