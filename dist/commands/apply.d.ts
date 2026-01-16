/**
 * Apply Command
 *
 * CLI command for `spec-zero apply /path/to/repo`
 *
 * Reads AUDIT_REPORT.md and applies changes to _generated/ specs.
 *
 * Options:
 * --all           Apply all changes (default)
 * --file          Apply changes to specific file only
 * --interactive   Interactive mode - prompt for each change
 * --no-push       Skip push operations
 * --force         Skip confirmation prompts
 */
export interface ApplyCommandOptions {
    /** Apply all changes */
    all?: boolean;
    /** Apply changes to specific file only */
    file?: string;
    /** Interactive mode */
    interactive?: boolean;
    /** Skip push operations */
    noPush?: boolean;
    /** Skip confirmation prompts */
    force?: boolean;
    /** Custom specs folder name */
    specsFolder?: string;
}
export interface ApplyCommandResult {
    success: boolean;
    oldVersion?: string;
    newVersion?: string;
    filesModified: string[];
    archivedAuditPath?: string;
    message: string;
    error?: string;
}
/**
 * Execute the apply command
 *
 * @param repoPath - Path to the repository
 * @param options - Command options
 * @returns Apply result
 */
export declare function applyCommand(repoPath: string, options?: ApplyCommandOptions): Promise<ApplyCommandResult>;
/**
 * Parse CLI arguments for apply command
 */
export declare function parseApplyArgs(args: string[]): {
    repoPath: string;
    options: ApplyCommandOptions;
};
/**
 * Print help for apply command
 */
export declare function printApplyHelp(): void;
//# sourceMappingURL=apply.d.ts.map