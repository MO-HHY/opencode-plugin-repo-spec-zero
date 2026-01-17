/**
 * GenericAnalysisAgent - Generic agent driven by external prompts
 *
 * This agent replaces all specialized analysis agents with a single
 * configurable agent that receives its behavior from:
 * - PlannedAgent configuration from SmartDAGPlanner
 * - Prompts from PromptRouter
 * - Templates from TemplateLoader
 */
import type { AgentContext, AgentResult } from '../types.js';
import type { PlannedAgent } from '../types.js';
import { SubAgent } from './base.js';
import type { PromptRouter } from '../core/prompt-router.js';
import type { TemplateLoader } from '../core/template-loader.js';
import type { DiagramGenerator } from '../core/diagram-generator.js';
export declare class GenericAnalysisAgent extends SubAgent {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly systemPrompt: string;
    readonly triggers: RegExp[];
    private config;
    private router;
    private templateLoader;
    private diagramGenerator?;
    constructor(config: PlannedAgent, router: PromptRouter, templateLoader: TemplateLoader, diagramGenerator?: DiagramGenerator);
    /**
     * Main process method - executes the analysis
     */
    process(context: AgentContext): Promise<AgentResult>;
    /**
     * Get the routed prompt for this agent
     */
    private getRoutedPrompt;
    /**
     * Build messages array for LLM
     */
    private buildLLMMessages;
    /**
     * Call the LLM with messages
     */
    private callLLM;
    /**
     * Apply template to LLM output
     */
    private applyTemplate;
    /**
     * Extract variables from LLM output markdown
     */
    private extractVariablesFromContent;
    /**
     * Process diagrams - extract inline and create standalone
     */
    private processDiagrams;
    /**
     * Extract Mermaid diagram of specific type from content
     */
    private extractMermaidDiagram;
    /**
     * Check if diagram content matches the expected type
     */
    private isDiagramType;
    /**
     * Wrap diagram with YAML frontmatter
     */
    private wrapWithFrontmatter;
    /**
     * Get human-readable title for diagram type
     */
    private getDiagramTitle;
}
//# sourceMappingURL=generic-analysis.agent.d.ts.map