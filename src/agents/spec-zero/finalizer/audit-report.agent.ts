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
import type { 
    AgentContext, 
    AgentResult, 
    PromptVersion, 
    AuditReport,
    AuditReportMeta,
    AuditSummary,
    FileChanges,
    ChangeItem,
    AuditEntry,
    VersionBumpType,
} from '../../../types.js';
import type { SharedContext } from '../../../core/context.js';
import { SubmoduleManager, type Logger } from '../../../skills/submodule-manager.skill.js';
import { SPECS_FOLDER_STRUCTURE } from '../../../types.js';
import { generateFrontmatter, type SpecOSFrontmatter } from '../../../prompts/output-schema.js';

import * as fs from 'fs';
import * as path from 'path';

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

export interface AuditReportResult {
    /** Generated audit report */
    report: AuditReport;
    /** Path to audit report file */
    reportPath: string;
    /** Summary of changes */
    summary: string;
}

export class AuditReportAgent extends SubAgent {
    readonly id = 'audit_report';
    readonly name = 'Audit Report Agent';
    readonly description = 'Compares fresh analysis with existing specs and generates AUDIT_REPORT.md.';
    readonly systemPrompt = 'You are the audit agent that detects changes between analyses.';
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
        
        const sharedContext = params.sharedContext as SharedContext | undefined;
        const allResults = params.allResults as Record<string, any> || {};
        
        // Mode check - only run in audit mode
        const mode = params.mode as string;
        if (mode !== 'audit') {
            return {
                success: true,
                message: 'AuditReportAgent skipped in generation mode',
                data: { skipped: true }
            };
        }

        // Logger
        const logger: Logger = {
            info: (msg) => console.log(`[AuditReport] ${msg}`),
            error: (msg) => console.error(`[AuditReport] ${msg}`),
            warn: (msg) => console.warn(`[AuditReport] ${msg}`),
        };

        const manager = this.getSubmoduleManager(logger);
        const specsPath = path.join(baseDir, specsFolder);

        try {
            logger.info(`Generating audit report for ${specsPath}`);

            // 1. Get current manifest
            const manifest = await manager.readManifest(specsPath);
            if (!manifest) {
                throw new Error('Manifest not found - cannot audit without manifest');
            }
            const currentVersion = manifest.current_version;
            logger.info(`Current specs version: ${currentVersion}`);

            // 2. Read existing specs
            const existingSpecs = await manager.readExistingSpecs(specsPath);
            logger.info(`Loaded ${existingSpecs.size} existing spec files`);

            // 3. Collect fresh analysis outputs
            const freshAnalysis = this.collectAgentOutputs(sharedContext, allResults);
            logger.info(`Collected ${freshAnalysis.size} fresh analysis outputs`);

            // 4. Compare and detect changes
            const fileChanges = this.compareSpecs(existingSpecs, freshAnalysis, logger);
            
            // 5. Calculate summary
            const summary = this.calculateSummary(fileChanges);
            logger.info(`Detected ${summary.total_changes} changes across ${summary.files_affected} files`);

            // 6. Determine proposed version
            const bumpType = manager.determineBumpType(summary.added, summary.removed, summary.modified);
            const proposedVersion = manager.calculateNextVersion(currentVersion, bumpType);

            // 7. Get repo info
            const repoSha = await manager.getCommitSha(baseDir);
            const repoBranch = await manager.getBranch(baseDir);

            // 8. Build report metadata
            const meta: AuditReportMeta = {
                uid: `${projectSlug}:spec:audit`,
                title: 'Spec Audit Report',
                status: 'pending',
                generated: new Date().toISOString(),
                repo_sha: repoSha,
                repo_branch: repoBranch,
                plugin_version: pluginVersion,
                current_specs_version: currentVersion,
                proposed_version: proposedVersion,
            };

            // 9. Build complete report
            const report: AuditReport = {
                meta,
                summary,
                changes: fileChanges,
            };

            // 10. Generate markdown content
            const reportContent = this.generateReportMarkdown(report, projectSlug);

            // 11. Write audit report
            await manager.writeAuditReport(specsPath, reportContent);
            const reportPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.AUDIT_REPORT);
            logger.info(`Wrote: ${SPECS_FOLDER_STRUCTURE.AUDIT_REPORT}`);

            // 12. Update manifest with audit entry
            const auditEntry: AuditEntry = {
                date: meta.generated,
                repo_sha: repoSha,
                specs_version_compared: currentVersion,
                changes_detected: summary.total_changes,
                status: 'pending',
            };
            const updatedManifest = manager.addAuditEntry(manifest, auditEntry);
            await manager.writeManifest(specsPath, updatedManifest);
            logger.info('Updated manifest with pending audit');

            // 13. Build result
            const summaryText = this.buildSummaryText(summary, currentVersion, proposedVersion);

            const result: AuditReportResult = {
                report,
                reportPath,
                summary: summaryText,
            };

            return {
                success: true,
                data: {
                    ...result,
                    output: summaryText,
                    changesDetected: summary.total_changes,
                    proposedVersion,
                    promptVersion: { id: 'audit_report', version: '2', hash: 'native' } as PromptVersion,
                },
                message: summary.total_changes > 0 
                    ? `Audit detected ${summary.total_changes} changes. Run 'spec-zero apply' to update specs.`
                    : 'Audit complete: no changes detected.'
            };

        } catch (error: any) {
            logger.error(`AuditReport failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: `Failed to generate audit report: ${error.message}`
            };
        }
    }

    /**
     * Collect outputs from all analysis agents
     */
    private collectAgentOutputs(
        sharedContext: SharedContext | undefined,
        allResults: Record<string, any>
    ): Map<string, string> {
        const outputs = new Map<string, string>();

        if (sharedContext) {
            for (const agentId of sharedContext.getExecutedAgentIds()) {
                if (['bootstrap', 'submodule_check', 'summary', 'write_specs', 'audit_report', 'commit_push'].includes(agentId)) {
                    continue;
                }
                const fullContent = sharedContext.getFullContent(agentId);
                if (fullContent) {
                    outputs.set(agentId, fullContent);
                }
            }
        } else {
            for (const [agentId, result] of Object.entries(allResults)) {
                if (['bootstrap', 'submodule_check', 'summary', 'write_specs', 'audit_report', 'commit_push'].includes(agentId)) {
                    continue;
                }
                const content = typeof result === 'string' ? result : result?.output || result?.data?.output;
                if (content) {
                    outputs.set(agentId, content);
                }
            }
        }

        return outputs;
    }

    /**
     * Compare existing specs with fresh analysis
     */
    private compareSpecs(
        existingSpecs: Map<string, string>,
        freshAnalysis: Map<string, string>,
        logger: Logger
    ): FileChanges[] {
        const changes: FileChanges[] = [];

        // Build reverse map: filename -> agentId
        const filenameToAgent: Record<string, string> = {};
        for (const [agentId, filename] of Object.entries(AGENT_TO_FILE_MAP)) {
            filenameToAgent[filename] = agentId;
        }

        // Check each file
        const allFilenames = new Set([
            ...existingSpecs.keys(),
            ...Array.from(freshAnalysis.keys()).map(a => AGENT_TO_FILE_MAP[a]).filter(Boolean)
        ]);

        for (const filename of allFilenames) {
            const agentId = filenameToAgent[filename];
            if (!agentId) continue;

            const existingContent = existingSpecs.get(filename);
            const freshContent = freshAnalysis.get(agentId);

            const fileChange: FileChanges = {
                file: `_generated/${filename}`,
                added: [],
                removed: [],
                modified: [],
            };

            if (!existingContent && freshContent) {
                // New file
                fileChange.added.push({
                    item: filename,
                    description: 'New spec file detected',
                });
                logger.info(`New file: ${filename}`);
            } else if (existingContent && !freshContent) {
                // Removed file (agent didn't produce output)
                fileChange.removed.push({
                    item: filename,
                    description: 'Spec file no longer generated',
                });
                logger.info(`Removed file: ${filename}`);
            } else if (existingContent && freshContent) {
                // Compare content
                const itemChanges = this.compareContent(existingContent, freshContent, filename);
                fileChange.added.push(...itemChanges.added);
                fileChange.removed.push(...itemChanges.removed);
                fileChange.modified.push(...itemChanges.modified);
            }

            // Only add if there are changes
            if (fileChange.added.length > 0 || fileChange.removed.length > 0 || fileChange.modified.length > 0) {
                changes.push(fileChange);
            }
        }

        return changes;
    }

    /**
     * Compare content of two spec files
     * Uses section-based comparison for structured detection
     */
    private compareContent(
        existing: string,
        fresh: string,
        filename: string
    ): { added: ChangeItem[]; removed: ChangeItem[]; modified: ChangeItem[] } {
        const added: ChangeItem[] = [];
        const removed: ChangeItem[] = [];
        const modified: ChangeItem[] = [];

        // Extract sections from both
        const existingSections = this.extractSections(existing);
        const freshSections = this.extractSections(fresh);

        const allSectionNames = new Set([...existingSections.keys(), ...freshSections.keys()]);

        for (const sectionName of allSectionNames) {
            const existingSection = existingSections.get(sectionName);
            const freshSection = freshSections.get(sectionName);

            if (!existingSection && freshSection) {
                added.push({
                    item: sectionName,
                    description: 'New section detected',
                    new_value: freshSection.slice(0, 200),
                });
            } else if (existingSection && !freshSection) {
                removed.push({
                    item: sectionName,
                    description: 'Section no longer present',
                    previous_value: existingSection.slice(0, 200),
                });
            } else if (existingSection && freshSection) {
                // Compare section content
                const normalizedExisting = this.normalizeContent(existingSection);
                const normalizedFresh = this.normalizeContent(freshSection);
                
                if (normalizedExisting !== normalizedFresh) {
                    // Calculate a simple diff indicator
                    const lengthDiff = freshSection.length - existingSection.length;
                    const diffDescription = lengthDiff > 0 
                        ? `Content expanded by ~${Math.abs(lengthDiff)} chars`
                        : lengthDiff < 0 
                            ? `Content reduced by ~${Math.abs(lengthDiff)} chars`
                            : 'Content modified';

                    modified.push({
                        item: sectionName,
                        description: diffDescription,
                        previous_value: existingSection.slice(0, 100),
                        new_value: freshSection.slice(0, 100),
                    });
                }
            }
        }

        // If no section-level changes but content differs, add a general modification
        if (added.length === 0 && removed.length === 0 && modified.length === 0) {
            const normalizedExisting = this.normalizeContent(existing);
            const normalizedFresh = this.normalizeContent(fresh);
            
            if (normalizedExisting !== normalizedFresh) {
                modified.push({
                    item: 'content',
                    description: 'File content has changed',
                });
            }
        }

        return { added, removed, modified };
    }

    /**
     * Extract sections (H2 headers) from markdown
     */
    private extractSections(content: string): Map<string, string> {
        const sections = new Map<string, string>();
        
        // Remove frontmatter
        const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');
        
        // Split by H2 headers
        const parts = withoutFrontmatter.split(/(?=^## )/m);
        
        for (const part of parts) {
            const match = part.match(/^## (.+)$/m);
            if (match) {
                sections.set(match[1].trim(), part);
            }
        }
        
        return sections;
    }

    /**
     * Normalize content for comparison (remove timestamps, whitespace variations)
     */
    private normalizeContent(content: string): string {
        return content
            .replace(/\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/g, 'DATE') // Normalize dates
            .replace(/v\d+\.\d+\.\d+/g, 'VERSION') // Normalize versions
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
            .toLowerCase();
    }

    /**
     * Calculate summary statistics
     */
    private calculateSummary(changes: FileChanges[]): AuditSummary {
        let added = 0;
        let removed = 0;
        let modified = 0;

        for (const fileChange of changes) {
            added += fileChange.added.length;
            removed += fileChange.removed.length;
            modified += fileChange.modified.length;
        }

        return {
            total_changes: added + removed + modified,
            added,
            removed,
            modified,
            files_affected: changes.length,
        };
    }

    /**
     * Generate markdown content for audit report
     */
    private generateReportMarkdown(report: AuditReport, projectSlug: string): string {
        const { meta, summary, changes } = report;

        // Frontmatter
        const frontmatter: SpecOSFrontmatter = {
            uid: meta.uid,
            title: meta.title,
            status: 'draft',
            version: meta.current_specs_version,
            created: meta.generated.split('T')[0],
            prompt_version: 'audit_report@v2',
            tags: ['spec', 'audit'],
        };

        let content = generateFrontmatter(frontmatter);

        content += `
# Spec Audit Report

## Executive Summary

This audit detected **${summary.total_changes} changes** comparing the current codebase 
(commit \`${meta.repo_sha.substring(0, 8)}\`) against specs v${meta.current_specs_version}.

| Category | Count |
|----------|-------|
| New items detected | ${summary.added} |
| Removed items | ${summary.removed} |
| Modified items | ${summary.modified} |
| Files affected | ${summary.files_affected} |

## Action Required

To apply these changes, run:

\`\`\`bash
spec-zero apply ${projectSlug}
\`\`\`

## Version Change

- **Current version:** ${meta.current_specs_version}
- **Proposed version:** ${meta.proposed_version}

---

## Changes by File

`;

        if (changes.length === 0) {
            content += `*No changes detected.*\n`;
        } else {
            for (const fileChange of changes) {
                content += `### ${fileChange.file}\n\n`;

                if (fileChange.added.length > 0) {
                    content += `#### ADDED\n\n`;
                    content += `| Item | Description |\n|------|-------------|\n`;
                    for (const item of fileChange.added) {
                        content += `| ${item.item} | ${item.description} |\n`;
                    }
                    content += `\n`;
                }

                if (fileChange.removed.length > 0) {
                    content += `#### REMOVED\n\n`;
                    content += `| Item | Description |\n|------|-------------|\n`;
                    for (const item of fileChange.removed) {
                        content += `| ${item.item} | ${item.description} |\n`;
                    }
                    content += `\n`;
                }

                if (fileChange.modified.length > 0) {
                    content += `#### MODIFIED\n\n`;
                    content += `| Item | Description |\n|------|-------------|\n`;
                    for (const item of fileChange.modified) {
                        content += `| ${item.item} | ${item.description} |\n`;
                    }
                    content += `\n`;
                }
            }
        }

        content += `
---

## Metadata

- **Generated:** ${meta.generated}
- **Plugin Version:** ${meta.plugin_version}
- **Repo SHA:** ${meta.repo_sha}
- **Repo Branch:** ${meta.repo_branch}
`;

        return content;
    }

    /**
     * Build human-readable summary text
     */
    private buildSummaryText(
        summary: AuditSummary,
        currentVersion: string,
        proposedVersion: string
    ): string {
        if (summary.total_changes === 0) {
            return `## Audit Summary

**Result:** No changes detected.

Your specs v${currentVersion} are up to date with the current codebase.`;
        }

        return `## Audit Summary

**Changes Detected:** ${summary.total_changes}

| Category | Count |
|----------|-------|
| Added | ${summary.added} |
| Removed | ${summary.removed} |
| Modified | ${summary.modified} |
| Files Affected | ${summary.files_affected} |

**Version:** ${currentVersion} → ${proposedVersion}

### Next Steps

Review the changes in \`AUDIT_REPORT.md\` and run:

\`\`\`bash
spec-zero apply
\`\`\`

to update your specs.`;
    }
}
