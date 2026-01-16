/**
 * WriteSpecsAgent - Generation Mode Finalizer
 *
 * Layer 9 agent that runs after summary in GENERATION mode.
 * Responsibilities:
 * - Write all agent outputs to _generated/ folder
 * - Create initial manifest with v1.0.0
 * - Generate index.md with AUTO/MANUAL sections
 * - Prepare for commit-push agent
 *
 * Only runs in GENERATION mode (first-time analysis).
 */
import { SubAgent } from '../../base.js';
import type { AgentContext, AgentResult } from '../../../types.js';
export interface WriteSpecsResult {
    /** Files written */
    filesWritten: string[];
    /** New version */
    version: string;
    /** Path to specs folder */
    specsPath: string;
    /** Summary of operation */
    summary: string;
}
export declare class WriteSpecsAgent extends SubAgent {
    readonly id = "write_specs";
    readonly name = "Write Specs Agent";
    readonly description = "Writes all generated specs to the _generated folder in GENERATION mode.";
    readonly systemPrompt = "You are the specs writer agent for generation mode.";
    readonly triggers: never[];
    private submoduleManager;
    /**
     * Get or create SubmoduleManager instance
     */
    private getSubmoduleManager;
    process(context: AgentContext): Promise<AgentResult>;
    /**
     * Collect outputs from all analysis agents
     */
    private collectAgentOutputs;
    /**
     * Generate index.md with AUTO and MANUAL sections
     */
    private generateIndex;
    /**
     * Build the auto-generated section of index.md
     */
    private buildAutoSection;
    /**
     * Build the manual section template
     */
    private buildManualSection;
    /**
     * Format repo type for display
     */
    private formatRepoType;
    /**
     * Format agent ID to title
     */
    private formatAgentTitle;
    /**
     * Get agent description for index
     */
    private getAgentDescription;
    /**
     * Build human-readable summary
     */
    private buildSummary;
}
//# sourceMappingURL=write-specs.agent.d.ts.map