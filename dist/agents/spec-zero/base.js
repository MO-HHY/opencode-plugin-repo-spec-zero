/**
 * RepoSpecZeroAgent Base Class - Context-Aware Agent
 *
 * Refactored to support:
 * - SharedContext integration
 * - Versioned prompts with PromptLoader
 * - SPEC-OS compliant output
 * - DAG dependency awareness
 */
import { SubAgent } from '../base.js';
import { createPromptLoader } from '../../core/prompt-loader.js';
import { getFullSystemContext } from '../../prompts/system-context.js';
import { getFullOutputSchema, generateFrontmatter } from '../../prompts/output-schema.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
export class RepoSpecZeroAgent extends SubAgent {
    // Triggers can be generic for these agents as they are mostly orchestrated
    triggers = [];
    // Prompt loader instance (lazy initialized)
    _promptLoader = null;
    /**
     * Get or create prompt loader
     */
    get promptLoader() {
        if (!this._promptLoader) {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const rootDir = path.resolve(__dirname, '../../../');
            this._promptLoader = createPromptLoader(rootDir);
        }
        return this._promptLoader;
    }
    async process(context) {
        const { client } = context;
        const params = context.params || {};
        // Extract parameters with defaults
        const repoStructure = String(params.repoStructure || 'No structure available');
        const projectSlug = String(params.projectSlug || 'unknown-repo');
        const baseDir = String(params.baseDir || process.cwd());
        const repoType = params.repoType || 'generic';
        // New: SharedContext integration
        const sharedContext = params.sharedContext;
        const previousResults = params.previousResults || '';
        const dependencies = params.dependencies || this.contextDeps;
        // Validate baseDir
        if (!baseDir || !fs.existsSync(baseDir)) {
            return { success: false, message: `Invalid baseDir: ${baseDir}` };
        }
        try {
            // 1. Load versioned prompt
            const { content: promptContent, metadata: promptMetadata } = this.loadVersionedPrompt(repoType);
            // 2. Build context from SharedContext or fallback to params
            const analysisContext = this.buildAnalysisContext({
                sharedContext,
                previousResults,
                repoStructure,
                dependencies,
                allResults: params.allResults || {}
            });
            // 3. Build system context
            const systemContext = getFullSystemContext({
                projectSlug,
                repoType,
                analysisDate: new Date().toISOString().split('T')[0]
            });
            // 4. Build output schema
            const outputSchema = getFullOutputSchema({
                projectSlug,
                sectionName: this.getSectionName(),
                promptId: promptMetadata.id,
                promptVersion: promptMetadata.version
            });
            // 5. Compose full prompt
            const fullSystemPrompt = systemContext + outputSchema + '\n---\n\n' + promptContent;
            const userPrompt = this.buildUserPrompt(analysisContext, repoStructure);
            // 6. Execute via Native LLM
            const nativeLLM = this.skills.get('native_llm');
            if (!nativeLLM) {
                return { success: false, message: 'Native LLM skill not found' };
            }
            const analysisResultRaw = await nativeLLM.execute({
                systemPrompt: fullSystemPrompt,
                userPrompt: userPrompt
            });
            if (!analysisResultRaw.success || !analysisResultRaw.data) {
                throw new Error(analysisResultRaw.error || "Empty response from Native LLM");
            }
            let analysisResult = analysisResultRaw.data;
            // 7. Ensure frontmatter exists
            analysisResult = this.ensureFrontmatter(analysisResult, {
                projectSlug,
                sectionName: this.getSectionName(),
                promptMetadata,
                dependencies
            });
            // 8. Extract summary for context (token economy)
            const summary = this.extractSummary(analysisResult);
            // 9. Write output file
            const specDir = path.join(baseDir, `${projectSlug}-spec`);
            const fullPath = path.join(specDir, 'analysis', this.category, this.outputFile);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, analysisResult);
            // 10. Return result with prompt version for tracking
            const promptVersion = {
                id: promptMetadata.id,
                version: promptMetadata.version,
                hash: promptMetadata.hash
            };
            return {
                success: true,
                data: {
                    output: analysisResult,
                    path: fullPath,
                    summary,
                    promptVersion
                },
                message: `Completed analysis for ${this.id}`
            };
        }
        catch (error) {
            return { success: false, message: `Agent ${this.id} failed: ${error.message}` };
        }
    }
    /**
     * Load prompt with version tracking
     */
    loadVersionedPrompt(repoType) {
        try {
            return this.promptLoader.load(this.promptFile.replace('.md', ''), repoType);
        }
        catch (error) {
            // Fallback to legacy loading
            return {
                content: this.loadPromptLegacy(repoType, this.promptFile),
                metadata: {
                    id: this.promptFile.replace('.md', ''),
                    version: '1',
                    hash: 'legacy',
                    lastModified: new Date().toISOString(),
                    sourcePath: 'legacy'
                }
            };
        }
    }
    /**
     * Legacy prompt loading (for backwards compatibility)
     */
    loadPromptLegacy(repoType, filename) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const rootDir = path.resolve(__dirname, '../../../');
        const promptsDir = path.join(rootDir, 'prompts');
        const typePath = path.join(promptsDir, repoType, filename);
        const genericPath = path.join(promptsDir, 'generic', filename);
        const sharedPath = path.join(promptsDir, 'shared', filename);
        if (fs.existsSync(typePath))
            return fs.readFileSync(typePath, 'utf-8');
        if (fs.existsSync(genericPath))
            return fs.readFileSync(genericPath, 'utf-8');
        if (fs.existsSync(sharedPath))
            return fs.readFileSync(sharedPath, 'utf-8');
        throw new Error(`Prompt file ${filename} not found in ${promptsDir}`);
    }
    /**
     * Build analysis context from SharedContext or fallback
     */
    buildAnalysisContext(options) {
        const { sharedContext, previousResults, dependencies, allResults } = options;
        // Prefer SharedContext if available
        if (sharedContext) {
            return sharedContext.buildAgentContext(dependencies);
        }
        // Fallback to previousResults or allResults
        if (previousResults) {
            return previousResults;
        }
        // Build from allResults (legacy)
        let context = "";
        for (const depId of this.contextDeps) {
            if (allResults[depId]) {
                context += `\n--- Output from ${depId} ---\n${allResults[depId]}\n`;
            }
        }
        return context;
    }
    /**
     * Build user prompt with context
     */
    buildUserPrompt(context, repoStructure) {
        let userPrompt = '';
        if (context) {
            userPrompt += `## Analysis Context\n\n${context}\n\n`;
        }
        userPrompt += `## Repository Structure\n\n\`\`\`\n${repoStructure}\n\`\`\`\n`;
        return userPrompt;
    }
    /**
     * Ensure output has valid SPEC-OS frontmatter
     */
    ensureFrontmatter(content, options) {
        // Check if frontmatter exists
        if (content.startsWith('---')) {
            return content;
        }
        // Generate frontmatter
        const { projectSlug, sectionName, promptMetadata, dependencies } = options;
        const today = new Date().toISOString().split('T')[0];
        const frontmatter = {
            uid: `${projectSlug}:spec:${sectionName}`,
            title: this.getTitleFromContent(content) || this.name,
            status: 'draft',
            version: '1.0.0',
            created: today,
            prompt_version: `${promptMetadata.id}@v${promptMetadata.version}`,
            edges: dependencies.map(d => `[[${projectSlug}:spec:${d}|depends_on]]`),
            tags: ['spec', sectionName, this.category]
        };
        const frontmatterStr = generateFrontmatter(frontmatter);
        return `${frontmatterStr}\n\n${content}`;
    }
    /**
     * Extract title from content (first H1 or H2)
     */
    getTitleFromContent(content) {
        const match = content.match(/^#+\s+(.+)$/m);
        return match ? match[1].trim() : null;
    }
    /**
     * Get section name from agent ID
     */
    getSectionName() {
        return this.id.replace('_', '-');
    }
    /**
     * Extract summary for token economy (max 500 chars)
     */
    extractSummary(content, maxLength = 500) {
        // Try to find Executive Summary section
        const summaryMatch = content.match(/## Executive Summary\n([\s\S]*?)(?=\n##|$)/);
        if (summaryMatch) {
            return summaryMatch[1].trim().slice(0, maxLength);
        }
        // Fallback: first paragraph after frontmatter
        const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');
        const firstParagraph = withoutFrontmatter.split('\n\n')[0];
        return (firstParagraph || content.slice(0, maxLength)).trim().slice(0, maxLength);
    }
}
//# sourceMappingURL=base.js.map