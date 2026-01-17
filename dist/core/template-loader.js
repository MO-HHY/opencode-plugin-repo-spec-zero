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
export class TemplateLoader {
    templatesDir;
    cache = new Map();
    constructor(pluginRoot) {
        this.templatesDir = path.join(pluginRoot, 'templates');
    }
    /**
     * Load a template by ID (e.g., "api/endpoint")
     */
    load(templateId) {
        // Check cache first
        if (this.cache.has(templateId)) {
            return this.cache.get(templateId);
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
        const loaded = {
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
    fill(template, variables) {
        const usedVariables = [];
        const missingVariables = [];
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
    list() {
        const definitions = [];
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
                }
                catch (e) {
                    // Skip invalid templates
                }
            }
        }
        return definitions;
    }
    /**
     * Get variables required by a template
     */
    getVariables(templateId) {
        const loaded = this.load(templateId);
        return loaded.variables;
    }
    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================
    extractDefinition(templateId, content) {
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
    extractFrontmatter(content) {
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (!match)
            return {};
        const yaml = match[1];
        const result = {};
        // Simple YAML parser for basic key: value pairs
        const lines = yaml.split('\n');
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1)
                continue;
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            // Handle arrays (simplified)
            if (value.startsWith('[') && value.endsWith(']')) {
                result[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, ''));
            }
            else {
                result[key] = value.replace(/^["']|["']$/g, '');
            }
        }
        return result;
    }
    stripFrontmatter(content) {
        return content.replace(/^---\n[\s\S]*?\n---\n/, '');
    }
    extractVariables(content) {
        const variables = [];
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
    processEachBlocks(content, variables, usedVariables) {
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
                        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
                    }
                }
                return result;
            }).join('');
        });
    }
    processIfBlocks(content, variables, usedVariables) {
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
    processUnlessBlocks(content, variables, usedVariables) {
        const regex = /\{\{#unless\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}([\s\S]*?)\{\{\/unless\}\}/g;
        return content.replace(regex, (_, varName, blockContent) => {
            usedVariables.push(varName);
            const value = variables[varName];
            // Falsy check
            const isFalsy = !value || (Array.isArray(value) && value.length === 0);
            return isFalsy ? blockContent : '';
        });
    }
    replaceVariables(content, variables, usedVariables, missingVariables) {
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
//# sourceMappingURL=template-loader.js.map