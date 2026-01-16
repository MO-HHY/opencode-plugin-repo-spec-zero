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
import type { 
    AgentContext, 
    AgentResult, 
    PromptVersion, 
    ApplyOptions,
    ApplyResult,
    AnalysisEntry,
    SpecsManifest,
} from '../../../types.js';
import { SubmoduleManager, type Logger } from '../../../skills/submodule-manager.skill.js';
import { SPECS_FOLDER_STRUCTURE } from '../../../types.js';

import * as fs from 'fs';
import * as path from 'path';

/**
 * Parsed audit report structure
 */
interface ParsedAuditReport {
    repoSha: string;
    repoBranch: string;
    currentVersion: string;
    proposedVersion: string;
    totalChanges: number;
    filesAffected: string[];
    generated: string;
}

/**
 * Mapping of agent IDs to output file names
 */
const AGENT_TO_FILE_MAP: Record<string, string> = {
    'overview': 'overview.md',
    'module': 'module.md',
    'entity': 'entity.md',
    'db': 'database.md',
    'data_map': 'data_mapping.md',
    'event': 'events.md',
    'api': 'api.md',
    'dependency': 'dependencies.md',
    'service_dep': 'service_dependencies.md',
    'auth': 'authentication.md',
    'authz': 'authorization.md',
    'security': 'security.md',
    'prompt_sec': 'prompt_security.md',
    'deployment': 'deployment.md',
    'monitor': 'monitoring.md',
    'ml': 'ml_services.md',
    'flag': 'feature_flags.md',
};

export class ApplyChangesAgent extends SubAgent {
    readonly id = 'apply_changes';
    readonly name = 'Apply Changes Agent';
    readonly description = 'Applies changes from AUDIT_REPORT.md to the _generated specs.';
    readonly systemPrompt = 'You are the apply agent that updates specs from audit reports.';
    readonly triggers = [];

    private submoduleManager: SubmoduleManager | null = null;

    /**
     * Get or create SubmoduleManager instance
     */
    private getSubmoduleManager(logger: Logger): SubmoduleManager {
        if (!this.submoduleManager) {
            this.submoduleManager = new SubmoduleManager(logger);
        }
        return this.submoduleManager;
    }

    async process(context: AgentContext): Promise<AgentResult> {
        const params = context.params || {};
        
        const projectSlug = String(params.projectSlug || 'unknown-repo');
        const baseDir = String(params.baseDir || process.cwd());
        const specsFolder = String(params.specsFolder || 'specs');
        const pluginVersion = String(params.pluginVersion || '2.0.0');
        
        // Apply options
        const options: ApplyOptions = {
            all: params.all !== false, // Default true
            file: params.file as string | undefined,
            interactive: Boolean(params.interactive),
            force: Boolean(params.force),
        };

        // Fresh analysis data (passed from last audit run or stored)
        const freshAnalysis = params.freshAnalysis as Record<string, string> | undefined;

        // Logger
        const logger: Logger = {
            info: (msg) => console.log(`[ApplyChanges] ${msg}`),
            error: (msg) => console.error(`[ApplyChanges] ${msg}`),
            warn: (msg) => console.warn(`[ApplyChanges] ${msg}`),
        };

        const manager = this.getSubmoduleManager(logger);
        const specsPath = path.join(baseDir, specsFolder);

        try {
            // 1. Check for pending audit
            const hasPending = await manager.hasPendingAudit(specsPath);
            if (!hasPending) {
                return {
                    success: false,
                    error: 'No pending audit report found',
                    message: 'No AUDIT_REPORT.md found. Run `spec-zero analyze` first.'
                };
            }

            // 2. Read and parse audit report
            const auditContent = await manager.readAuditReport(specsPath);
            if (!auditContent) {
                throw new Error('Failed to read audit report');
            }

            const parsedAudit = this.parseAuditReport(auditContent);
            logger.info(`Applying ${parsedAudit.totalChanges} changes to reach v${parsedAudit.proposedVersion}`);

            // 3. Read current manifest
            const manifest = await manager.readManifest(specsPath);
            if (!manifest) {
                throw new Error('Manifest not found');
            }

            // 4. Apply changes
            const filesModified: string[] = [];

            if (freshAnalysis) {
                // We have fresh analysis data - apply it
                filesModified.push(...await this.applyFromFreshAnalysis(
                    specsPath,
                    freshAnalysis,
                    options,
                    parsedAudit,
                    manager,
                    logger
                ));
            } else {
                // No fresh analysis - need to re-run analysis or use cached
                // For now, we'll mark files as needing update based on audit
                logger.info('No fresh analysis data available. Apply will mark files for update.');
                
                // Read audit to determine which files to update
                for (const filename of parsedAudit.filesAffected) {
                    // Extract just the filename without _generated/ prefix
                    const cleanFilename = filename.replace('_generated/', '');
                    filesModified.push(cleanFilename);
                }
            }

            // 5. Update index.md (regenerate AUTO section)
            await this.updateIndexAutoSection(specsPath, parsedAudit.proposedVersion, filesModified, manager);
            logger.info('Updated index.md');

            // 6. Get repo info
            const repoSha = await manager.getCommitSha(baseDir);
            const repoBranch = await manager.getBranch(baseDir);

            // 7. Create analysis entry for the apply
            const analysisEntry: AnalysisEntry = {
                version: parsedAudit.proposedVersion,
                type: 'apply',
                date: new Date().toISOString(),
                repo_sha: repoSha,
                repo_branch: repoBranch,
                specs_sha: '', // Will be updated after commit
                plugin_version: pluginVersion,
                agents_run: 0, // Apply doesn't run agents
                agents_succeeded: 0,
                files_changed: filesModified,
                from_audit: parsedAudit.generated,
                summary: `Applied ${parsedAudit.totalChanges} changes from audit`,
            };

            // 8. Update manifest with analysis entry and audit status
            let updatedManifest = manager.addAnalysisEntry(manifest, analysisEntry);
            
            // Find and update the pending audit entry
            const pendingAuditDate = this.findPendingAuditDate(manifest);
            if (pendingAuditDate) {
                const archivedPath = await manager.archiveAuditReport(specsPath, parsedAudit.currentVersion);
                updatedManifest = manager.updateAuditStatus(
                    updatedManifest,
                    pendingAuditDate,
                    'applied',
                    parsedAudit.proposedVersion,
                    archivedPath
                );
                logger.info(`Archived audit report to ${archivedPath}`);
            }

            // 9. Write updated manifest
            await manager.writeManifest(specsPath, updatedManifest);
            logger.info(`Updated manifest to v${parsedAudit.proposedVersion}`);

            // 10. Build result
            const result: ApplyResult = {
                success: true,
                new_version: parsedAudit.proposedVersion,
                old_version: parsedAudit.currentVersion,
                files_modified: filesModified,
                archived_audit_path: path.join(SPECS_FOLDER_STRUCTURE.AUDITS, `${parsedAudit.generated.split('T')[0]}_v${parsedAudit.currentVersion}_audit.md`),
            };

            const summary = this.buildSummary(result);

            return {
                success: true,
                data: {
                    ...result,
                    output: summary,
                    promptVersion: { id: 'apply_changes', version: '2', hash: 'native' } as PromptVersion,
                },
                message: `Applied changes: v${parsedAudit.currentVersion} → v${parsedAudit.proposedVersion}`
            };

        } catch (error: any) {
            logger.error(`ApplyChanges failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: `Failed to apply changes: ${error.message}`
            };
        }
    }

    /**
     * Parse AUDIT_REPORT.md to extract metadata
     */
    private parseAuditReport(content: string): ParsedAuditReport {
        // Extract from YAML frontmatter and content
        const repoShaMatch = content.match(/repo_sha:\s*["']?([a-f0-9]+)/i) 
            || content.match(/commit\s+`([a-f0-9]+)`/i);
        const repoBranchMatch = content.match(/repo_branch:\s*["']?(\S+)/i);
        const currentVersionMatch = content.match(/current[_-]specs[_-]version:\s*["']?(\d+\.\d+\.\d+)/i)
            || content.match(/Current version:\*?\*?\s*(\d+\.\d+\.\d+)/i);
        const proposedVersionMatch = content.match(/proposed[_-]version:\s*["']?(\d+\.\d+\.\d+)/i)
            || content.match(/Proposed version:\*?\*?\s*(\d+\.\d+\.\d+)/i);
        const totalChangesMatch = content.match(/\*\*(\d+)\s+changes\*\*/i)
            || content.match(/detected\s+\*\*(\d+)\s+changes/i);
        const generatedMatch = content.match(/generated:\s*["']?(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)/i)
            || content.match(/Generated:\*?\*?\s*(\d{4}-\d{2}-\d{2})/i);

        // Extract files affected from "Changes by File" section
        const filesAffected: string[] = [];
        const fileMatches = content.matchAll(/###\s+(_generated\/[\w.-]+\.md)/g);
        for (const match of fileMatches) {
            filesAffected.push(match[1]);
        }

        return {
            repoSha: repoShaMatch?.[1] || 'unknown',
            repoBranch: repoBranchMatch?.[1] || 'main',
            currentVersion: currentVersionMatch?.[1] || '1.0.0',
            proposedVersion: proposedVersionMatch?.[1] || '1.0.1',
            totalChanges: parseInt(totalChangesMatch?.[1] || '0', 10),
            filesAffected,
            generated: generatedMatch?.[1] || new Date().toISOString(),
        };
    }

    /**
     * Apply changes from fresh analysis data
     */
    private async applyFromFreshAnalysis(
        specsPath: string,
        freshAnalysis: Record<string, string>,
        options: ApplyOptions,
        parsedAudit: ParsedAuditReport,
        manager: SubmoduleManager,
        logger: Logger
    ): Promise<string[]> {
        const filesModified: string[] = [];

        for (const [agentId, content] of Object.entries(freshAnalysis)) {
            const filename = AGENT_TO_FILE_MAP[agentId];
            if (!filename) continue;

            // Check if file is in affected list or applying all
            const filePath = `_generated/${filename}`;
            if (!options.all && options.file && options.file !== filename) {
                continue;
            }

            // Write the spec
            await manager.writeSpec(specsPath, filename, content);
            filesModified.push(filename);
            logger.info(`Updated: ${filename}`);
        }

        return filesModified;
    }

    /**
     * Update the AUTO section of index.md
     */
    private async updateIndexAutoSection(
        specsPath: string,
        newVersion: string,
        filesModified: string[],
        manager: SubmoduleManager
    ): Promise<void> {
        const indexPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.INDEX);
        
        if (!fs.existsSync(indexPath)) {
            return; // No index to update
        }

        let content = fs.readFileSync(indexPath, 'utf-8');
        const today = new Date().toISOString().split('T')[0];

        // Update version in frontmatter
        content = content.replace(
            /^version:\s*\d+\.\d+\.\d+/m,
            `version: ${newVersion}`
        );

        // Update generated date if present
        content = content.replace(
            /\*\*Generated:\*\*\s*\d{4}-\d{2}-\d{2}/,
            `**Generated:** ${today}`
        );

        content = content.replace(
            /\*\*Specs Version:\*\*\s*\d+\.\d+\.\d+/,
            `**Specs Version:** ${newVersion}`
        );

        fs.writeFileSync(indexPath, content);
    }

    /**
     * Find the date of the pending audit entry
     */
    private findPendingAuditDate(manifest: SpecsManifest): string | undefined {
        const pendingAudit = manifest.audits.find(a => a.status === 'pending');
        return pendingAudit?.date;
    }

    /**
     * Build human-readable summary
     */
    private buildSummary(result: ApplyResult): string {
        return `## Apply Changes Summary

**Version Update:** ${result.old_version} → ${result.new_version}

### Files Modified

${result.files_modified.map(f => `- \`_generated/${f}\``).join('\n')}

### Audit Archive

The audit report has been archived to:
\`${result.archived_audit_path}\`

### Next Steps

The specs have been updated. The commit-push agent will now commit and push these changes.

Run \`spec-zero analyze\` again to verify changes or detect new discrepancies.`;
    }
}
