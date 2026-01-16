/**
 * Analyze Command
 *
 * CLI command for `spec-zero analyze /path/to/repo`
 *
 * Behavior:
 * - No specs exist → GENERATION mode: creates full specs
 * - Specs exist → AUDIT mode: generates AUDIT_REPORT.md only
 *
 * Options:
 * --no-push       Skip push operations
 * --github-owner  GitHub owner for new repos
 * --private       Create private specs repo (default)
 * --public        Create public specs repo
 * --specs-folder  Custom specs folder name (default: specs)
 */
export interface AnalyzeOptions {
    /** Skip push operations */
    noPush?: boolean;
    /** GitHub owner for repo creation */
    githubOwner?: string;
    /** Create private specs repo */
    private?: boolean;
    /** Custom specs folder name */
    specsFolder?: string;
    /** Skip interactive prompts */
    nonInteractive?: boolean;
    /** Task ID (for ClickUp integration) */
    taskId?: string;
    /** Use v2.0.0 mode (default true) */
    useV2?: boolean;
}
export interface AnalyzeResult {
    success: boolean;
    mode: 'generation' | 'audit';
    specsPath: string;
    version?: string;
    changesDetected?: number;
    message: string;
    error?: string;
}
/**
 * Execute the analyze command
 *
 * @param repoPath - Path to the repository to analyze
 * @param options - Command options
 * @returns Analysis result
 */
export declare function analyzeCommand(repoPath: string, options?: AnalyzeOptions): Promise<AnalyzeResult>;
/**
 * Parse CLI arguments for analyze command
 */
export declare function parseAnalyzeArgs(args: string[]): {
    repoPath: string;
    options: AnalyzeOptions;
};
/**
 * Print help for analyze command
 */
export declare function printAnalyzeHelp(): void;
//# sourceMappingURL=analyze.d.ts.map