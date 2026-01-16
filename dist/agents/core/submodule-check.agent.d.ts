/**
 * SubmoduleCheckAgent - Layer 0 Agent
 *
 * First agent in the DAG, runs before bootstrap.
 * Responsibilities:
 * - Check if specs submodule exists
 * - Create submodule if needed (generation mode)
 * - Initialize existing submodule (audit mode)
 * - Detect operation mode (generation vs audit)
 * - Load existing specs for audit comparison
 * - Set context.mode for downstream agents
 */
import { SubAgent } from '../base.js';
import type { AgentContext, AgentResult, SubmoduleState } from '../../types.js';
export interface SubmoduleCheckOptions {
    /** Skip submodule creation (error if not exists) */
    requireExisting?: boolean;
    /** GitHub owner for repo creation */
    githubOwner?: string;
    /** Create private specs repo */
    privateRepo?: boolean;
    /** Skip interactive prompts */
    nonInteractive?: boolean;
    /** Skip push operations */
    noPush?: boolean;
}
export interface SubmoduleCheckResult {
    /** Current submodule state */
    state: SubmoduleState;
    /** Whether submodule was created in this run */
    created: boolean;
    /** Whether submodule was initialized in this run */
    initialized: boolean;
    /** Human-readable summary */
    summary: string;
}
export declare class SubmoduleCheckAgent extends SubAgent {
    readonly id = "submodule_check";
    readonly name = "Submodule Check Agent";
    readonly description = "Checks and initializes the specs Git submodule, detecting operation mode.";
    readonly systemPrompt = "You are a submodule management agent that prepares the specs repository.";
    readonly triggers: never[];
    private submoduleManager;
    /**
     * Get or create SubmoduleManager instance
     */
    private getSubmoduleManager;
    process(context: AgentContext): Promise<AgentResult>;
    /**
     * Create new specs repo and add as submodule
     */
    private createSubmodule;
    /**
     * Build human-readable summary
     */
    private buildSummary;
}
//# sourceMappingURL=submodule-check.agent.d.ts.map