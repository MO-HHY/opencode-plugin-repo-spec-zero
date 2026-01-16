/**
 * SubmoduleCheckAgent - Layer 0 Agent
 * 
 * First agent in the DAG, runs before bootstrap.
 * Responsibilities:
 * - Check if specs submodule exists
 * - Create submodule if needed (generation mode)
 * - Initialize existing submodule (audit mode)
 * - Detect operation mode (generation vs audit)
 * - Load existing specs for audit comparison
 * - Set context.mode for downstream agents
 */

import { SubAgent } from '../base.js';
import type { AgentContext, AgentResult, SubmoduleState, SpecsManifest, SpecZeroMode } from '../../types.js';
import type { SharedContext } from '../../core/context.js';
import { SubmoduleManager, type Logger } from '../../skills/submodule-manager.skill.js';
import { SPECS_FOLDER_STRUCTURE } from '../../types.js';
import * as path from 'path';

export interface SubmoduleCheckOptions {
    /** Skip submodule creation (error if not exists) */
    requireExisting?: boolean;
    /** GitHub owner for repo creation */
    githubOwner?: string;
    /** Create private specs repo */
    privateRepo?: boolean;
    /** Skip interactive prompts */
    nonInteractive?: boolean;
    /** Skip push operations */
    noPush?: boolean;
}

export interface SubmoduleCheckResult {
    /** Current submodule state */
    state: SubmoduleState;
    /** Whether submodule was created in this run */
    created: boolean;
    /** Whether submodule was initialized in this run */
    initialized: boolean;
    /** Human-readable summary */
    summary: string;
}

export class SubmoduleCheckAgent extends SubAgent {
    readonly id = 'submodule_check';
    readonly name = 'Submodule Check Agent';
    readonly description = 'Checks and initializes the specs Git submodule, detecting operation mode.';
    readonly systemPrompt = 'You are a submodule management agent that prepares the specs repository.';
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
        const baseDir = String(params.baseDir || process.cwd());
        const projectSlug = String(params.projectSlug || 'unknown-repo');
        const sharedContext = params.sharedContext as SharedContext | undefined;
        
        // Options from params
        const options: SubmoduleCheckOptions = {
            requireExisting: Boolean(params.requireExisting),
            githubOwner: params.githubOwner as string | undefined,
            privateRepo: params.privateRepo !== false, // Default true
            nonInteractive: Boolean(params.nonInteractive),
            noPush: Boolean(params.noPush),
        };

        // Plugin version
        const pluginVersion = String(params.pluginVersion || '2.0.0');
        const specsFolder = String(params.specsFolder || 'specs');

        // Create logger that integrates with the plugin
        const logger: Logger = {
            info: (msg) => console.log(`[SubmoduleCheck] ${msg}`),
            error: (msg) => console.error(`[SubmoduleCheck] ${msg}`),
            warn: (msg) => console.warn(`[SubmoduleCheck] ${msg}`),
            debug: (msg) => console.debug(`[SubmoduleCheck] ${msg}`),
        };

        const manager = this.getSubmoduleManager(logger);

        try {
            logger.info(`Checking specs submodule at ${baseDir}/${specsFolder}`);

            // 1. Get current submodule state
            let state = await manager.getSubmoduleState(baseDir, specsFolder);
            let created = false;
            let initialized = false;

            // 2. Handle missing submodule
            if (!state.exists) {
                if (options.requireExisting) {
                    return {
                        success: false,
                        error: 'Specs submodule does not exist and requireExisting is true',
                        message: 'Specs submodule not found. Run without --require-existing to create it.'
                    };
                }

                // Create new specs repo and submodule
                const result = await this.createSubmodule(
                    manager,
                    baseDir,
                    specsFolder,
                    projectSlug,
                    pluginVersion,
                    options,
                    logger
                );
                
                state = result.state;
                created = true;
                initialized = true;
            }
            // 3. Handle existing but not initialized submodule
            else if (!state.initialized) {
                logger.info('Submodule exists but not initialized, initializing...');
                await manager.initSubmodule(baseDir, specsFolder);
                
                // Re-fetch state
                state = await manager.getSubmoduleState(baseDir, specsFolder);
                initialized = true;
            }

            // 4. Ensure folder structure exists (idempotent)
            await manager.initializeFolderStructure(state.specsPath);

            // 5. Read manifest and determine mode
            const manifest = await manager.readManifest(state.specsPath);
            state.manifest = manifest;
            state.mode = manifest && manifest.analyses.length > 0 ? 'audit' : 'generation';

            // 6. If audit mode, load existing specs
            if (state.mode === 'audit') {
                state.existingSpecs = await manager.readExistingSpecs(state.specsPath);
                logger.info(`Audit mode: loaded ${state.existingSpecs.size} existing spec files`);
            }

            // 7. Get repo info for context
            const repoUrl = await manager.getRemoteUrl(baseDir);
            const repoSha = await manager.getCommitSha(baseDir);
            const repoBranch = await manager.getBranch(baseDir);

            // 8. Build summary
            const summary = this.buildSummary(state, created, initialized, repoSha);

            // 9. Store state in shared context if available
            if (sharedContext) {
                // Add submodule state to context
                sharedContext.addKeyFile('.spec-zero/submodule-state', JSON.stringify({
                    mode: state.mode,
                    specsPath: state.specsPath,
                    currentVersion: manifest?.current_version || '0.0.0',
                    pendingAudit: manifest?.pending_audit || false,
                    existingSpecCount: state.existingSpecs?.size || 0,
                    repoSha,
                    repoBranch,
                }, null, 2), 10000);

                // If audit mode, add existing specs as context
                if (state.existingSpecs) {
                    for (const [filename, content] of state.existingSpecs) {
                        sharedContext.addKeyFile(
                            `.spec-zero/existing/${filename}`,
                            content,
                            15000 // Larger limit for spec files
                        );
                    }
                }
            }

            // 10. Return result
            const result: SubmoduleCheckResult = {
                state,
                created,
                initialized,
                summary,
            };

            return {
                success: true,
                data: {
                    ...result,
                    output: summary,
                    mode: state.mode,
                    specsPath: state.specsPath,
                    currentVersion: manifest?.current_version || '0.0.0',
                    existingSpecCount: state.existingSpecs?.size || 0,
                    repoSha,
                    repoBranch,
                    repoUrl,
                    promptVersion: { id: 'core/submodule-check', version: '2', hash: 'native' },
                },
                message: `Submodule check complete: ${state.mode} mode`
            };

        } catch (error: any) {
            logger.error(`Submodule check failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: `Failed to check/initialize specs submodule: ${error.message}`
            };
        }
    }

    /**
     * Create new specs repo and add as submodule
     */
    private async createSubmodule(
        manager: SubmoduleManager,
        baseDir: string,
        specsFolder: string,
        projectSlug: string,
        pluginVersion: string,
        options: SubmoduleCheckOptions,
        logger: Logger
    ): Promise<{ state: SubmoduleState }> {
        // 1. Determine GitHub owner
        const repoUrl = await manager.getRemoteUrl(baseDir);
        let githubOwner = options.githubOwner;
        
        if (!githubOwner) {
            githubOwner = manager.extractGithubOwner(repoUrl);
        }
        
        if (!githubOwner) {
            throw new Error('Could not determine GitHub owner. Please provide --github-owner option.');
        }

        // 2. Check gh CLI availability
        const hasGhCli = await manager.checkGhCli();
        if (!hasGhCli) {
            throw new Error('GitHub CLI (gh) is required to create specs repository. Install it with: brew install gh');
        }

        // 3. Create specs repo on GitHub
        logger.info(`Creating specs repository: ${githubOwner}/${projectSlug}-specs`);
        const specsRepoUrl = await manager.createSpecsRepo(
            projectSlug,
            githubOwner,
            options.privateRepo
        );

        // 4. Add as submodule
        logger.info(`Adding submodule at ${specsFolder}`);
        await manager.addSubmodule(baseDir, specsRepoUrl, specsFolder);

        // 5. Initialize folder structure
        const specsPath = path.join(baseDir, specsFolder);
        await manager.initializeFolderStructure(specsPath);

        // 6. Create initial manifest
        const manifest = manager.createInitialManifest(
            projectSlug,
            repoUrl,
            specsRepoUrl,
            pluginVersion
        );
        await manager.writeManifest(specsPath, manifest);

        // 7. Create initial config
        await manager.writeConfig(specsPath, {
            schema_version: '2.0',
            github_owner: githubOwner,
            specs_repo_private: options.privateRepo ?? true,
            auto_push: !options.noPush,
            non_interactive: options.nonInteractive ?? false,
            specs_folder: specsFolder,
        });

        // 8. Get state
        const state = await manager.getSubmoduleState(baseDir, specsFolder);
        state.manifest = manifest;
        state.mode = 'generation';

        return { state };
    }

    /**
     * Build human-readable summary
     */
    private buildSummary(
        state: SubmoduleState,
        created: boolean,
        initialized: boolean,
        repoSha: string
    ): string {
        const lines: string[] = [
            '## Submodule Check Summary',
            '',
            `**Mode:** ${state.mode.toUpperCase()}`,
            `**Specs Path:** ${state.specsPath}`,
        ];

        if (created) {
            lines.push(`**Action:** Created new specs submodule`);
        } else if (initialized) {
            lines.push(`**Action:** Initialized existing submodule`);
        } else {
            lines.push(`**Action:** Using existing submodule`);
        }

        if (state.manifest) {
            lines.push(`**Current Version:** ${state.manifest.current_version}`);
            lines.push(`**Analysis Count:** ${state.manifest.analyses.length}`);
            lines.push(`**Pending Audit:** ${state.manifest.pending_audit ? 'Yes' : 'No'}`);
        }

        if (state.existingSpecs) {
            lines.push(`**Existing Specs:** ${state.existingSpecs.size} files`);
        }

        lines.push(`**Source Repo SHA:** ${repoSha.substring(0, 8)}`);

        if (state.mode === 'generation') {
            lines.push('');
            lines.push('### Next Steps');
            lines.push('- Running full analysis DAG');
            lines.push('- Will write specs to _generated/ folder');
            lines.push('- Will create v1.0.0');
        } else {
            lines.push('');
            lines.push('### Next Steps');
            lines.push('- Running analysis DAG');
            lines.push('- Will compare with existing specs');
            lines.push('- Will generate AUDIT_REPORT.md (no modifications to existing specs)');
        }

        return lines.join('\n');
    }
}
