/**
 * ApplyChangesAgent - Apply Command Handler
 *
 * Invoked by the `spec-zero apply` command, NOT part of the analyze DAG.
 * Responsibilities:
 * - Read and parse AUDIT_REPORT.md
 * - Apply changes to _generated/ files
 * - Calculate and assign new version
 * - Archive audit report to _audits/
 * - Update manifest with apply entry
 * - Prepare for commit-push
 */
import { SubAgent } from '../../base.js';
import type { AgentContext, AgentResult } from '../../../types.js';
export declare class ApplyChangesAgent extends SubAgent {
    readonly id = "apply_changes";
    readonly name = "Apply Changes Agent";
    readonly description = "Applies changes from AUDIT_REPORT.md to the _generated specs.";
    readonly systemPrompt = "You are the apply agent that updates specs from audit reports.";
    readonly triggers: never[];
    private submoduleManager;
    /**
     * Get or create SubmoduleManager instance
     */
    private getSubmoduleManager;
    process(context: AgentContext): Promise<AgentResult>;
    /**
     * Parse AUDIT_REPORT.md to extract metadata
     */
    private parseAuditReport;
    /**
     * Apply changes from fresh analysis data
     */
    private applyFromFreshAnalysis;
    /**
     * Update the AUTO section of index.md
     */
    private updateIndexAutoSection;
    /**
     * Find the date of the pending audit entry
     */
    private findPendingAuditDate;
    /**
     * Build human-readable summary
     */
    private buildSummary;
}
//# sourceMappingURL=apply-changes.agent.d.ts.map