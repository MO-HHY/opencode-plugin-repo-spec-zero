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
import type { AgentContext, AgentResult } from '../../types.js';
import { PromptLoader } from '../../core/prompt-loader.js';
export declare abstract class RepoSpecZeroAgent extends SubAgent {
    abstract readonly promptFile: string;
    abstract readonly contextDeps: string[];
    abstract readonly outputFile: string;
    abstract readonly category: string;
    readonly triggers: never[];
    private _promptLoader;
    /**
     * Get or create prompt loader
     */
    protected get promptLoader(): PromptLoader;
    process(context: AgentContext): Promise<AgentResult>;
    /**
     * Load prompt with version tracking
     */
    private loadVersionedPrompt;
    /**
     * Legacy prompt loading (for backwards compatibility)
     */
    private loadPromptLegacy;
    /**
     * Build analysis context from SharedContext or fallback
     */
    private buildAnalysisContext;
    /**
     * Build user prompt with context
     */
    private buildUserPrompt;
    /**
     * Ensure output has valid SPEC-OS frontmatter
     */
    private ensureFrontmatter;
    /**
     * Extract title from content (first H1 or H2)
     */
    private getTitleFromContent;
    /**
     * Get section name from agent ID
     */
    private getSectionName;
    /**
     * Extract summary for token economy (max 500 chars)
     */
    private extractSummary;
}
//# sourceMappingURL=base.d.ts.map