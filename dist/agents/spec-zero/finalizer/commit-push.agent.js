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
import { SubmoduleManager } from '../../../skills/submodule-manager.skill.js';
import * as path from 'path';
export class CommitPushAgent extends SubAgent {
    id = 'commit_push';
    name = 'Commit Push Agent';
    description = 'Commits and pushes changes to the specs submodule and parent repo.';
    systemPrompt = 'You are the commit-push agent for specs management.';
    triggers = [];
    submoduleManager = null;
    /**
     * Get or create SubmoduleManager instance
     */
    getSubmoduleManager(logger, noPush) {
        if (!this.submoduleManager) {
            this.submoduleManager = new SubmoduleManager(logger, { noPush });
        }
        return this.submoduleManager;
    }
    async process(context) {
        const params = context.params || {};
        const projectSlug = String(params.projectSlug || 'unknown-repo');
        const baseDir = String(params.baseDir || process.cwd());
        const specsFolder = String(params.specsFolder || 'specs');
        // Determine commit type
        const mode = params.mode;
        const isApply = Boolean(params.isApply);
        const commitType = isApply ? 'apply' : (mode === 'audit' ? 'audit' : 'generation');
        // Version info (for commit messages)
        const newVersion = String(params.newVersion || params.version || '1.0.0');
        const changesDetected = params.changesDetected;
        // Options
        const noPush = Boolean(params.noPush);
        const skipParentCommit = Boolean(params.skipParentCommit);
        // Logger
        const logger = {
            info: (msg) => console.log(`[CommitPush] ${msg}`),
            error: (msg) => console.error(`[CommitPush] ${msg}`),
            warn: (msg) => console.warn(`[CommitPush] ${msg}`),
        };
        const manager = this.getSubmoduleManager(logger, noPush);
        const specsPath = path.join(baseDir, specsFolder);
        try {
            logger.info(`Committing changes (${commitType} mode)`);
            // 1. Check for uncommitted changes in submodule
            const hasChanges = await manager.hasUncommittedChanges(specsPath);
            if (!hasChanges) {
                logger.info('No changes to commit');
                return {
                    success: true,
                    data: {
                        skipped: true,
                        output: 'No changes to commit',
                        promptVersion: { id: 'commit_push', version: '2', hash: 'native' },
                    },
                    message: 'No changes to commit'
                };
            }
            // 2. Build commit messages based on type
            const { submoduleMessage, parentMessage } = this.buildCommitMessages(commitType, projectSlug, newVersion, changesDetected);
            // 3. Stage all changes in submodule
            await manager.stageAll(specsPath);
            // 4. Commit in submodule
            const submoduleSha = await manager.commit(specsPath, submoduleMessage);
            logger.info(`Committed in submodule: ${submoduleSha.substring(0, 8)}`);
            // 5. Push submodule (if not disabled)
            if (!noPush) {
                const branch = await manager.getBranch(specsPath);
                await manager.push(specsPath, branch);
                logger.info('Pushed submodule');
            }
            // 6. Update parent repository reference
            let parentSha;
            if (!skipParentCommit) {
                try {
                    // Stage submodule reference change in parent
                    await this.stageSubmoduleInParent(baseDir, specsFolder);
                    // Check if there are changes to commit in parent
                    const parentHasChanges = await manager.hasUncommittedChanges(baseDir);
                    if (parentHasChanges) {
                        parentSha = await manager.commit(baseDir, parentMessage);
                        logger.info(`Committed in parent: ${parentSha.substring(0, 8)}`);
                        // Push parent
                        if (!noPush) {
                            const parentBranch = await manager.getBranch(baseDir);
                            await manager.push(baseDir, parentBranch);
                            logger.info('Pushed parent');
                        }
                    }
                }
                catch (error) {
                    logger.info(`Parent commit skipped (may not be a git repo): ${error.message}`);
                }
            }
            // 7. Build result
            const result = {
                submoduleSha,
                parentSha,
                message: submoduleMessage,
                pushed: !noPush,
                summary: this.buildSummary(commitType, submoduleSha, parentSha, newVersion, noPush),
            };
            return {
                success: true,
                data: {
                    ...result,
                    output: result.summary,
                    promptVersion: { id: 'commit_push', version: '2', hash: 'native' },
                },
                message: `Committed and ${noPush ? 'skipped push' : 'pushed'} successfully`
            };
        }
        catch (error) {
            logger.error(`CommitPush failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: `Failed to commit/push: ${error.message}`
            };
        }
    }
    /**
     * Build commit messages based on operation type
     */
    buildCommitMessages(commitType, projectSlug, version, changesDetected) {
        switch (commitType) {
            case 'generation':
                return {
                    submoduleMessage: `specs: v${version} - Initial generation`,
                    parentMessage: `chore: add ${projectSlug}-specs submodule (v${version})`,
                };
            case 'audit':
                return {
                    submoduleMessage: `audit: detected ${changesDetected || 'N'} changes vs v${version}`,
                    parentMessage: `chore: update specs submodule (audit report)`,
                };
            case 'apply':
                return {
                    submoduleMessage: `specs: v${version} - Applied audit changes`,
                    parentMessage: `chore: update specs submodule to v${version}`,
                };
            default:
                return {
                    submoduleMessage: `specs: update`,
                    parentMessage: `chore: update specs submodule`,
                };
        }
    }
    /**
     * Stage submodule reference in parent
     */
    async stageSubmoduleInParent(parentPath, specsFolder) {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        await execAsync(`git add ${specsFolder}`, { cwd: parentPath });
    }
    /**
     * Build human-readable summary
     */
    buildSummary(commitType, submoduleSha, parentSha, version, noPush) {
        const typeLabel = {
            'generation': 'Initial Generation',
            'audit': 'Audit Report',
            'apply': 'Apply Changes',
        }[commitType];
        let summary = `## Commit & Push Summary

**Operation:** ${typeLabel}
**Version:** ${version}

### Commits

| Repository | SHA | Status |
|------------|-----|--------|
| Specs Submodule | \`${submoduleSha.substring(0, 8)}\` | Committed |
`;
        if (parentSha) {
            summary += `| Parent Repository | \`${parentSha.substring(0, 8)}\` | Committed |\n`;
        }
        summary += `
### Push Status

`;
        if (noPush) {
            summary += `Push was **skipped** (--no-push option).

To push manually:
\`\`\`bash
cd specs && git push origin main
cd .. && git push origin main
\`\`\``;
        }
        else {
            summary += `Changes have been **pushed** to remote.`;
        }
        return summary;
    }
}
//# sourceMappingURL=commit-push.agent.js.map