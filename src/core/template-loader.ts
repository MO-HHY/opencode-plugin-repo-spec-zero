/**
 * TemplateLoader - Loads and fills Handlebars-like templates
 * 
 * Features:
 * - Loads templates from templates/ directory
 * - Supports {{variable}} substitution
 * - Supports {{#each}} and {{#if}} helpers
 * - Caches loaded templates
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type {
    TemplateDefinition,
    LoadedTemplate,
    TemplateVariables,
    TemplateResult,
} from '../types.js';

export class TemplateLoader {
    private templatesDir: string;
    private cache: Map<string, LoadedTemplate> = new Map();

    constructor(pluginRoot: string) {
        this.templatesDir = path.join(pluginRoot, 'templates');
    }

    /**
     * Load a template by ID (e.g., "api/endpoint")
     */
    load(templateId: string): LoadedTemplate {
        // Check cache first
        if (this.cache.has(templateId)) {
            return this.cache.get(templateId)!;
        }

        // Build file path: templates/api/endpoint.md
        const templatePath = path.join(this.templatesDir, `${templateId}.md`);
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }

        const rawContent = fs.readFileSync(templatePath, 'utf-8');
        
        // Extract definition from frontmatter
        const definition = this.extractDefinition(templateId, rawContent);
        
        // Extract variables
        const variables = this.extractVariables(rawContent);
        
        // Calculate hash
        const hash = crypto.createHash('md5')
            .update(rawContent)
            .digest('hex')
            .slice(0, 8);

        const loaded: LoadedTemplate = {
            definition,
            content: this.stripFrontmatter(rawContent),
            variables,
            hash,
        };

        this.cache.set(templateId, loaded);
        return loaded;
    }

    /**
     * Fill a template with variables
     */
    fill(template: LoadedTemplate, variables: TemplateVariables): TemplateResult {
        const usedVariables: string[] = [];
        const missingVariables: string[] = [];
        
        let content = template.content;

        // Process {{#each items}}...{{/each}}
        content = this.processEachBlocks(content, variables, usedVariables);

        // Process {{#if condition}}...{{/if}}
        content = this.processIfBlocks(content, variables, usedVariables);

        // Process {{#unless condition}}...{{/unless}}
        content = this.processUnlessBlocks(content, variables, usedVariables);

        // Replace simple variables {{variable}}
        content = this.replaceVariables(content, variables, usedVariables, missingVariables);

        return {
            content,
            usedVariables: [...new Set(usedVariables)],
            missingVariables: [...new Set(missingVariables)],
        };
    }

    /**
     * List all available templates
     */
    list(): TemplateDefinition[] {
        const definitions: TemplateDefinition[] = [];
        
        if (!fs.existsSync(this.templatesDir)) {
            return definitions;
        }

        const categories = fs.readdirSync(this.templatesDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);

        for (const category of categories) {
            const categoryPath = path.join(this.templatesDir, category);
            const files = fs.readdirSync(categoryPath)
                .filter(f => f.endsWith('.md'));

            for (const file of files) {
                const templateId = `${category}/${file.replace('.md', '')}`;
                try {
                    const loaded = this.load(templateId);
                    definitions.push(loaded.definition);
                } catch (e) {
                    // Skip invalid templates
                }
            }
        }

        return definitions;
    }

    /**
     * Get variables required by a template
     */
    getVariables(templateId: string): string[] {
        const loaded = this.load(templateId);
        return loaded.variables;
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================

    private extractDefinition(templateId: string, content: string): TemplateDefinition {
        const frontmatter = this.extractFrontmatter(content);
        const parts = templateId.split('/');
        
        return {
            id: templateId,
            name: frontmatter.name || parts[parts.length - 1],
            description: frontmatter.description || '',
            category: parts[0] || 'general',
            requiredVariables: frontmatter.requiredVariables || [],
            optionalVariables: frontmatter.optionalVariables || [],
            version: frontmatter.version || '1.0.0',
        };
    }

    private extractFrontmatter(content: string): Record<string, any> {
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (!match) return {};

        const yaml = match[1];
        const result: Record<string, any> = {};

        // Simple YAML parser for basic key: value pairs
        const lines = yaml.split('\n');
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;
            
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            
            // Handle arrays (simplified)
            if (value.startsWith('[') && value.endsWith(']')) {
                result[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, ''));
            } else {
                result[key] = value.replace(/^["']|["']$/g, '');
            }
        }

        return result;
    }

    private stripFrontmatter(content: string): string {
        return content.replace(/^---\n[\s\S]*?\n---\n/, '');
    }

    private extractVariables(content: string): string[] {
        const variables: string[] = [];
        
        // Match {{variable}}, {{#each variable}}, {{#if variable}}
        const regex = /\{\{#?(?:each|if|unless)?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            if (match[1] && !variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }

        return variables;
    }

    private processEachBlocks(
        content: string,
        variables: TemplateVariables,
        usedVariables: string[]
    ): string {
        const regex = /\{\{#each\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g;
        
        return content.replace(regex, (_, varName, blockContent) => {
            usedVariables.push(varName);
            const items = variables[varName];
            
            if (!Array.isArray(items)) {
                return '';
            }

            return items.map((item, index) => {
                let result = blockContent;
                
                // Replace {{this}} with the current item
                result = result.replace(/\{\{this\}\}/g, String(item));
                
                // Replace {{@index}} with the current index
                result = result.replace(/\{\{@index\}\}/g, String(index));
                
                // If item is an object, replace {{property}} with item.property
                if (typeof item === 'object' && item !== null) {
                    for (const [key, value] of Object.entries(item)) {
                        result = result.replace(
                            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                            String(value)
                        );
                    }
                }
                
                return result;
            }).join('');
        });
    }

    private processIfBlocks(
        content: string,
        variables: TemplateVariables,
        usedVariables: string[]
    ): string {
        const regex = /\{\{#if\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;
        
        return content.replace(regex, (_, varName, ifContent, elseContent = '') => {
            usedVariables.push(varName);
            const value = variables[varName];
            
            // Truthy check
            const isTruthy = Boolean(value) && 
                (Array.isArray(value) ? value.length > 0 : true);
            
            return isTruthy ? ifContent : elseContent;
        });
    }

    private processUnlessBlocks(
        content: string,
        variables: TemplateVariables,
        usedVariables: string[]
    ): string {
        const regex = /\{\{#unless\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}([\s\S]*?)\{\{\/unless\}\}/g;
        
        return content.replace(regex, (_, varName, blockContent) => {
            usedVariables.push(varName);
            const value = variables[varName];
            
            // Falsy check
            const isFalsy = !value || (Array.isArray(value) && value.length === 0);
            
            return isFalsy ? blockContent : '';
        });
    }

    private replaceVariables(
        content: string,
        variables: TemplateVariables,
        usedVariables: string[],
        missingVariables: string[]
    ): string {
        // Match simple {{variable}} (not block helpers)
        const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
        
        return content.replace(regex, (match, varName) => {
            if (varName in variables) {
                usedVariables.push(varName);
                const value = variables[varName];
                
                if (typeof value === 'object') {
                    return JSON.stringify(value);
                }
                return String(value);
            }
            
            missingVariables.push(varName);
            return `{{${varName}}}`; // Keep as-is if not found
        });
    }
}
