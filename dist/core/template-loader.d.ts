/**
 * TemplateLoader - Loads and fills Handlebars-like templates
 *
 * Features:
 * - Loads templates from templates/ directory
 * - Supports {{variable}} substitution
 * - Supports {{#each}} and {{#if}} helpers
 * - Caches loaded templates
 */
import type { TemplateDefinition, LoadedTemplate, TemplateVariables, TemplateResult } from '../types.js';
export declare class TemplateLoader {
    private templatesDir;
    private cache;
    constructor(pluginRoot: string);
    /**
     * Load a template by ID (e.g., "api/endpoint")
     */
    load(templateId: string): LoadedTemplate;
    /**
     * Fill a template with variables
     */
    fill(template: LoadedTemplate, variables: TemplateVariables): TemplateResult;
    /**
     * List all available templates
     */
    list(): TemplateDefinition[];
    /**
     * Get variables required by a template
     */
    getVariables(templateId: string): string[];
    /**
     * Clear the cache
     */
    clearCache(): void;
    private extractDefinition;
    private extractFrontmatter;
    private stripFrontmatter;
    private extractVariables;
    private processEachBlocks;
    private processIfBlocks;
    private processUnlessBlocks;
    private replaceVariables;
}
//# sourceMappingURL=template-loader.d.ts.map