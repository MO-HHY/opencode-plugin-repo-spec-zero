/**
 * PromptRegistry - Centralized catalog of all prompts
 * 
 * Features:
 * - Load prompt definitions from _registry.json
 * - Find applicable prompts based on repo type and features
 * - Load prompt content with version tracking and hash
 * - Cache loaded prompts for performance
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { PromptDefinition, LoadedPromptV2, RepoType } from '../types.js';

export interface RegistryData {
    version: string;
    prompts: PromptDefinition[];
}

export class PromptRegistry {
    private prompts: Map<string, PromptDefinition> = new Map();
    private promptsDir: string;
    private cache: Map<string, LoadedPromptV2> = new Map();

    constructor(pluginRoot: string) {
        this.promptsDir = path.join(pluginRoot, 'prompts');
        this.loadDefinitions();
    }

    /**
     * Load all definitions from prompts/_registry.json
     */
    private loadDefinitions(): void {
        const registryPath = path.join(this.promptsDir, '_registry.json');
        
        if (fs.existsSync(registryPath)) {
            try {
                const content = fs.readFileSync(registryPath, 'utf-8');
                const data: RegistryData = JSON.parse(content);
                
                for (const def of data.prompts) {
                    this.prompts.set(def.id, def);
                }
                
                console.log(`[PromptRegistry] Loaded ${this.prompts.size} prompt definitions`);
            } catch (error: any) {
                console.error(`[PromptRegistry] Failed to load registry: ${error.message}`);
            }
        } else {
            console.warn(`[PromptRegistry] Registry file not found: ${registryPath}`);
        }
    }

    /**
     * Find prompts applicable for the given context
     */
    findApplicable(
        repoType: RepoType,
        detectedFeatures: Set<string>,
        completedPrompts: Set<string>
    ): PromptDefinition[] {
        const applicable: PromptDefinition[] = [];
        
        for (const def of this.prompts.values()) {
            // Check repo type
            if (!def.applicableTo.includes(repoType) && 
                !def.applicableTo.includes('unknown' as RepoType)) {
                continue;
            }
            
            // Check required features
            if (def.requiredFeatures && def.requiredFeatures.length > 0) {
                const hasAllFeatures = def.requiredFeatures.every(
                    f => detectedFeatures.has(f)
                );
                if (!hasAllFeatures && !def.optional) {
                    continue;
                }
            }
            
            // Check dependencies satisfied
            const depsOk = def.dependsOn.every(
                d => completedPrompts.has(d) || d === 'bootstrap'
            );
            if (!depsOk) {
                continue;
            }
            
            applicable.push(def);
        }
        
        // Sort by priority (descending)
        return applicable.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Load prompt content with version tracking
     */
    load(promptId: string): LoadedPromptV2 {
        // Check cache first
        if (this.cache.has(promptId)) {
            return this.cache.get(promptId)!;
        }
        
        // Get definition
        const def = this.prompts.get(promptId);
        if (!def) {
            throw new Error(`Prompt ${promptId} not found in registry`);
        }
        
        // Build prompt file path
        const promptPath = path.join(this.promptsDir, `${promptId}.md`);
        
        if (!fs.existsSync(promptPath)) {
            throw new Error(`Prompt file not found: ${promptPath}`);
        }
        
        // Read content
        const rawContent = fs.readFileSync(promptPath, 'utf-8');
        
        // Extract version
        const version = this.extractVersion(rawContent);
        
        // Strip metadata from content
        const content = this.stripMeta(rawContent);
        
        // Calculate hash
        const hash = crypto.createHash('md5')
            .update(rawContent)
            .digest('hex')
            .slice(0, 8);
        
        const loaded: LoadedPromptV2 = {
            definition: def,
            content,
            version,
            hash
        };
        
        // Cache and return
        this.cache.set(promptId, loaded);
        return loaded;
    }

    /**
     * Get prompt definition by ID
     */
    get(promptId: string): PromptDefinition | undefined {
        return this.prompts.get(promptId);
    }

    /**
     * List all registered prompts
     */
    list(): PromptDefinition[] {
        return Array.from(this.prompts.values());
    }

    /**
     * List prompts by category
     */
    listByCategory(category: string): PromptDefinition[] {
        return this.list().filter(p => p.category === category);
    }

    /**
     * Check if a prompt exists
     */
    has(promptId: string): boolean {
        return this.prompts.has(promptId);
    }

    /**
     * Clear the cache (useful for hot-reloading)
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Reload definitions from disk
     */
    reload(): void {
        this.prompts.clear();
        this.cache.clear();
        this.loadDefinitions();
    }

    /**
     * Extract version from content
     * Supports: <!-- version=X --> or version=X
     */
    private extractVersion(content: string): string {
        // Try HTML comment format
        const commentMatch = content.match(/^<!--\s*version[=:]\s*(\d+)\s*-->/);
        if (commentMatch) return commentMatch[1];
        
        // Try plain format
        const plainMatch = content.match(/^version[=:](\d+)/);
        if (plainMatch) return plainMatch[1];
        
        return '1';
    }

    /**
     * Strip metadata lines from content
     */
    private stripMeta(content: string): string {
        return content
            .replace(/^<!--\s*version[=:]\s*\d+\s*-->\n?/, '')
            .replace(/^version[=:]\d+\n?/, '');
    }
}

/**
 * Factory function to create PromptRegistry
 */
export function createPromptRegistry(pluginRoot: string): PromptRegistry {
    return new PromptRegistry(pluginRoot);
}
