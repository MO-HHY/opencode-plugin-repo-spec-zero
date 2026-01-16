/**
 * Core Types for Repo-Spec-Zero Plugin
 * Extended with DAG, Context, and SPEC-OS compliance types
 */
export interface AgentContext {
    client: any;
    params: Record<string, unknown>;
    messages: any[];
    intent: any;
}
export interface AgentResult {
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
}
export interface AgentConfig {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    permissions?: string[];
    allowedSkills?: string[];
    triggers?: RegExp[];
    subAgents?: any[];
}
export interface PromptVersion {
    id: string;
    version: string;
    hash: string;
}
export interface AgentOutput {
    agentId: string;
    filePath: string;
    summary: string;
    fullContent: string;
    promptVersion: PromptVersion;
    timestamp: Date;
}
export interface KeyFile {
    relativePath: string;
    content: string;
    truncated: boolean;
}
export interface ContextParams {
    projectSlug: string;
    repoType: string;
    baseDir: string;
    repoStructure: string;
}
export interface ContextMetadata {
    projectSlug: string;
    repoType: string;
    baseDir: string;
    analysisDate: string;
    durationMs: number;
    agentsExecuted: string[];
    keyFilesLoaded: string[];
    promptVersions: PromptVersion[];
}
export interface DAGNode {
    agentId: string;
    dependencies: string[];
    parallel?: boolean;
    optional?: boolean;
    condition?: (context: any) => boolean;
}
export interface DAGDefinition {
    version: string;
    nodes: DAGNode[];
}
export interface DAGExecutionResult {
    agentId: string;
    success: boolean;
    durationMs: number;
    error?: string;
    output?: AgentOutput;
}
export interface DAGExecutionSummary {
    totalAgents: number;
    executed: number;
    successful: number;
    failed: number;
    skipped: number;
    totalDurationMs: number;
    results: DAGExecutionResult[];
}
export interface PromptMetadata {
    id: string;
    version: string;
    hash: string;
    lastModified: string;
    sourcePath: string;
}
export interface LoadedPrompt {
    content: string;
    metadata: PromptMetadata;
}
export interface PromptVariables {
    projectSlug?: string;
    repoType?: string;
    repoStructure?: string;
    previousResults?: string;
    [key: string]: string | undefined;
}
export interface SpecOSFrontmatter {
    uid: string;
    title: string;
    status: 'draft' | 'review' | 'approved';
    version: string;
    created: string;
    prompt_version: string;
    edges?: string[];
    tags?: string[];
}
export interface SpecOSDocument {
    frontmatter: SpecOSFrontmatter;
    content: string;
    rawMarkdown: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export type RepoType = 'backend' | 'frontend' | 'fullstack' | 'library' | 'cli' | 'monorepo' | 'mobile' | 'unknown';
/**
 * Structure detection result for repository
 */
export interface RepoStructure {
    hasBackend: boolean;
    hasFrontend: boolean;
    hasTests: boolean;
    hasDocs: boolean;
    hasDocker: boolean;
    hasCICD: boolean;
    isMonorepo: boolean;
}
/**
 * Feature detection result for a repository
 * Used by SmartDAGPlanner to determine which agents to run
 */
export interface DetectedFeatures {
    /** Determined repository type */
    repoType: RepoType;
    /** Detected programming languages */
    languages: Set<string>;
    /** Detected frameworks (express, react, etc.) */
    frameworks: Set<string>;
    /** Detected feature flags (HAS_REST_API, HAS_AUTH, etc.) */
    features: Set<string>;
    /** Directory structure analysis */
    structure: RepoStructure;
    /** Detected package manager */
    packageManager?: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo';
    /** Found entry points (src/index.ts, etc.) */
    entryPoints: string[];
}
/**
 * Feature flags used for conditional agent selection
 */
export declare const FEATURE_FLAGS: {
    readonly HAS_REST_API: "has_rest_api";
    readonly HAS_GRAPHQL: "has_graphql";
    readonly HAS_WEBSOCKET: "has_websocket";
    readonly HAS_GRPC: "has_grpc";
    readonly HAS_SQL_DB: "has_sql_db";
    readonly HAS_NOSQL_DB: "has_nosql_db";
    readonly HAS_ORM: "has_orm";
    readonly HAS_MIGRATIONS: "has_migrations";
    readonly HAS_AUTH: "has_auth";
    readonly HAS_OAUTH: "has_oauth";
    readonly HAS_JWT: "has_jwt";
    readonly HAS_RBAC: "has_rbac";
    readonly HAS_REACT: "has_react";
    readonly HAS_VUE: "has_vue";
    readonly HAS_ANGULAR: "has_angular";
    readonly HAS_STATE_MGMT: "has_state_mgmt";
    readonly HAS_ROUTING: "has_routing";
    readonly HAS_DOCKER: "has_docker";
    readonly HAS_K8S: "has_k8s";
    readonly HAS_SERVERLESS: "has_serverless";
    readonly HAS_CICD: "has_cicd";
    readonly HAS_TESTS: "has_tests";
    readonly HAS_LINTING: "has_linting";
    readonly HAS_TYPES: "has_types";
};
/** Type for feature flag values */
export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];
export interface KeyFileDefinition {
    path: string;
    required: boolean;
    maxChars?: number;
    description: string;
}
export interface KeyFilesByRepoType {
    [repoType: string]: KeyFileDefinition[];
}
export declare const DEFAULT_KEY_FILES: KeyFilesByRepoType;
export interface EnhancedAgentContext extends AgentContext {
    sharedContext?: any;
    previousResults?: string;
    dependencies?: string[];
    layer?: number;
    executionId?: string;
    startTime?: Date;
}
export interface EnhancedAgentResult extends AgentResult {
    summary?: string;
    promptVersion?: PromptVersion;
    validation?: ValidationResult;
    durationMs?: number;
}
/**
 * Configuration for the specs Git submodule
 */
export interface SubmoduleConfig {
    /** Local path relative to repo root (default: "specs") */
    path: string;
    /** Remote Git URL for specs repository */
    remoteUrl: string;
    /** Branch to use (default: "main") */
    branch: string;
}
/**
 * Current state of the specs submodule
 */
export interface SubmoduleState {
    /** Whether the submodule entry exists in .gitmodules */
    exists: boolean;
    /** Whether the submodule is initialized and checked out */
    initialized: boolean;
    /** Submodule configuration if exists */
    config?: SubmoduleConfig;
    /** Loaded manifest if available */
    manifest?: SpecsManifest;
    /** Absolute path to specs directory */
    specsPath: string;
    /** Detected mode based on manifest state */
    mode: SpecZeroMode;
    /** Existing specs content (for audit mode) */
    existingSpecs?: Map<string, string>;
}
/**
 * Operation mode for Spec-Zero
 */
export type SpecZeroMode = 'generation' | 'audit';
/**
 * Main manifest for specs tracking
 * Located at: specs/.meta/manifest.json
 */
export interface SpecsManifest {
    /** Schema version for forward compatibility */
    schema_version: '2.0' | '2.1';
    /** Project information */
    project: ProjectInfo;
    /** Current specs SemVer version */
    current_version: string;
    /** Current mode */
    mode: SpecZeroMode;
    /** Whether there's a pending audit report */
    pending_audit: boolean;
    /** v2.1: Folder structure version */
    folder_structure_version?: '1.0' | '2.0';
    /** v2.1: Hash of folder structure for drift detection */
    structure_hash?: string;
    /** v2.1: Mapping of agent ID to file location */
    file_locations?: Record<string, string>;
    /** History of all analyses/applies */
    analyses: AnalysisEntry[];
    /** History of all audits */
    audits: AuditEntry[];
}
/**
 * Project information stored in manifest
 */
export interface ProjectInfo {
    /** Project display name */
    name: string;
    /** Source repository URL */
    repo_url: string;
    /** Specs repository URL */
    specs_repo_url: string;
    /** ISO timestamp of first analysis */
    created: string;
}
/**
 * Entry for each analysis/apply operation
 */
export interface AnalysisEntry {
    /** Version assigned to this analysis */
    version: string;
    /** Type of operation */
    type: 'generation' | 'apply';
    /** ISO timestamp */
    date: string;
    /** Source repo commit SHA at analysis time */
    repo_sha: string;
    /** Source repo branch */
    repo_branch: string;
    /** Specs repo commit SHA after this entry */
    specs_sha: string;
    /** Plugin version used */
    plugin_version: string;
    /** Number of agents that were executed */
    agents_run: number;
    /** Number of agents that succeeded */
    agents_succeeded: number;
    /** Files generated (generation mode) */
    files_generated?: string[];
    /** Files changed (apply mode) */
    files_changed?: string[];
    /** Source audit report (apply mode) */
    from_audit?: string;
    /** Human-readable summary */
    summary?: string;
}
/**
 * Entry for each audit operation
 */
export interface AuditEntry {
    /** ISO timestamp */
    date: string;
    /** Source repo commit SHA */
    repo_sha: string;
    /** Specs version compared against */
    specs_version_compared: string;
    /** Total number of changes detected */
    changes_detected: number;
    /** Current status of the audit */
    status: 'pending' | 'applied' | 'dismissed';
    /** Version this audit was applied as (if applied) */
    applied_as_version?: string;
    /** Path to archived audit report (if applied) */
    archived_to?: string;
}
/**
 * Complete audit report structure
 */
export interface AuditReport {
    /** Report metadata */
    meta: AuditReportMeta;
    /** Summary statistics */
    summary: AuditSummary;
    /** Changes grouped by file */
    changes: FileChanges[];
}
/**
 * Audit report metadata (maps to YAML frontmatter)
 */
export interface AuditReportMeta {
    /** Unique identifier */
    uid: string;
    /** Report title */
    title: string;
    /** Report status */
    status: 'pending' | 'applied' | 'dismissed';
    /** ISO timestamp when generated */
    generated: string;
    /** Source repo commit SHA */
    repo_sha: string;
    /** Source repo branch */
    repo_branch: string;
    /** Plugin version */
    plugin_version: string;
    /** Current specs version being compared against */
    current_specs_version: string;
    /** Proposed new version if applied */
    proposed_version: string;
}
/**
 * Summary statistics for audit report
 */
export interface AuditSummary {
    /** Total number of changes */
    total_changes: number;
    /** Number of new items */
    added: number;
    /** Number of removed items */
    removed: number;
    /** Number of modified items */
    modified: number;
    /** Number of files affected */
    files_affected: number;
}
/**
 * Changes for a single file
 */
export interface FileChanges {
    /** Target file path (e.g., "_generated/api.md") */
    file: string;
    /** Items added */
    added: ChangeItem[];
    /** Items removed */
    removed: ChangeItem[];
    /** Items modified */
    modified: ChangeItem[];
}
/**
 * Individual change item
 */
export interface ChangeItem {
    /** Item identifier (e.g., "POST /api/users") */
    item: string;
    /** Source code location if applicable */
    location?: string;
    /** Human-readable description */
    description: string;
    /** Code snippet if relevant */
    code_snippet?: string;
    /** Diff for modifications */
    diff?: string;
    /** Previous value (for modifications) */
    previous_value?: string;
    /** New value (for modifications) */
    new_value?: string;
}
/**
 * Options for the apply command
 */
export interface ApplyOptions {
    /** Apply all changes */
    all?: boolean;
    /** Apply changes to specific file only */
    file?: string;
    /** Interactive mode - prompt for each change */
    interactive?: boolean;
    /** Skip confirmation prompts */
    force?: boolean;
}
/**
 * Result of apply operation
 */
export interface ApplyResult {
    /** Whether the apply succeeded */
    success: boolean;
    /** New version number */
    new_version: string;
    /** Previous version number */
    old_version: string;
    /** Files that were modified */
    files_modified: string[];
    /** Path to archived audit report */
    archived_audit_path: string;
    /** Error message if failed */
    error?: string;
}
/**
 * SemVer version components
 */
export interface SemVer {
    major: number;
    minor: number;
    patch: number;
}
/**
 * Type of version bump
 */
export type VersionBumpType = 'major' | 'minor' | 'patch';
/**
 * Determine version bump from changes
 */
export interface VersionBumpReason {
    type: VersionBumpType;
    reason: string;
}
/**
 * Plugin configuration stored in specs/.meta/config.json
 */
export interface PluginConfig {
    /** Schema version */
    schema_version: '2.0';
    /** GitHub organization or user */
    github_owner?: string;
    /** Specs repository visibility */
    specs_repo_private: boolean;
    /** Auto-push after operations */
    auto_push: boolean;
    /** Skip confirmation prompts */
    non_interactive: boolean;
    /** Custom specs folder name (default: "specs") */
    specs_folder: string;
    /** Agents to skip */
    skip_agents?: string[];
    /** Custom prompt overrides */
    prompt_overrides?: Record<string, string>;
}
/**
 * Default plugin configuration
 */
export declare const DEFAULT_PLUGIN_CONFIG: PluginConfig;
/**
 * Standard folder structure within specs submodule
 */
export declare const SPECS_FOLDER_STRUCTURE: {
    /** Metadata folder */
    readonly META: ".meta";
    /** Generated specs folder */
    readonly GENERATED: "_generated";
    /** Archived audits folder */
    readonly AUDITS: "_audits";
    /** Manual domain specs folder (plugin ignores) */
    readonly DOMAINS: "domains";
    /** Manifest file */
    readonly MANIFEST: ".meta/manifest.json";
    /** Config file */
    readonly CONFIG: ".meta/config.json";
    /** Current audit report */
    readonly AUDIT_REPORT: "AUDIT_REPORT.md";
    /** Index file */
    readonly INDEX: "index.md";
};
/**
 * v2.1.0: Subdirectory structure within _generated/
 */
export declare const GENERATED_SUBDIRS: {
    /** Layer 0: Foundation */
    readonly FOUNDATION: "00-foundation";
    /** Layer 1: Domain model */
    readonly DOMAIN: "01-domain";
    /** Layer 2: Code modules */
    readonly MODULES: "02-modules";
    /** Layer 3: API contracts */
    readonly API: "03-api";
    /** Layer 4: Data layer */
    readonly DATA: "04-data";
    /** Layer 5: Auth & Security */
    readonly AUTH: "05-auth";
    /** Layer 6: Integration */
    readonly INTEGRATION: "06-integration";
    /** Layer 7: Operations */
    readonly OPS: "07-ops";
    /** Visual assets */
    readonly DIAGRAMS: "_diagrams";
};
/**
 * v2.1.0: Mapping of agent IDs to target subdirectory
 */
export declare const AGENT_TO_SUBDIR_MAP: Record<string, string>;
/**
 * v2.1.0: File names within each subdirectory
 */
export declare const AGENT_TO_FILENAME_MAP: Record<string, string>;
/**
 * Generated spec file names
 */
export declare const GENERATED_SPEC_FILES: readonly ["overview.md", "module.md", "entity.md", "database.md", "data_mapping.md", "events.md", "api.md", "dependencies.md", "service_dependencies.md", "authentication.md", "authorization.md", "security.md", "prompt_security.md", "deployment.md", "monitoring.md", "ml_services.md", "feature_flags.md"];
/**
 * Delimiters for auto-managed sections in index.md
 */
export declare const INDEX_DELIMITERS: {
    readonly AUTO_START: "<!-- AUTO:START - Do not edit this section manually -->";
    readonly AUTO_END: "<!-- AUTO:END -->";
    readonly MANUAL_START: "<!-- MANUAL:START - Your custom content below -->";
    readonly MANUAL_END: "<!-- MANUAL:END -->";
};
/**
 * Parsed index.md structure
 */
export interface ParsedIndex {
    /** YAML frontmatter */
    frontmatter: Record<string, any>;
    /** Auto-generated section content */
    autoSection: string;
    /** Manual section content (preserved across updates) */
    manualSection: string;
    /** Any content before AUTO:START */
    preamble?: string;
    /** Any content after MANUAL:END */
    postamble?: string;
}
/**
 * Category of prompt
 */
export type PromptCategory = 'analysis' | 'document' | 'audit' | 'diagram' | 'template';
/**
 * Types of Mermaid diagrams supported
 */
export type DiagramType = 'sequence' | 'flowchart' | 'erd' | 'classDiagram' | 'stateDiagram' | 'c4' | 'gantt' | 'pie';
/**
 * Prompt definition in registry
 */
export interface PromptDefinition {
    /** Unique ID: "category/name" e.g. "api/detect-endpoints" */
    id: string;
    /** Prompt category */
    category: PromptCategory;
    /** Repository types this prompt applies to */
    applicableTo: RepoType[];
    /** Features that must be detected to use this prompt */
    requiredFeatures?: string[];
    /** Prompts that must be completed before this one */
    dependsOn: string[];
    /** What this prompt produces (used for dependencies) */
    produces: string[];
    /** Template ID to use for formatting output */
    templateId?: string;
    /** Diagrams to generate */
    diagrams: DiagramType[];
    /** Output file name (relative to _generated/) */
    outputFile: string;
    /** Priority for ordering when multiple match */
    priority: number;
    /** Optional if features missing */
    optional: boolean;
}
/**
 * Loaded prompt with content and metadata
 */
export interface LoadedPromptV2 {
    /** Prompt definition from registry */
    definition: PromptDefinition;
    /** Prompt content (markdown) */
    content: string;
    /** Version extracted from content */
    version: string;
    /** MD5 hash (8 chars) for traceability */
    hash: string;
}
/**
 * Context for prompt routing
 */
export interface RoutingContext {
    /** Repository type */
    repoType: RepoType;
    /** Detected features from FeatureDetector */
    detectedFeatures: Set<string>;
    /** Set of completed agent/prompt IDs */
    completedAgents: Set<string>;
    /** Summaries from previous agents (for context) */
    previousOutputs: Map<string, string>;
    /** Current agent ID being routed */
    currentAgentId: string;
}
/**
 * Routed prompt ready for LLM
 */
export interface RoutedPrompt {
    /** System prompt (role + guidelines) */
    systemPrompt: string;
    /** Specific analysis prompt */
    analysisPrompt: string;
    /** Output schema (SPEC-OS format) */
    outputSchema: string;
    /** Instructions for diagram generation */
    diagramInstructions: DiagramInstruction[];
    /** Template ID to use */
    templateId?: string;
    /** Metadata for traceability */
    metadata: {
        promptId: string;
        version: string;
        hash: string;
    };
}
/**
 * Instruction for generating a diagram
 */
export interface DiagramInstruction {
    /** Diagram type */
    type: DiagramType;
    /** Description of what to generate */
    description: string;
    /** Output file name (e.g. "overview-c4.mmd") */
    outputFile: string;
    /** Whether to also include inline in document */
    inline: boolean;
}
/**
 * Configuration for a planned agent in the DAG
 */
export interface PlannedAgent {
    /** Unique agent ID (used for dependencies) */
    id: string;
    /** Prompt ID to use from PromptRegistry */
    promptId: string;
    /** Template ID for output formatting (optional) */
    templateId?: string;
    /** Dependencies (other agent IDs that must complete first) */
    dependencies: string[];
    /** Can be executed in parallel with others in same layer */
    parallel: boolean;
    /** Optional agent (skip if fails or dependencies fail) */
    optional: boolean;
    /** Diagram types to generate */
    diagrams: DiagramType[];
    /** Output file path relative to _generated/ */
    outputFile: string;
    /** Layer number in DAG (for ordering) */
    layer: number;
}
/**
 * Planned DAG structure for execution
 */
export interface PlannedDAG {
    /** Version of the planning algorithm */
    version: string;
    /** Repository type this DAG is for */
    repoType: RepoType;
    /** All planned agents */
    agents: PlannedAgent[];
    /** Agents grouped by layer for parallel execution */
    layers: PlannedAgent[][];
    /** Metadata about the plan */
    metadata: {
        /** Total number of agents */
        totalAgents: number;
        /** Number of optional agents */
        optionalAgents: number;
        /** Estimated execution duration */
        estimatedDuration: string;
        /** Detected features that influenced planning */
        features: string[];
    };
}
/**
 * Result of skip decision for an agent
 */
export interface SkipResult {
    /** Whether to skip */
    skip: boolean;
    /** Reason for skipping (if skip is true) */
    reason?: string;
}
//# sourceMappingURL=types.d.ts.map