/**
 * System Context Prompt - Shared context for all agents
 *
 * This prompt is prepended to all agent prompts to establish:
 * - Role and expertise
 * - Analysis guidelines
 * - Citation requirements
 * - Output expectations
 */
/**
 * Get system context prompt with dynamic values
 */
export declare function getSystemContext(variables: {
    projectSlug: string;
    repoType: string;
    analysisDate?: string;
}): string;
/**
 * Minimal system context for token-constrained scenarios
 */
export declare function getMinimalSystemContext(projectSlug: string, repoType: string): string;
/**
 * System context for the summary/finalizer agent
 */
export declare function getSummarySystemContext(projectSlug: string, repoType: string): string;
/**
 * Repo-type specific context additions
 */
export declare const REPO_TYPE_CONTEXTS: Record<string, string>;
/**
 * Get full system context with repo-type additions
 */
export declare function getFullSystemContext(variables: {
    projectSlug: string;
    repoType: string;
    analysisDate?: string;
}): string;
//# sourceMappingURL=system-context.d.ts.map