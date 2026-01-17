/**
 * SubmoduleManager Skill
 *
 * Handles all Git submodule operations for the specs repository.
 * Core skill for v2.0.0 submodule-based spec management.
 *
 * Responsibilities:
 * - Check if submodule exists
 * - Create and initialize submodule
 * - Read/write manifest and config
 * - Read existing specs for audit comparison
 * - Archive audit reports
 * - Commit and push operations
 */
import { SubmoduleConfig, SubmoduleState, SpecsManifest, PluginConfig, AnalysisEntry, AuditEntry, SemVer, VersionBumpType } from '../types.js';
export interface Logger {
    info: (msg: string) => void;
    error: (msg: string) => void;
    warn?: (msg: string) => void;
    debug?: (msg: string) => void;
}
export interface SubmoduleManagerOptions {
    /** Skip interactive prompts */
    nonInteractive?: boolean;
    /** Skip push operations */
    noPush?: boolean;
    /** GitHub CLI available */
    hasGhCli?: boolean;
}
export declare class SubmoduleManager {
    private logger;
    private options;
    private validator;
    constructor(logger: Logger, options?: SubmoduleManagerOptions);
    /**
     * Get the current state of the specs submodule
     */
    getSubmoduleState(repoPath: string, specsFolder?: string): Promise<SubmoduleState>;
    /**
     * Detect operation mode from manifest state
     */
    private detectMode;
    /**
     * Check if submodule exists in .gitmodules
     */
    submoduleExists(repoPath: string, specsFolder: string): Promise<boolean>;
    /**
     * Check if submodule is initialized and checked out
     */
    isSubmoduleInitialized(repoPath: string, specsFolder: string): Promise<boolean>;
    /**
     * Get submodule configuration from .gitmodules
     */
    getSubmoduleConfig(repoPath: string, specsFolder: string): Promise<SubmoduleConfig | undefined>;
    /**
     * Create a new specs repository on GitHub
     * Requires `gh` CLI to be installed and authenticated
     */
    createSpecsRepo(projectName: string, githubOwner: string, isPrivate?: boolean): Promise<string>;
    /**
     * Add submodule to parent repository
     */
    addSubmodule(repoPath: string, remoteUrl: string, specsFolder?: string, branch?: string): Promise<void>;
    /**
     * Initialize submodule if not already initialized
     */
    initSubmodule(repoPath: string, specsFolder?: string): Promise<void>;
    /**
     * Initialize the folder structure within specs submodule
     */
    initializeFolderStructure(specsPath: string): Promise<void>;
    /**
     * v2.1.0: Initialize hierarchical folder structure in _generated/
     * Creates all subdirectories defined in GENERATED_SUBDIRS
     */
    initializeGeneratedStructure(specsPath: string, repoType?: string): Promise<void>;
    /**
     * Read manifest from specs folder
     */
    readManifest(specsPath: string): Promise<SpecsManifest | undefined>;
    /**
     * Write manifest to specs folder
     */
    writeManifest(specsPath: string, manifest: SpecsManifest): Promise<void>;
    /**
     * Create initial manifest for new specs repo
     */
    createInitialManifest(projectName: string, repoUrl: string, specsRepoUrl: string, pluginVersion: string): SpecsManifest;
    /**
     * Add an analysis entry to manifest
     */
    addAnalysisEntry(manifest: SpecsManifest, entry: AnalysisEntry): SpecsManifest;
    /**
     * Add an audit entry to manifest
     */
    addAuditEntry(manifest: SpecsManifest, entry: AuditEntry): SpecsManifest;
    /**
     * Update audit entry status
     */
    updateAuditStatus(manifest: SpecsManifest, auditDate: string, status: 'applied' | 'dismissed', appliedAsVersion?: string, archivedTo?: string): SpecsManifest;
    /**
     * Read plugin config from specs folder
     */
    readConfig(specsPath: string): Promise<PluginConfig>;
    /**
     * Write plugin config to specs folder
     */
    writeConfig(specsPath: string, config: PluginConfig): Promise<void>;
    /**
     * Read all existing specs from _generated folder
     * Returns a Map of filename -> content
     */
    readExistingSpecs(specsPath: string): Promise<Map<string, string>>;
    /**
     * Write a spec file to the _generated directory
     * v2.1.0: Supports hierarchical paths with auto-creation of subdirectories
     */
    writeSpec(specsPath: string, relativePath: string, content: string): Promise<void>;
    /**
     * Write index.md to specs root
     */
    writeIndex(specsPath: string, content: string): Promise<void>;
    /**
     * Read index.md from specs root
     */
    readIndex(specsPath: string): Promise<string | undefined>;
    /**
     * Check if there's a pending audit report
     */
    hasPendingAudit(specsPath: string): Promise<boolean>;
    /**
     * Write audit report
     */
    writeAuditReport(specsPath: string, content: string): Promise<void>;
    /**
     * Read audit report
     */
    readAuditReport(specsPath: string): Promise<string | undefined>;
    /**
     * Archive current audit report to _audits folder
     * Returns the archived file path (relative to specs)
     */
    archiveAuditReport(specsPath: string, version: string): Promise<string>;
    /**
     * Get current commit SHA
     */
    getCommitSha(repoPath: string): Promise<string>;
    /**
     * Get current branch name
     */
    getBranch(repoPath: string): Promise<string>;
    /**
     * Get remote URL for origin
     */
    getRemoteUrl(repoPath: string): Promise<string>;
    /**
     * Stage all changes in a directory
     */
    stageAll(repoPath: string): Promise<void>;
    /**
     * Commit changes
     */
    commit(repoPath: string, message: string): Promise<string>;
    /**
     * Push to remote
     */
    push(repoPath: string, branch?: string): Promise<void>;
    /**
     * Check if there are uncommitted changes
     */
    hasUncommittedChanges(repoPath: string): Promise<boolean>;
    /**
     * Commit in submodule and update parent reference
     */
    commitSubmoduleAndUpdateParent(parentRepoPath: string, specsFolder: string, submoduleMessage: string, parentMessage: string): Promise<{
        submoduleSha: string;
        parentSha: string;
    }>;
    /**
     * Parse SemVer string
     */
    parseSemVer(version: string): SemVer;
    /**
     * Format SemVer to string
     */
    formatSemVer(version: SemVer): string;
    /**
     * Calculate next version based on changes
     */
    calculateNextVersion(currentVersion: string, bumpType: VersionBumpType): string;
    /**
     * Determine bump type based on changes
     */
    determineBumpType(added: number, removed: number, modified: number): VersionBumpType;
    /**
     * Check if gh CLI is available
     */
    checkGhCli(): Promise<boolean>;
    /**
     * Extract project name from repo URL or path
     */
    extractProjectName(repoPathOrUrl: string): string;
    /**
     * Extract GitHub owner from repo URL
     */
    extractGithubOwner(repoUrl: string): string | undefined;
}
//# sourceMappingURL=submodule-manager.skill.d.ts.map