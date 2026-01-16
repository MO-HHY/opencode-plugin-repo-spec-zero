/**
 * CommitPushAgent - Git Commit & Push Handler
 *
 * Layer 10 agent that runs after write_specs or audit_report.
 * Handles three scenarios:
 * 1. GENERATION: Commit all specs, push both submodule and parent
 * 2. AUDIT: Commit only AUDIT_REPORT.md
 * 3. APPLY: Commit updated specs + archived audit (invoked by apply command)
 *
 * Commits to the specs submodule first, then updates parent reference.
 */
import { SubAgent } from '../../base.js';
import type { AgentContext, AgentResult } from '../../../types.js';
export interface CommitPushResult {
    /** Submodule commit SHA */
    submoduleSha: string;
    /** Parent commit SHA (if parent was updated) */
    parentSha?: string;
    /** Commit message used */
    message: string;
    /** Whether push succeeded */
    pushed: boolean;
    /** Summary of operation */
    summary: string;
}
export declare class CommitPushAgent extends SubAgent {
    readonly id = "commit_push";
    readonly name = "Commit Push Agent";
    readonly description = "Commits and pushes changes to the specs submodule and parent repo.";
    readonly systemPrompt = "You are the commit-push agent for specs management.";
    readonly triggers: never[];
    private submoduleManager;
    /**
     * Get or create SubmoduleManager instance
     */
    private getSubmoduleManager;
    process(context: AgentContext): Promise<AgentResult>;
    /**
     * Build commit messages based on operation type
     */
    private buildCommitMessages;
    /**
     * Stage submodule reference in parent
     */
    private stageSubmoduleInParent;
    /**
     * Build human-readable summary
     */
    private buildSummary;
}
//# sourceMappingURL=commit-push.agent.d.ts.map