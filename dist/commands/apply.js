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
import * as path from 'path';
import * as fs from 'fs';
import { SPECS_FOLDER_STRUCTURE } from '../types.js';
import { SubmoduleManager } from '../skills/submodule-manager.skill.js';
/**
 * Execute the apply command
 *
 * @param repoPath - Path to the repository
 * @param options - Command options
 * @returns Apply result
 */
export async function applyCommand(repoPath, options = {}) {
    const resolvedPath = path.resolve(repoPath);
    const specsFolder = options.specsFolder ?? 'specs';
    const specsPath = path.join(resolvedPath, specsFolder);
    // Validate path exists
    if (!fs.existsSync(resolvedPath)) {
        return {
            success: false,
            filesModified: [],
            message: `Repository path does not exist: ${resolvedPath}`,
            error: 'ENOENT'
        };
    }
    // Validate specs folder exists
    if (!fs.existsSync(specsPath)) {
        return {
            success: false,
            filesModified: [],
            message: `Specs folder does not exist: ${specsPath}. Run 'spec-zero analyze' first.`,
            error: 'NO_SPECS'
        };
    }
    // Check for pending audit report
    const auditReportPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.AUDIT_REPORT);
    if (!fs.existsSync(auditReportPath)) {
        return {
            success: false,
            filesModified: [],
            message: `No pending audit report found at ${auditReportPath}. Run 'spec-zero analyze' first.`,
            error: 'NO_AUDIT'
        };
    }
    console.log(`[Apply] Applying changes from ${auditReportPath}`);
    console.log(`[Apply] Options:`, JSON.stringify(options, null, 2));
    // Create logger
    const logger = {
        info: (msg) => console.log(`[Apply] ${msg}`),
        error: (msg) => console.error(`[Apply] ${msg}`),
        warn: (msg) => console.warn(`[Apply] ${msg}`),
    };
    // Initialize manager
    const manager = new SubmoduleManager(logger, { noPush: options.noPush });
    try {
        // Read manifest to get current version
        const manifest = await manager.readManifest(specsPath);
        if (!manifest) {
            return {
                success: false,
                filesModified: [],
                message: 'Could not read manifest',
                error: 'NO_MANIFEST'
            };
        }
        const currentVersion = manifest.current_version;
        logger.info(`Current version: ${currentVersion}`);
        // Read audit report
        const auditContent = fs.readFileSync(auditReportPath, 'utf-8');
        // Parse proposed version from audit
        const proposedVersionMatch = auditContent.match(/proposed[_-]version:\s*["']?(\d+\.\d+\.\d+)/i)
            || auditContent.match(/Proposed version:\*?\*?\s*(\d+\.\d+\.\d+)/i);
        const proposedVersion = proposedVersionMatch?.[1] || manager.calculateNextVersion(currentVersion, 'patch');
        // For now, we need fresh analysis data to apply
        // The actual apply logic is in ApplyChangesAgent
        // This command would trigger that agent or use cached data
        logger.info(`Would update ${currentVersion} -> ${proposedVersion}`);
        // TODO: Connect to ApplyChangesAgent for actual application
        // For now, return placeholder
        return {
            success: true,
            oldVersion: currentVersion,
            newVersion: proposedVersion,
            filesModified: [],
            message: `Apply command ready. Would update ${currentVersion} -> ${proposedVersion}`,
        };
    }
    catch (error) {
        logger.error(`Apply failed: ${error.message}`);
        return {
            success: false,
            filesModified: [],
            message: `Apply failed: ${error.message}`,
            error: error.message
        };
    }
}
/**
 * Parse CLI arguments for apply command
 */
export function parseApplyArgs(args) {
    const options = {
        all: true, // Default
    };
    let repoPath = '.';
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--all') {
            options.all = true;
            options.file = undefined;
        }
        else if (arg === '--file' && args[i + 1]) {
            options.file = args[++i];
            options.all = false;
        }
        else if (arg === '--interactive' || arg === '-i') {
            options.interactive = true;
        }
        else if (arg === '--no-push') {
            options.noPush = true;
        }
        else if (arg === '--force' || arg === '-f') {
            options.force = true;
        }
        else if (arg === '--specs-folder' && args[i + 1]) {
            options.specsFolder = args[++i];
        }
        else if (!arg.startsWith('-')) {
            repoPath = arg;
        }
    }
    return { repoPath, options };
}
/**
 * Print help for apply command
 */
export function printApplyHelp() {
    console.log(`
spec-zero apply [path] [options]

Apply changes from an audit report to the specs.

Arguments:
  path              Path to the repository (default: current directory)

Options:
  --all             Apply all changes (default)
  --file <name>     Apply changes to specific file only
  --interactive     Interactive mode - prompt for each change
  --no-push         Skip push operations after commit
  --force           Skip confirmation prompts
  --specs-folder    Custom specs folder name (default: specs)

Examples:
  spec-zero apply .
  spec-zero apply /path/to/repo --no-push
  spec-zero apply . --file api.md
  spec-zero apply . --interactive
`);
}
//# sourceMappingURL=apply.js.map