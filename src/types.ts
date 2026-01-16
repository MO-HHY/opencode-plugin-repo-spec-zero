/**
 * Core Types for Repo-Spec-Zero Plugin
 * Extended with DAG, Context, and SPEC-OS compliance types
 */

// ============================================================================
// AGENT CONTEXT & RESULT (Original + Extended)
// ============================================================================

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

// ============================================================================
// SHARED CONTEXT TYPES (NEW)
// ============================================================================

export interface PromptVersion {
    id: string;
    version: string;
    hash: string;
}

export interface AgentOutput {
    agentId: string;
    filePath: string;
    summary: string;      // Max 500 chars for token economy
    fullContent: string;  // Full content if needed
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

// ============================================================================
// DAG EXECUTION TYPES (NEW)
// ============================================================================

export interface DAGNode {
    agentId: string;
    dependencies: string[];  // IDs of agents that must run before
    parallel?: boolean;      // Can run in parallel with siblings
    optional?: boolean;      // Can be skipped if deps fail
    condition?: (context: any) => boolean;  // Optional execution condition
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
    skipped?: boolean;
    skipReason?: string;
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

// ============================================================================
// PROMPT TYPES (NEW)
// ============================================================================

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

// ============================================================================
// SPEC-OS OUTPUT TYPES (NEW)
// ============================================================================

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

// ============================================================================
// BOOTSTRAP & KEY FILES (NEW)
// ============================================================================

export type RepoType = 
    | 'backend' 
    | 'frontend' 
    | 'fullstack' 
    | 'library' 
    | 'cli' 
    | 'monorepo'
    | 'mobile'
    | 'unknown';

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
export const FEATURE_FLAGS = {
    // API
    HAS_REST_API: 'has_rest_api',
    HAS_GRAPHQL: 'has_graphql',
    HAS_WEBSOCKET: 'has_websocket',
    HAS_GRPC: 'has_grpc',
    
    // Database
    HAS_SQL_DB: 'has_sql_db',
    HAS_NOSQL_DB: 'has_nosql_db',
    HAS_ORM: 'has_orm',
    HAS_MIGRATIONS: 'has_migrations',
    
    // Auth
    HAS_AUTH: 'has_auth',
    HAS_OAUTH: 'has_oauth',
    HAS_JWT: 'has_jwt',
    HAS_RBAC: 'has_rbac',
    
    // Frontend
    HAS_REACT: 'has_react',
    HAS_VUE: 'has_vue',
    HAS_ANGULAR: 'has_angular',
    HAS_STATE_MGMT: 'has_state_mgmt',
    HAS_ROUTING: 'has_routing',
    
    // Infra
    HAS_DOCKER: 'has_docker',
    HAS_K8S: 'has_k8s',
    HAS_SERVERLESS: 'has_serverless',
    HAS_CICD: 'has_cicd',
    
    // Quality
    HAS_TESTS: 'has_tests',
    HAS_LINTING: 'has_linting',
    HAS_TYPES: 'has_types',
} as const;

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

// Default key files to read for each repo type
export const DEFAULT_KEY_FILES: KeyFilesByRepoType = {
    generic: [
        { path: 'package.json', required: false, maxChars: 10000, description: 'Node.js package manifest' },
        { path: 'README.md', required: false, maxChars: 8000, description: 'Project documentation' },
        { path: 'tsconfig.json', required: false, maxChars: 3000, description: 'TypeScript configuration' },
        { path: '.env.example', required: false, maxChars: 2000, description: 'Environment variables template' },
        { path: 'docker-compose.yml', required: false, maxChars: 5000, description: 'Docker compose config' },
        { path: 'Dockerfile', required: false, maxChars: 3000, description: 'Docker build config' },
    ],
    frontend: [
        { path: 'package.json', required: true, maxChars: 10000, description: 'Node.js package manifest' },
        { path: 'vite.config.ts', required: false, maxChars: 3000, description: 'Vite configuration' },
        { path: 'next.config.js', required: false, maxChars: 3000, description: 'Next.js configuration' },
        { path: 'nuxt.config.ts', required: false, maxChars: 3000, description: 'Nuxt configuration' },
        { path: 'tailwind.config.js', required: false, maxChars: 3000, description: 'Tailwind CSS config' },
    ],
    backend: [
        { path: 'package.json', required: false, maxChars: 10000, description: 'Node.js package manifest' },
        { path: 'requirements.txt', required: false, maxChars: 5000, description: 'Python dependencies' },
        { path: 'pyproject.toml', required: false, maxChars: 5000, description: 'Python project config' },
        { path: 'go.mod', required: false, maxChars: 3000, description: 'Go module config' },
        { path: 'Cargo.toml', required: false, maxChars: 3000, description: 'Rust package manifest' },
        { path: 'prisma/schema.prisma', required: false, maxChars: 15000, description: 'Prisma database schema' },
        { path: 'drizzle.config.ts', required: false, maxChars: 3000, description: 'Drizzle ORM config' },
    ],
    library: [
        { path: 'package.json', required: true, maxChars: 10000, description: 'Node.js package manifest' },
        { path: 'tsconfig.json', required: false, maxChars: 3000, description: 'TypeScript configuration' },
        { path: 'rollup.config.js', required: false, maxChars: 3000, description: 'Rollup bundler config' },
        { path: 'esbuild.config.js', required: false, maxChars: 3000, description: 'esbuild config' },
    ],
    mobile: [
        { path: 'package.json', required: false, maxChars: 10000, description: 'Node.js package manifest' },
        { path: 'app.json', required: false, maxChars: 5000, description: 'Expo/React Native config' },
        { path: 'pubspec.yaml', required: false, maxChars: 5000, description: 'Flutter dependencies' },
        { path: 'android/app/build.gradle', required: false, maxChars: 5000, description: 'Android build config' },
        { path: 'ios/Podfile', required: false, maxChars: 3000, description: 'iOS CocoaPods config' },
    ],
    'infra-as-code': [
        { path: 'main.tf', required: false, maxChars: 10000, description: 'Terraform main config' },
        { path: 'variables.tf', required: false, maxChars: 5000, description: 'Terraform variables' },
        { path: 'serverless.yml', required: false, maxChars: 8000, description: 'Serverless Framework config' },
        { path: 'pulumi.yaml', required: false, maxChars: 5000, description: 'Pulumi config' },
        { path: 'cdk.json', required: false, maxChars: 3000, description: 'AWS CDK config' },
    ],
    monorepo: [
        { path: 'package.json', required: true, maxChars: 10000, description: 'Root package manifest' },
        { path: 'pnpm-workspace.yaml', required: false, maxChars: 2000, description: 'pnpm workspace config' },
        { path: 'lerna.json', required: false, maxChars: 2000, description: 'Lerna config' },
        { path: 'nx.json', required: false, maxChars: 5000, description: 'Nx workspace config' },
        { path: 'turbo.json', required: false, maxChars: 5000, description: 'Turborepo config' },
    ],
};

// ============================================================================
// AGENT EXECUTION CONTEXT (NEW - Enhanced)
// ============================================================================

export interface EnhancedAgentContext extends AgentContext {
    // Shared context reference
    sharedContext?: any;  // SharedContext instance
    
    // Previous results (for backwards compatibility)
    previousResults?: string;
    
    // DAG-specific
    dependencies?: string[];
    layer?: number;
    
    // Execution metadata
    executionId?: string;
    startTime?: Date;
}

export interface EnhancedAgentResult extends AgentResult {
    // For context accumulation
    summary?: string;      // Max 500 chars
    promptVersion?: PromptVersion;
    
    // Validation
    validation?: ValidationResult;
    
    // Timing
    durationMs?: number;
}

// ============================================================================
// v2.0.0: SUBMODULE MANAGEMENT TYPES
// ============================================================================

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

// ============================================================================
// v2.0.0: MANIFEST TYPES
// ============================================================================

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

// ============================================================================
// v2.0.0: AUDIT REPORT TYPES
// ============================================================================

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

// ============================================================================
// v2.0.0: APPLY COMMAND TYPES
// ============================================================================

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

// ============================================================================
// v2.0.0: VERSION CALCULATION TYPES
// ============================================================================

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

// ============================================================================
// v2.0.0: PLUGIN CONFIGURATION TYPES
// ============================================================================

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
export const DEFAULT_PLUGIN_CONFIG: PluginConfig = {
    schema_version: '2.0',
    specs_repo_private: true,
    auto_push: true,
    non_interactive: false,
    specs_folder: 'specs',
};

// ============================================================================
// v2.0.0: FOLDER STRUCTURE CONSTANTS
// ============================================================================

/**
 * Standard folder structure within specs submodule
 */
export const SPECS_FOLDER_STRUCTURE = {
    /** Metadata folder */
    META: '.meta',
    /** Generated specs folder */
    GENERATED: '_generated',
    /** Archived audits folder */
    AUDITS: '_audits',
    /** Manual domain specs folder (plugin ignores) */
    DOMAINS: 'domains',
    /** Manifest file */
    MANIFEST: '.meta/manifest.json',
    /** Config file */
    CONFIG: '.meta/config.json',
    /** Current audit report */
    AUDIT_REPORT: 'AUDIT_REPORT.md',
    /** Index file */
    INDEX: 'index.md',
} as const;

/**
 * v2.1.0: Subdirectory structure within _generated/
 */
export const GENERATED_SUBDIRS = {
    /** Layer 0: Foundation */
    FOUNDATION: '00-foundation',
    /** Layer 1: Domain model */
    DOMAIN: '01-domain',
    /** Layer 2: Code modules */
    MODULES: '02-modules',
    /** Layer 3: API contracts */
    API: '03-api',
    /** Layer 4: Data layer */
    DATA: '04-data',
    /** Layer 5: Auth & Security */
    AUTH: '05-auth',
    /** Layer 6: Integration */
    INTEGRATION: '06-integration',
    /** Layer 7: Operations */
    OPS: '07-ops',
    /** Visual assets */
    DIAGRAMS: '_diagrams',
} as const;

/**
 * v2.1.0: Mapping of agent IDs to target subdirectory
 */
export const AGENT_TO_SUBDIR_MAP: Record<string, string> = {
    // 00-foundation
    'overview': GENERATED_SUBDIRS.FOUNDATION,
    
    // 01-domain
    'entity': GENERATED_SUBDIRS.DOMAIN,
    'event': GENERATED_SUBDIRS.DOMAIN,
    
    // 02-modules
    'module': GENERATED_SUBDIRS.MODULES,
    
    // 03-api
    'api': GENERATED_SUBDIRS.API,
    
    // 04-data
    'db': GENERATED_SUBDIRS.DATA,
    'data_map': GENERATED_SUBDIRS.DATA,
    
    // 05-auth
    'auth': GENERATED_SUBDIRS.AUTH,
    'authz': GENERATED_SUBDIRS.AUTH,
    'security': GENERATED_SUBDIRS.AUTH,
    'prompt_sec': GENERATED_SUBDIRS.AUTH,
    
    // 06-integration
    'dependency': GENERATED_SUBDIRS.INTEGRATION,
    'service_dep': GENERATED_SUBDIRS.INTEGRATION,
    
    // 07-ops
    'deployment': GENERATED_SUBDIRS.OPS,
    'monitor': GENERATED_SUBDIRS.OPS,
    'ml': GENERATED_SUBDIRS.OPS,
    'flag': GENERATED_SUBDIRS.OPS,
};

/**
 * v2.1.0: File names within each subdirectory
 */
export const AGENT_TO_FILENAME_MAP: Record<string, string> = {
    'overview': 'overview.md',
    'entity': 'entities.md',
    'event': 'events.md',
    'module': 'index.md',
    'api': 'endpoints.md',
    'db': 'database.md',
    'data_map': 'data_mapping.md',
    'auth': 'authentication.md',
    'authz': 'authorization.md',
    'security': 'security.md',
    'prompt_sec': 'prompt_security.md',
    'dependency': 'dependencies.md',
    'service_dep': 'services.md',
    'deployment': 'deployment.md',
    'monitor': 'monitoring.md',
    'ml': 'ml_services.md',
    'flag': 'feature_flags.md',
};

/**
 * Generated spec file names
 */
export const GENERATED_SPEC_FILES = [
    'overview.md',
    'module.md',
    'entity.md',
    'database.md',
    'data_mapping.md',
    'events.md',
    'api.md',
    'dependencies.md',
    'service_dependencies.md',
    'authentication.md',
    'authorization.md',
    'security.md',
    'prompt_security.md',
    'deployment.md',
    'monitoring.md',
    'ml_services.md',
    'feature_flags.md',
] as const;

// ============================================================================
// v2.0.0: INDEX.MD AUTO/MANUAL SECTION TYPES
// ============================================================================

/**
 * Delimiters for auto-managed sections in index.md
 */
export const INDEX_DELIMITERS = {
    AUTO_START: '<!-- AUTO:START - Do not edit this section manually -->',
    AUTO_END: '<!-- AUTO:END -->',
    MANUAL_START: '<!-- MANUAL:START - Your custom content below -->',
    MANUAL_END: '<!-- MANUAL:END -->',
} as const;

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

// ============================================================================
// v2.1.0: PROMPT REGISTRY TYPES
// ============================================================================

/**
 * Category of prompt
 */
export type PromptCategory = 
    | 'analysis'      // Exploratory analysis
    | 'document'      // Documentation generation
    | 'audit'         // Comparison/validation
    | 'diagram'       // Diagram generation only
    | 'template';     // Template filling

/**
 * Types of Mermaid diagrams supported
 */
export type DiagramType = 
    | 'sequence'      // API flows, auth, communication
    | 'flowchart'     // Logic, decisions, routing
    | 'erd'           // Entity Relationship
    | 'classDiagram'  // Class/type structure
    | 'stateDiagram'  // State machines
    | 'c4'            // C4 architecture
    | 'gantt'         // Timeline/roadmap
    | 'pie';          // Distribution charts

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

// ============================================================================
// v2.1.0: PROMPT ROUTER TYPES
// ============================================================================

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

// ============================================================================
// v2.1.0: SMART DAG PLANNER TYPES
// ============================================================================

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

// ============================================================================
// v2.1.0: TEMPLATE LOADER TYPES
// ============================================================================

/**
 * Definition of a template in the template registry
 */
export interface TemplateDefinition {
    /** Unique template ID: "category/name" e.g. "api/endpoint" */
    id: string;
    
    /** Human-readable name */
    name: string;
    
    /** Description of what this template is for */
    description: string;
    
    /** Category: "api", "ui", "entity", "auth", etc. */
    category: string;
    
    /** Variables that MUST be provided */
    requiredVariables: string[];
    
    /** Variables with default values (optional) */
    optionalVariables?: string[];
    
    /** Template version */
    version: string;
}

/**
 * Template loaded from filesystem with parsed metadata
 */
export interface LoadedTemplate {
    /** Template definition metadata */
    definition: TemplateDefinition;
    
    /** Raw template markdown content */
    content: string;
    
    /** All extracted {{variable}} names */
    variables: string[];
    
    /** MD5 hash (8 chars) for caching */
    hash: string;
}

/**
 * Variables passed to template fill()
 */
export interface TemplateVariables {
    [key: string]: string | number | boolean | object | any[];
}

/**
 * Result of template fill operation
 */
export interface TemplateResult {
    /** Filled template content */
    content: string;
    
    /** Variables that were used */
    usedVariables: string[];
    
    /** Variables that were missing (used default or empty) */
    missingVariables: string[];
}

// ============================================================================
// v2.1.0: GENERIC ANALYSIS AGENT TYPES
// ============================================================================

/**
 * Message structure for LLM API calls
 */
export interface LLMMessage {
    /** Role: system, user, or assistant */
    role: 'system' | 'user' | 'assistant';
    
    /** Message content */
    content: string;
}

/**
 * Diagram generated by analysis agent
 */
export interface GeneratedDiagram {
    /** Type of Mermaid diagram */
    type: DiagramType;
    
    /** Mermaid code content */
    content: string;
    
    /** Output filename e.g. "api-sequence.mmd" */
    outputFile: string;
    
    /** Whether to include inline in markdown doc */
    inline: boolean;
}

/**
 * Standalone diagram file with frontmatter
 */
export interface StandaloneDiagram {
    /** File path relative to _generated/_diagrams/ */
    path: string;
    
    /** Full content including YAML frontmatter */
    content: string;
}

/**
 * Output from GenericAnalysisAgent.process()
 */
export interface GenericAgentOutput {
    /** Generated markdown content */
    output: string;
    
    /** Output file path relative to _generated/ */
    path: string;
    
    /** Standalone diagram files to write */
    diagrams: StandaloneDiagram[];
    
    /** Prompt version used for traceability */
    promptVersion: PromptVersion;
}

/**
 * Configuration for GenericAnalysisAgent instantiation
 */
export interface GenericAgentConfig {
    /** Planned agent configuration from DAG */
    plannedAgent: PlannedAgent;
    
    /** Router for prompt selection (PromptRouter) */
    router: any;
    
    /** Template loader for output formatting (TemplateLoader) */
    templateLoader: any;
    
    /** Shared context reference (SharedContext) */
    sharedContext?: any;
}

// ============================================================================
// v2.1.0: DIAGRAM GENERATOR TYPES (S5-T1.1)
// ============================================================================

/**
 * Entity definition for Entity Relationship Diagrams (ERD)
 */
export interface DiagramEntity {
    name: string;
    fields: { 
        name: string; 
        type: string; 
        isPK?: boolean; 
        isFK?: boolean 
    }[];
    relations?: { 
        target: string; 
        cardinality: string; 
        label: string 
    }[];
}

/**
 * Flow step for Sequence Diagrams
 */
export interface DiagramFlow {
    from: string;
    to: string;
    message: string;
    isResponse?: boolean;
}

/**
 * Step definition for Flowchart Diagrams
 */
export interface DiagramStep {
    id: string;
    label: string;
    type: 'decision' | 'process' | 'terminal';
    next?: { 
        target: string; 
        condition?: string 
    }[];
}

/**
 * Class definition for Class Diagrams
 */
export interface DiagramClass {
    name: string;
    properties?: { 
        name: string; 
        type: string; 
        isPublic: boolean 
    }[];
    methods?: { 
        name: string; 
        params?: string; 
        returnType: string; 
        isPublic: boolean 
    }[];
    extends?: string;
    implements?: string[];
}

/**
 * State definition for State Diagrams
 */
export interface DiagramState {
    name: string;
    isInitial?: boolean;
    isFinal?: boolean;
    transitions?: { 
        target: string; 
        event?: string 
    }[];
}

/**
 * Component definition for C4 Context Diagrams
 */
export interface DiagramComponent {
    id: string;
    name: string;
    type: 'person' | 'system' | 'external' | 'container';
    description?: string;
    relations?: { 
        target: string; 
        label: string 
    }[];
}

