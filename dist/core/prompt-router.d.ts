/**
 * PromptRouter - Intelligent prompt routing and composition
 *
 * Responsibilities:
 * 1. Select appropriate prompts for context
 * 2. Compose prompts with base + specific + output schema
 * 3. Add diagram instructions
 * 4. Provide templates to use
 */
import type { RoutingContext, RoutedPrompt } from '../types.js';
import { PromptRegistry } from './prompt-registry.js';
export declare class PromptRouter {
    private registry;
    private promptsDir;
    constructor(registry: PromptRegistry, promptsDir: string);
    /**
     * Route: select and compose prompt for an agent
     */
    route(context: RoutingContext): RoutedPrompt;
    /**
     * Select the most appropriate prompt for the current context
     */
    private selectPrompt;
    /**
     * Load base system prompt
     */
    private loadBaseSystem;
    /**
     * Load output schema
     */
    private loadOutputSchema;
    /**
     * Build context from previous agent outputs
     */
    private buildPreviousContext;
    /**
     * Build diagram generation instructions
     */
    private buildDiagramInstructions;
    /**
     * Get description for diagram type
     */
    private getDiagramDescription;
    /**
     * Compose system prompt with repo context
     */
    private composeSystemPrompt;
    /**
     * Compose analysis prompt with context and diagrams
     */
    private composeAnalysisPrompt;
    /**
     * Get Mermaid template for diagram type
     */
    private getDiagramTemplate;
    /**
     * Default system prompt fallback
     */
    private getDefaultSystemPrompt;
    /**
     * Default output schema fallback
     */
    private getDefaultOutputSchema;
}
/**
 * Factory function
 */
export declare function createPromptRouter(registry: PromptRegistry, promptsDir: string): PromptRouter;
//# sourceMappingURL=prompt-router.d.ts.map