/**
 * Core Types for Repo-Spec-Zero Plugin
 * Extended with DAG, Context, and SPEC-OS compliance types
 */
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
};
// Default key files to read for each repo type
export const DEFAULT_KEY_FILES = {
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
/**
 * Default plugin configuration
 */
export const DEFAULT_PLUGIN_CONFIG = {
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
};
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
};
/**
 * v2.1.0: Mapping of agent IDs to target subdirectory
 */
export const AGENT_TO_SUBDIR_MAP = {
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
export const AGENT_TO_FILENAME_MAP = {
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
];
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
};
//# sourceMappingURL=types.js.map