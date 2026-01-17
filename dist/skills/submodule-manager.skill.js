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
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { migrateManifest, needsMigration } from '../core/manifest-migrator.js';
import { ManifestValidator } from '../core/manifest-validator.js';
import { DEFAULT_PLUGIN_CONFIG, SPECS_FOLDER_STRUCTURE, GENERATED_SUBDIRS, } from '../types.js';
const execAsync = promisify(exec);
export class SubmoduleManager {
    logger;
    options;
    validator;
    constructor(logger, options = {}) {
        this.logger = logger;
        this.options = {
            nonInteractive: false,
            noPush: false,
            hasGhCli: false,
            ...options,
        };
        this.validator = new ManifestValidator();
    }
    // =========================================================================
    // STATE DETECTION
    // =========================================================================
    /**
     * Get the current state of the specs submodule
     */
    async getSubmoduleState(repoPath, specsFolder = 'specs') {
        const specsPath = path.join(repoPath, specsFolder);
        // Check if submodule entry exists in .gitmodules
        const exists = await this.submoduleExists(repoPath, specsFolder);
        if (!exists) {
            return {
                exists: false,
                initialized: false,
                specsPath,
                mode: 'generation',
            };
        }
        // Check if submodule is initialized
        const initialized = await this.isSubmoduleInitialized(repoPath, specsFolder);
        if (!initialized) {
            return {
                exists: true,
                initialized: false,
                specsPath,
                mode: 'generation',
            };
        }
        // Read submodule config
        const config = await this.getSubmoduleConfig(repoPath, specsFolder);
        // Try to read manifest
        const manifestPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.MANIFEST);
        const manifest = await this.readManifest(specsPath);
        // Detect mode based on manifest
        const mode = this.detectMode(manifest);
        // If audit mode, load existing specs
        let existingSpecs;
        if (mode === 'audit') {
            existingSpecs = await this.readExistingSpecs(specsPath);
        }
        return {
            exists: true,
            initialized: true,
            config,
            manifest,
            specsPath,
            mode,
            existingSpecs,
        };
    }
    /**
     * Detect operation mode from manifest state
     */
    detectMode(manifest) {
        if (!manifest) {
            return 'generation';
        }
        if (manifest.analyses.length === 0) {
            return 'generation';
        }
        return 'audit';
    }
    /**
     * Check if submodule exists in .gitmodules
     */
    async submoduleExists(repoPath, specsFolder) {
        const gitmodulesPath = path.join(repoPath, '.gitmodules');
        if (!fs.existsSync(gitmodulesPath)) {
            return false;
        }
        try {
            const { stdout } = await execAsync(`git config --file .gitmodules --get-regexp path`, { cwd: repoPath });
            return stdout.includes(specsFolder);
        }
        catch {
            return false;
        }
    }
    /**
     * Check if submodule is initialized and checked out
     */
    async isSubmoduleInitialized(repoPath, specsFolder) {
        const specsPath = path.join(repoPath, specsFolder);
        const gitPath = path.join(specsPath, '.git');
        // Either .git file (submodule link) or .git directory exists
        return fs.existsSync(gitPath);
    }
    /**
     * Get submodule configuration from .gitmodules
     */
    async getSubmoduleConfig(repoPath, specsFolder) {
        try {
            const { stdout: urlOutput } = await execAsync(`git config --file .gitmodules --get submodule.${specsFolder}.url`, { cwd: repoPath });
            const { stdout: branchOutput } = await execAsync(`git config --file .gitmodules --get submodule.${specsFolder}.branch || echo "main"`, { cwd: repoPath });
            return {
                path: specsFolder,
                remoteUrl: urlOutput.trim(),
                branch: branchOutput.trim() || 'main',
            };
        }
        catch {
            return undefined;
        }
    }
    // =========================================================================
    // SUBMODULE CREATION
    // =========================================================================
    /**
     * Create a new specs repository on GitHub
     * Requires `gh` CLI to be installed and authenticated
     */
    async createSpecsRepo(projectName, githubOwner, isPrivate = true) {
        const repoName = `${projectName}-specs`;
        const visibility = isPrivate ? '--private' : '--public';
        this.logger.info(`Creating GitHub repository: ${githubOwner}/${repoName}`);
        try {
            const { stdout } = await execAsync(`gh repo create ${githubOwner}/${repoName} ${visibility} --description "Specifications for ${projectName}" --clone=false`);
            this.logger.info(`Created repository: ${githubOwner}/${repoName}`);
            return `git@github.com:${githubOwner}/${repoName}.git`;
        }
        catch (error) {
            // Check if repo already exists
            if (error.message?.includes('already exists')) {
                this.logger.info(`Repository already exists: ${githubOwner}/${repoName}`);
                return `git@github.com:${githubOwner}/${repoName}.git`;
            }
            throw new Error(`Failed to create specs repository: ${error.message}`);
        }
    }
    /**
     * Add submodule to parent repository
     */
    async addSubmodule(repoPath, remoteUrl, specsFolder = 'specs', branch = 'main') {
        this.logger.info(`Adding submodule at ${specsFolder}`);
        try {
            await execAsync(`git submodule add -b ${branch} ${remoteUrl} ${specsFolder}`, { cwd: repoPath });
            this.logger.info('Submodule added successfully');
        }
        catch (error) {
            throw new Error(`Failed to add submodule: ${error.message}`);
        }
    }
    /**
     * Initialize submodule if not already initialized
     */
    async initSubmodule(repoPath, specsFolder = 'specs') {
        this.logger.info(`Initializing submodule at ${specsFolder}`);
        try {
            await execAsync(`git submodule update --init --recursive ${specsFolder}`, { cwd: repoPath });
            this.logger.info('Submodule initialized successfully');
        }
        catch (error) {
            throw new Error(`Failed to initialize submodule: ${error.message}`);
        }
    }
    /**
     * Initialize the folder structure within specs submodule
     */
    async initializeFolderStructure(specsPath) {
        this.logger.info('Initializing specs folder structure');
        // Create directories
        const dirs = [
            SPECS_FOLDER_STRUCTURE.META,
            SPECS_FOLDER_STRUCTURE.GENERATED,
            SPECS_FOLDER_STRUCTURE.AUDITS,
            SPECS_FOLDER_STRUCTURE.DOMAINS,
        ];
        for (const dir of dirs) {
            const fullPath = path.join(specsPath, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        }
        // Create .gitkeep in domains (manual folder)
        const gitkeepPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.DOMAINS, '.gitkeep');
        if (!fs.existsSync(gitkeepPath)) {
            fs.writeFileSync(gitkeepPath, '');
        }
        this.logger.info('Folder structure created');
    }
    /**
     * v2.1.0: Initialize hierarchical folder structure in _generated/
     * Creates all subdirectories defined in GENERATED_SUBDIRS
     */
    async initializeGeneratedStructure(specsPath, repoType) {
        // Import at top of file: import { GENERATED_SUBDIRS } from '../types.js';
        const generatedPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.GENERATED);
        // Ensure _generated exists
        if (!fs.existsSync(generatedPath)) {
            fs.mkdirSync(generatedPath, { recursive: true });
        }
        // Create all standard subdirectories
        for (const subdir of Object.values(GENERATED_SUBDIRS)) {
            const subdirPath = path.join(generatedPath, subdir);
            if (!fs.existsSync(subdirPath)) {
                fs.mkdirSync(subdirPath, { recursive: true });
                // Create .gitkeep to preserve empty directories in git
                fs.writeFileSync(path.join(subdirPath, '.gitkeep'), '');
                this.logger.info?.(`Created subdirectory: ${subdir}/`);
            }
        }
        // Create dynamic substructure for modules based on repoType
        if (repoType === 'fullstack' || repoType === 'monorepo') {
            const modulesPath = path.join(generatedPath, GENERATED_SUBDIRS.MODULES);
            for (const sub of ['backend', 'frontend']) {
                const subPath = path.join(modulesPath, sub);
                if (!fs.existsSync(subPath)) {
                    fs.mkdirSync(subPath, { recursive: true });
                    fs.writeFileSync(path.join(subPath, '.gitkeep'), '');
                    this.logger.info?.(`Created module subdirectory: ${GENERATED_SUBDIRS.MODULES}/${sub}/`);
                }
            }
        }
        this.logger.info?.('Generated folder structure initialized');
    }
    // =========================================================================
    // MANIFEST OPERATIONS
    // =========================================================================
    /**
     * Read manifest from specs folder
     */
    async readManifest(specsPath) {
        const manifestPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.MANIFEST);
        if (!fs.existsSync(manifestPath)) {
            return undefined;
        }
        try {
            const content = fs.readFileSync(manifestPath, 'utf-8');
            let manifest = JSON.parse(content);
            // v2.1.0: Validate and repair if needed
            const validation = this.validator.validate(manifest);
            if (!validation.valid) {
                this.logger.warn?.(`Manifest validation errors: ${validation.errors.join(', ')}`);
                this.logger.info?.('Attempting to repair manifest...');
                manifest = this.validator.repairManifest(manifest);
            }
            // v2.1.0: Auto-migrate if needed
            if (needsMigration(manifest)) {
                this.logger.info?.('Migrating manifest from v2.0 to v2.1...');
                manifest = migrateManifest(manifest);
                // Persist migrated manifest
                await this.writeManifest(specsPath, manifest);
                this.logger.info?.('Manifest migrated successfully');
            }
            // v2.1.0: Validate file locations for v2.1 manifests
            if (manifest.schema_version === '2.1') {
                const fileValidation = this.validator.validateFileLocations(manifest, specsPath);
                if (!fileValidation.valid) {
                    this.logger.warn?.(`Manifest file location errors: ${fileValidation.errors.join(', ')}`);
                }
            }
            return manifest;
        }
        catch (error) {
            this.logger.error?.(`Failed to read manifest: ${error.message}`);
            return undefined;
        }
    }
    /**
     * Write manifest to specs folder
     */
    async writeManifest(specsPath, manifest) {
        const manifestPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.MANIFEST);
        // v2.1.0: Validate before writing
        const validation = this.validator.validate(manifest);
        if (!validation.valid) {
            this.logger.warn?.(`Writing manifest with errors: ${validation.errors.join(', ')}`);
            // We still write it but we warn. In some cases we might want to block it, 
            // but for now let's be permissive but loud.
        }
        // Ensure .meta directory exists
        const metaDir = path.join(specsPath, SPECS_FOLDER_STRUCTURE.META);
        if (!fs.existsSync(metaDir)) {
            fs.mkdirSync(metaDir, { recursive: true });
        }
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        this.logger.info('Manifest written successfully');
    }
    /**
     * Create initial manifest for new specs repo
     */
    createInitialManifest(projectName, repoUrl, specsRepoUrl, pluginVersion) {
        return {
            schema_version: '2.0',
            project: {
                name: projectName,
                repo_url: repoUrl,
                specs_repo_url: specsRepoUrl,
                created: new Date().toISOString(),
            },
            current_version: '0.0.0', // Will be 1.0.0 after first generation
            mode: 'generation',
            pending_audit: false,
            analyses: [],
            audits: [],
        };
    }
    /**
     * Add an analysis entry to manifest
     */
    addAnalysisEntry(manifest, entry) {
        return {
            ...manifest,
            current_version: entry.version,
            mode: 'audit', // After first analysis, mode becomes audit
            analyses: [...manifest.analyses, entry],
        };
    }
    /**
     * Add an audit entry to manifest
     */
    addAuditEntry(manifest, entry) {
        return {
            ...manifest,
            pending_audit: entry.status === 'pending',
            audits: [...manifest.audits, entry],
        };
    }
    /**
     * Update audit entry status
     */
    updateAuditStatus(manifest, auditDate, status, appliedAsVersion, archivedTo) {
        const updatedAudits = manifest.audits.map(audit => {
            if (audit.date === auditDate) {
                return {
                    ...audit,
                    status,
                    applied_as_version: appliedAsVersion,
                    archived_to: archivedTo,
                };
            }
            return audit;
        });
        return {
            ...manifest,
            pending_audit: false,
            audits: updatedAudits,
        };
    }
    // =========================================================================
    // CONFIG OPERATIONS
    // =========================================================================
    /**
     * Read plugin config from specs folder
     */
    async readConfig(specsPath) {
        const configPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.CONFIG);
        if (!fs.existsSync(configPath)) {
            return { ...DEFAULT_PLUGIN_CONFIG };
        }
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            const parsed = JSON.parse(content);
            return { ...DEFAULT_PLUGIN_CONFIG, ...parsed };
        }
        catch (error) {
            this.logger.error(`Failed to read config: ${error}`);
            return { ...DEFAULT_PLUGIN_CONFIG };
        }
    }
    /**
     * Write plugin config to specs folder
     */
    async writeConfig(specsPath, config) {
        const configPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.CONFIG);
        // Ensure .meta directory exists
        const metaDir = path.join(specsPath, SPECS_FOLDER_STRUCTURE.META);
        if (!fs.existsSync(metaDir)) {
            fs.mkdirSync(metaDir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        this.logger.info('Config written successfully');
    }
    // =========================================================================
    // SPECS FILE OPERATIONS
    // =========================================================================
    /**
     * Read all existing specs from _generated folder
     * Returns a Map of filename -> content
     */
    async readExistingSpecs(specsPath) {
        const generatedPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.GENERATED);
        const specs = new Map();
        if (!fs.existsSync(generatedPath)) {
            return specs;
        }
        const files = fs.readdirSync(generatedPath);
        for (const file of files) {
            if (file.endsWith('.md')) {
                const filePath = path.join(generatedPath, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                specs.set(file, content);
            }
        }
        this.logger.info(`Loaded ${specs.size} existing spec files`);
        return specs;
    }
    /**
     * Write a spec file to the _generated directory
     * v2.1.0: Supports hierarchical paths with auto-creation of subdirectories
     */
    async writeSpec(specsPath, relativePath, content) {
        const generatedPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.GENERATED);
        const fullPath = path.join(generatedPath, relativePath);
        // v2.1.0: Create parent directory if it doesn't exist
        const dirPath = path.dirname(fullPath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(fullPath, content, 'utf-8');
        this.logger.info(`Wrote spec: ${relativePath}`);
    }
    /**
     * Write index.md to specs root
     */
    async writeIndex(specsPath, content) {
        const indexPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.INDEX);
        fs.writeFileSync(indexPath, content);
    }
    /**
     * Read index.md from specs root
     */
    async readIndex(specsPath) {
        const indexPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.INDEX);
        if (!fs.existsSync(indexPath)) {
            return undefined;
        }
        return fs.readFileSync(indexPath, 'utf-8');
    }
    // =========================================================================
    // AUDIT OPERATIONS
    // =========================================================================
    /**
     * Check if there's a pending audit report
     */
    async hasPendingAudit(specsPath) {
        const auditPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.AUDIT_REPORT);
        return fs.existsSync(auditPath);
    }
    /**
     * Write audit report
     */
    async writeAuditReport(specsPath, content) {
        const auditPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.AUDIT_REPORT);
        fs.writeFileSync(auditPath, content);
        this.logger.info('Audit report written');
    }
    /**
     * Read audit report
     */
    async readAuditReport(specsPath) {
        const auditPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.AUDIT_REPORT);
        if (!fs.existsSync(auditPath)) {
            return undefined;
        }
        return fs.readFileSync(auditPath, 'utf-8');
    }
    /**
     * Archive current audit report to _audits folder
     * Returns the archived file path (relative to specs)
     */
    async archiveAuditReport(specsPath, version) {
        const auditPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.AUDIT_REPORT);
        if (!fs.existsSync(auditPath)) {
            throw new Error('No audit report to archive');
        }
        // Create archive filename with date and version
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const archiveFilename = `${date}_v${version}_audit.md`;
        const archivePath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.AUDITS, archiveFilename);
        // Ensure _audits directory exists
        const auditsDir = path.join(specsPath, SPECS_FOLDER_STRUCTURE.AUDITS);
        if (!fs.existsSync(auditsDir)) {
            fs.mkdirSync(auditsDir, { recursive: true });
        }
        // Move the file
        const content = fs.readFileSync(auditPath, 'utf-8');
        fs.writeFileSync(archivePath, content);
        fs.unlinkSync(auditPath);
        this.logger.info(`Archived audit report to ${archiveFilename}`);
        return path.join(SPECS_FOLDER_STRUCTURE.AUDITS, archiveFilename);
    }
    // =========================================================================
    // GIT OPERATIONS
    // =========================================================================
    /**
     * Get current commit SHA
     */
    async getCommitSha(repoPath) {
        try {
            const { stdout } = await execAsync('git rev-parse HEAD', { cwd: repoPath });
            return stdout.trim();
        }
        catch {
            return 'unknown';
        }
    }
    /**
     * Get current branch name
     */
    async getBranch(repoPath) {
        try {
            const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath });
            return stdout.trim();
        }
        catch {
            return 'main';
        }
    }
    /**
     * Get remote URL for origin
     */
    async getRemoteUrl(repoPath) {
        try {
            const { stdout } = await execAsync('git remote get-url origin', { cwd: repoPath });
            return stdout.trim();
        }
        catch {
            return '';
        }
    }
    /**
     * Stage all changes in a directory
     */
    async stageAll(repoPath) {
        await execAsync('git add -A', { cwd: repoPath });
    }
    /**
     * Commit changes
     */
    async commit(repoPath, message) {
        try {
            await execAsync(`git commit -m "${message}"`, { cwd: repoPath });
            return await this.getCommitSha(repoPath);
        }
        catch (error) {
            if (error.message?.includes('nothing to commit')) {
                this.logger.info('Nothing to commit');
                return await this.getCommitSha(repoPath);
            }
            throw error;
        }
    }
    /**
     * Push to remote
     */
    async push(repoPath, branch = 'main') {
        if (this.options.noPush) {
            this.logger.info('Push skipped (noPush option)');
            return;
        }
        try {
            await execAsync(`git push origin ${branch}`, { cwd: repoPath });
            this.logger.info('Pushed to remote');
        }
        catch (error) {
            this.logger.error(`Push failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Check if there are uncommitted changes
     */
    async hasUncommittedChanges(repoPath) {
        try {
            const { stdout } = await execAsync('git status --porcelain', { cwd: repoPath });
            return stdout.trim().length > 0;
        }
        catch {
            return false;
        }
    }
    /**
     * Commit in submodule and update parent reference
     */
    async commitSubmoduleAndUpdateParent(parentRepoPath, specsFolder, submoduleMessage, parentMessage) {
        const specsPath = path.join(parentRepoPath, specsFolder);
        // Stage and commit in submodule
        await this.stageAll(specsPath);
        const submoduleSha = await this.commit(specsPath, submoduleMessage);
        // Push submodule
        await this.push(specsPath);
        // Update parent's submodule reference
        await execAsync(`git add ${specsFolder}`, { cwd: parentRepoPath });
        const parentSha = await this.commit(parentRepoPath, parentMessage);
        // Push parent
        await this.push(parentRepoPath);
        return { submoduleSha, parentSha };
    }
    // =========================================================================
    // VERSION UTILITIES
    // =========================================================================
    /**
     * Parse SemVer string
     */
    parseSemVer(version) {
        const parts = version.split('.').map(Number);
        return {
            major: parts[0] || 0,
            minor: parts[1] || 0,
            patch: parts[2] || 0,
        };
    }
    /**
     * Format SemVer to string
     */
    formatSemVer(version) {
        return `${version.major}.${version.minor}.${version.patch}`;
    }
    /**
     * Calculate next version based on changes
     */
    calculateNextVersion(currentVersion, bumpType) {
        const current = this.parseSemVer(currentVersion);
        switch (bumpType) {
            case 'major':
                return this.formatSemVer({
                    major: current.major + 1,
                    minor: 0,
                    patch: 0,
                });
            case 'minor':
                return this.formatSemVer({
                    major: current.major,
                    minor: current.minor + 1,
                    patch: 0,
                });
            case 'patch':
                return this.formatSemVer({
                    major: current.major,
                    minor: current.minor,
                    patch: current.patch + 1,
                });
        }
    }
    /**
     * Determine bump type based on changes
     */
    determineBumpType(added, removed, modified) {
        // Breaking changes (removed items) = major
        if (removed > 0) {
            return 'minor'; // Conservative: use minor for removals in specs
        }
        // New items = minor
        if (added > 0) {
            return 'minor';
        }
        // Only modifications = patch
        return 'patch';
    }
    // =========================================================================
    // UTILITY METHODS
    // =========================================================================
    /**
     * Check if gh CLI is available
     */
    async checkGhCli() {
        try {
            await execAsync('gh --version');
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Extract project name from repo URL or path
     */
    extractProjectName(repoPathOrUrl) {
        // Handle Git URLs
        const urlMatch = repoPathOrUrl.match(/\/([^\/]+?)(\.git)?$/);
        if (urlMatch) {
            return urlMatch[1];
        }
        // Handle local path
        return path.basename(repoPathOrUrl);
    }
    /**
     * Extract GitHub owner from repo URL
     */
    extractGithubOwner(repoUrl) {
        // Handle SSH URL: git@github.com:owner/repo.git
        const sshMatch = repoUrl.match(/github\.com[:/]([^\/]+)\//);
        if (sshMatch) {
            return sshMatch[1];
        }
        // Handle HTTPS URL: https://github.com/owner/repo.git
        const httpsMatch = repoUrl.match(/github\.com\/([^\/]+)\//);
        if (httpsMatch) {
            return httpsMatch[1];
        }
        return undefined;
    }
}
//# sourceMappingURL=submodule-manager.skill.js.map