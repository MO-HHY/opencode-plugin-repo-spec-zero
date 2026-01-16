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

import * as path from 'path';
import * as fs from 'fs';

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
export async function analyzeCommand(
    repoPath: string,
    options: AnalyzeOptions = {}
): Promise<AnalyzeResult> {
    const resolvedPath = path.resolve(repoPath);
    
    // Validate path exists
    if (!fs.existsSync(resolvedPath)) {
        return {
            success: false,
            mode: 'generation',
            specsPath: '',
            message: `Repository path does not exist: ${resolvedPath}`,
            error: 'ENOENT'
        };
    }

    // Validate it's a git repository
    const gitPath = path.join(resolvedPath, '.git');
    if (!fs.existsSync(gitPath)) {
        return {
            success: false,
            mode: 'generation',
            specsPath: '',
            message: `Not a git repository: ${resolvedPath}`,
            error: 'NOT_GIT_REPO'
        };
    }

    console.log(`[Analyze] Starting analysis of ${resolvedPath}`);
    console.log(`[Analyze] Options:`, JSON.stringify(options, null, 2));

    // Build params for orchestrator
    const params = {
        repoPath: resolvedPath,
        noPush: options.noPush ?? false,
        githubOwner: options.githubOwner,
        privateRepo: options.private !== false,
        specsFolder: options.specsFolder ?? 'specs',
        nonInteractive: options.nonInteractive ?? false,
        taskId: options.taskId,
        useV2: options.useV2 !== false,
        pluginVersion: '2.0.0',
    };

    // TODO: Connect to actual orchestrator execution
    // For now, return a placeholder that indicates the command is available
    
    return {
        success: true,
        mode: 'generation',
        specsPath: path.join(resolvedPath, params.specsFolder),
        message: `Analyze command ready. Path: ${resolvedPath}`,
    };
}

/**
 * Parse CLI arguments for analyze command
 */
export function parseAnalyzeArgs(args: string[]): { repoPath: string; options: AnalyzeOptions } {
    const options: AnalyzeOptions = {};
    let repoPath = '.';

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--no-push') {
            options.noPush = true;
        } else if (arg === '--github-owner' && args[i + 1]) {
            options.githubOwner = args[++i];
        } else if (arg === '--private') {
            options.private = true;
        } else if (arg === '--public') {
            options.private = false;
        } else if (arg === '--specs-folder' && args[i + 1]) {
            options.specsFolder = args[++i];
        } else if (arg === '--non-interactive' || arg === '-y') {
            options.nonInteractive = true;
        } else if (arg === '--task-id' && args[i + 1]) {
            options.taskId = args[++i];
        } else if (arg === '--v1') {
            options.useV2 = false;
        } else if (!arg.startsWith('-')) {
            repoPath = arg;
        }
    }

    return { repoPath, options };
}

/**
 * Print help for analyze command
 */
export function printAnalyzeHelp(): void {
    console.log(`
spec-zero analyze [path] [options]

Analyze a repository and generate specifications.

Arguments:
  path              Path to the repository (default: current directory)

Options:
  --no-push         Skip push operations after commit
  --github-owner    GitHub owner/org for specs repo creation
  --private         Create private specs repository (default)
  --public          Create public specs repository
  --specs-folder    Custom specs folder name (default: specs)
  --non-interactive Skip confirmation prompts
  --task-id         ClickUp task ID for integration
  --v1              Use v1.x mode (no submodule, arch-docs style)

Examples:
  spec-zero analyze .
  spec-zero analyze /path/to/repo --no-push
  spec-zero analyze . --github-owner my-org --public
`);
}
