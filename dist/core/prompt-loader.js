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
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
export class PromptLoader {
    promptsDir;
    cache = new Map();
    constructor(promptsDir) {
        this.promptsDir = promptsDir;
    }
    /**
     * Load prompt with version tracking
     * Searches in order: type-specific > generic > shared
     */
    load(promptId, repoType = 'generic') {
        const cacheKey = `${repoType}/${promptId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        // Try type-specific, then generic, then shared
        const paths = [
            path.join(this.promptsDir, repoType, `${promptId}.md`),
            path.join(this.promptsDir, 'generic', `${promptId}.md`),
            path.join(this.promptsDir, 'shared', `${promptId}.md`)
        ];
        for (const p of paths) {
            if (fs.existsSync(p)) {
                const rawContent = fs.readFileSync(p, 'utf-8');
                const version = this.extractVersion(rawContent);
                const content = this.stripVersionLine(rawContent);
                const hash = crypto.createHash('md5').update(rawContent).digest('hex').slice(0, 8);
                const result = {
                    content,
                    metadata: {
                        id: promptId,
                        version,
                        hash,
                        lastModified: fs.statSync(p).mtime.toISOString(),
                        sourcePath: p
                    }
                };
                this.cache.set(cacheKey, result);
                return result;
            }
        }
        throw new Error(`Prompt ${promptId} not found in ${this.promptsDir} (checked: ${paths.join(', ')})`);
    }
    /**
     * Extract version from first line (format: version=X or <!-- version=X -->)
     */
    extractVersion(content) {
        // Try plain format: version=X
        const plainMatch = content.match(/^version=(\d+)/);
        if (plainMatch)
            return plainMatch[1];
        // Try HTML comment format: <!-- version=X -->
        const commentMatch = content.match(/^<!--\s*version=(\d+)\s*-->/);
        if (commentMatch)
            return commentMatch[1];
        return '1';
    }
    /**
     * Remove version line from content
     */
    stripVersionLine(content) {
        return content
            .replace(/^version=\d+\n?/, '')
            .replace(/^<!--\s*version=\d+\s*-->\n?/, '');
    }
    /**
     * Compose full prompt with system context and variable substitution
     */
    compose(promptId, repoType, variables, systemContext) {
        const { content, metadata } = this.load(promptId, repoType);
        // Replace variables (format: {variableName})
        let prompt = content;
        for (const [key, value] of Object.entries(variables)) {
            prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
        // Compose with system context if provided
        const fullPrompt = systemContext
            ? `${systemContext}\n\n---\n\n${prompt}`
            : prompt;
        return { prompt: fullPrompt, metadata };
    }
    /**
     * Load system context prompt
     */
    loadSystemContext() {
        try {
            const { content } = this.load('system-context', 'shared');
            return content;
        }
        catch {
            // Return default if not found
            return `You are an expert code analyst. Analyze the repository thoroughly and provide accurate, well-structured documentation.`;
        }
    }
    /**
     * Load output schema prompt
     */
    loadOutputSchema() {
        try {
            const { content } = this.load('output-schema', 'shared');
            return content;
        }
        catch {
            // Return default SPEC-OS schema if not found
            return this.getDefaultOutputSchema();
        }
    }
    /**
     * Clear the cache (useful for hot-reloading prompts)
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get all cached prompts
     */
    getCachedPrompts() {
        return new Map(this.cache);
    }
    /**
     * Check if a prompt exists
     */
    exists(promptId, repoType = 'generic') {
        const paths = [
            path.join(this.promptsDir, repoType, `${promptId}.md`),
            path.join(this.promptsDir, 'generic', `${promptId}.md`),
            path.join(this.promptsDir, 'shared', `${promptId}.md`)
        ];
        return paths.some(p => fs.existsSync(p));
    }
    /**
     * List all available prompts
     */
    listPrompts() {
        const result = [];
        if (!fs.existsSync(this.promptsDir)) {
            return result;
        }
        const dirs = fs.readdirSync(this.promptsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);
        for (const dir of dirs) {
            const dirPath = path.join(this.promptsDir, dir);
            const prompts = fs.readdirSync(dirPath)
                .filter(f => f.endsWith('.md'))
                .map(f => f.replace('.md', ''));
            if (prompts.length > 0) {
                result.push({ directory: dir, prompts });
            }
        }
        return result;
    }
    /**
     * Default SPEC-OS output schema
     */
    getDefaultOutputSchema() {
        return `## Output Format (MANDATORY)

Every output MUST follow this exact structure:

### YAML Frontmatter (Required)
\`\`\`yaml
---
uid: {project-slug}:spec:{section-name}
title: "{Section Title}"
status: draft
version: 1.0.0
created: {analysis-date}
prompt_version: {prompt-id}@v{version}
edges:
  - [[{project-slug}:spec:{related-section}|depends_on]]
---
\`\`\`

### Sections Structure
- Use H2 (##) for main sections
- Use H3 (###) for subsections
- Include code blocks with language tags
- Use tables for structured data

### Edge Syntax
Use Obsidian-safe format:
\`[[{project-slug}:spec:{target}|{edge_type}]]\`

Edge types: depends_on, implements, extends, uses, contains

### Citation Rules
- ALWAYS cite file paths: \`backend/src/server.ts:42\`
- NEVER invent information
- Write "NOT_FOUND" if data is unavailable
`;
    }
}
/**
 * Factory function to create a PromptLoader with default paths
 */
export function createPromptLoader(pluginRoot) {
    const promptsDir = path.join(pluginRoot, 'prompts');
    return new PromptLoader(promptsDir);
}
//# sourceMappingURL=prompt-loader.js.map