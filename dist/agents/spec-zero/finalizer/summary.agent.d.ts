/**
 * Summary Agent - Final consolidation agent
 *
 * This agent runs last in the DAG and:
 * - Consolidates all previous agent outputs
 * - Generates an executive summary
 * - Creates navigation index
 * - Produces architecture diagram
 */
import { SubAgent } from '../../base.js';
import type { AgentContext, AgentResult } from '../../../types.js';
export declare class SummaryAgent extends SubAgent {
    readonly id = "summary";
    readonly name = "Summary Agent";
    readonly description = "Consolidates all analysis into an executive summary with navigation.";
    readonly systemPrompt = "You are the summary agent for SPEC-OS analysis.";
    readonly triggers: never[];
    readonly contextDeps: string[];
    readonly promptFile = "summary.md";
    readonly outputFile = "SUMMARY.md";
    readonly category = "";
    process(context: AgentContext): Promise<AgentResult>;
    /**
     * Gather summaries from context or allResults
     */
    private gatherSummaries;
    /**
     * Extract summary section from agent output
     */
    private extractSummaryFromOutput;
    /**
     * Build prompt for summary generation
     */
    private buildSummaryPrompt;
    /**
     * Format agent ID to readable name
     */
    private formatAgentName;
    /**
     * Ensure frontmatter exists
     */
    private ensureFrontmatter;
    /**
     * Generate fallback summary if LLM fails
     */
    private generateFallbackSummary;
    /**
     * Generate index.md for navigation
     */
    private generateIndex;
    /**
     * Extract executive summary from content
     */
    private extractExecutiveSummary;
}
//# sourceMappingURL=summary.agent.d.ts.map