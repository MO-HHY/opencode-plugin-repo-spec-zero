/**
 * AuditReportAgent - Audit Mode Finalizer
 *
 * Layer 9 agent that runs after summary in AUDIT mode.
 * Responsibilities:
 * - Compare fresh analysis with existing specs
 * - Detect added, removed, and modified items
 * - Generate comprehensive AUDIT_REPORT.md
 * - Update manifest with audit entry (status: pending)
 * - Does NOT modify any existing spec files
 *
 * Only runs in AUDIT mode (subsequent analyses).
 */
import { SubAgent } from '../../base.js';
import type { AgentContext, AgentResult, AuditReport } from '../../../types.js';
export interface AuditReportResult {
    /** Generated audit report */
    report: AuditReport;
    /** Path to audit report file */
    reportPath: string;
    /** Summary of changes */
    summary: string;
}
export declare class AuditReportAgent extends SubAgent {
    readonly id = "audit_report";
    readonly name = "Audit Report Agent";
    readonly description = "Compares fresh analysis with existing specs and generates AUDIT_REPORT.md.";
    readonly systemPrompt = "You are the audit agent that detects changes between analyses.";
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
     * Compare existing specs with fresh analysis
     */
    private compareSpecs;
    /**
     * Compare content of two spec files
     * Uses section-based comparison for structured detection
     */
    private compareContent;
    /**
     * Extract sections (H2 headers) from markdown
     */
    private extractSections;
    /**
     * Normalize content for comparison (remove timestamps, whitespace variations)
     */
    private normalizeContent;
    /**
     * Calculate summary statistics
     */
    private calculateSummary;
    /**
     * Generate markdown content for audit report
     */
    private generateReportMarkdown;
    /**
     * Build human-readable summary text
     */
    private buildSummaryText;
}
//# sourceMappingURL=audit-report.agent.d.ts.map