/**
 * FeatureDetector - Detects repository characteristics
 *
 * Analyzes repository to determine:
 * - Repository type (backend, frontend, fullstack, etc.)
 * - Programming languages used
 * - Frameworks detected
 * - Feature flags (API, DB, Auth, etc.)
 * - Directory structure patterns
 */
import * as fs from 'fs';
import * as path from 'path';
import { FEATURE_FLAGS } from '../types';
export class FeatureDetector {
    /**
     * Main entry point - detect all features of a repository
     */
    async detect(repoPath) {
        const features = new Set();
        const languages = new Set();
        const frameworks = new Set();
        // 1. Analyze package files (package.json, requirements.txt, etc.)
        await this.detectFromPackageFiles(repoPath, features, frameworks);
        // 2. Analyze directory structure
        const structure = await this.detectStructure(repoPath);
        // 3. Detect programming languages
        await this.detectLanguages(repoPath, languages);
        // 4. Pattern matching on key files
        await this.detectPatterns(repoPath, features);
        // 5. Determine repository type
        const repoType = this.determineRepoType(structure, features, frameworks);
        return {
            repoType,
            languages,
            frameworks,
            features,
            structure,
            packageManager: await this.detectPackageManager(repoPath),
            entryPoints: await this.findEntryPoints(repoPath)
        };
    }
    /**
     * Detect frameworks and features from package files
     */
    async detectFromPackageFiles(repoPath, features, frameworks) {
        // === package.json ===
        const pkgPath = path.join(repoPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
                // Frameworks detection
                if (allDeps['express'])
                    frameworks.add('express');
                if (allDeps['fastify'])
                    frameworks.add('fastify');
                if (allDeps['hono'])
                    frameworks.add('hono');
                if (allDeps['koa'])
                    frameworks.add('koa');
                if (allDeps['@nestjs/core'])
                    frameworks.add('nest');
                if (allDeps['react']) {
                    frameworks.add('react');
                    features.add(FEATURE_FLAGS.HAS_REACT);
                }
                if (allDeps['vue']) {
                    frameworks.add('vue');
                    features.add(FEATURE_FLAGS.HAS_VUE);
                }
                if (allDeps['@angular/core']) {
                    frameworks.add('angular');
                    features.add(FEATURE_FLAGS.HAS_ANGULAR);
                }
                if (allDeps['next'])
                    frameworks.add('nextjs');
                if (allDeps['nuxt'])
                    frameworks.add('nuxt');
                if (allDeps['svelte'])
                    frameworks.add('svelte');
                if (allDeps['react-native'])
                    frameworks.add('react-native');
                // Database/ORM
                if (allDeps['prisma'] || allDeps['@prisma/client']) {
                    features.add(FEATURE_FLAGS.HAS_ORM);
                    features.add(FEATURE_FLAGS.HAS_SQL_DB);
                }
                if (allDeps['typeorm']) {
                    features.add(FEATURE_FLAGS.HAS_ORM);
                    features.add(FEATURE_FLAGS.HAS_SQL_DB);
                }
                if (allDeps['drizzle-orm']) {
                    features.add(FEATURE_FLAGS.HAS_ORM);
                    features.add(FEATURE_FLAGS.HAS_SQL_DB);
                }
                if (allDeps['mongoose'] || allDeps['mongodb']) {
                    features.add(FEATURE_FLAGS.HAS_NOSQL_DB);
                }
                if (allDeps['pg'] || allDeps['mysql2'] || allDeps['better-sqlite3']) {
                    features.add(FEATURE_FLAGS.HAS_SQL_DB);
                }
                // API
                if (allDeps['@apollo/server'] || allDeps['graphql'] || allDeps['graphql-yoga']) {
                    features.add(FEATURE_FLAGS.HAS_GRAPHQL);
                }
                if (allDeps['socket.io'] || allDeps['ws']) {
                    features.add(FEATURE_FLAGS.HAS_WEBSOCKET);
                }
                if (allDeps['@grpc/grpc-js']) {
                    features.add(FEATURE_FLAGS.HAS_GRPC);
                }
                // Auth
                if (allDeps['jsonwebtoken'] || allDeps['jose']) {
                    features.add(FEATURE_FLAGS.HAS_JWT);
                    features.add(FEATURE_FLAGS.HAS_AUTH);
                }
                if (allDeps['passport'] || allDeps['@auth/core']) {
                    features.add(FEATURE_FLAGS.HAS_AUTH);
                    features.add(FEATURE_FLAGS.HAS_OAUTH);
                }
                if (allDeps['bcrypt'] || allDeps['bcryptjs'] || allDeps['argon2']) {
                    features.add(FEATURE_FLAGS.HAS_AUTH);
                }
                // State Management
                if (allDeps['zustand'] || allDeps['redux'] || allDeps['@reduxjs/toolkit'] ||
                    allDeps['mobx'] || allDeps['jotai'] || allDeps['recoil']) {
                    features.add(FEATURE_FLAGS.HAS_STATE_MGMT);
                }
                // Quality
                if (allDeps['typescript'])
                    features.add(FEATURE_FLAGS.HAS_TYPES);
                if (allDeps['eslint'] || allDeps['biome'])
                    features.add(FEATURE_FLAGS.HAS_LINTING);
                if (allDeps['jest'] || allDeps['vitest'] || allDeps['mocha']) {
                    features.add(FEATURE_FLAGS.HAS_TESTS);
                }
                // CLI
                if (pkg.bin) {
                    features.add('has_bin');
                }
            }
            catch (e) {
                // Invalid JSON, skip
            }
        }
        // === requirements.txt (Python) ===
        const reqPath = path.join(repoPath, 'requirements.txt');
        if (fs.existsSync(reqPath)) {
            const content = fs.readFileSync(reqPath, 'utf-8');
            if (content.includes('fastapi') || content.includes('flask') || content.includes('django')) {
                features.add(FEATURE_FLAGS.HAS_REST_API);
            }
            if (content.includes('sqlalchemy') || content.includes('django')) {
                features.add(FEATURE_FLAGS.HAS_ORM);
                features.add(FEATURE_FLAGS.HAS_SQL_DB);
            }
        }
        // === Cargo.toml (Rust) ===
        const cargoPath = path.join(repoPath, 'Cargo.toml');
        if (fs.existsSync(cargoPath)) {
            const content = fs.readFileSync(cargoPath, 'utf-8');
            if (content.includes('[[bin]]')) {
                features.add('has_bin');
            }
        }
    }
    /**
     * Detect directory structure patterns
     */
    async detectStructure(repoPath) {
        const exists = (p) => fs.existsSync(path.join(repoPath, p));
        return {
            hasBackend: exists('src/server') || exists('backend') || exists('api') ||
                exists('src/handlers') || exists('src/routes') || exists('src/controllers') ||
                exists('src/api') || exists('server'),
            hasFrontend: exists('src/components') || exists('frontend') || exists('app') ||
                exists('pages') || exists('src/views') || exists('src/ui') ||
                exists('src/app') || exists('components') || exists('src/client') || exists('client'),
            hasTests: exists('tests') || exists('__tests__') || exists('test') ||
                exists('spec') || exists('src/__tests__') || exists('e2e') ||
                exists('cypress') || exists('playwright'),
            hasDocs: exists('docs') || exists('documentation') || exists('doc'),
            hasDocker: exists('Dockerfile') || exists('docker-compose.yml') ||
                exists('docker-compose.yaml') || exists('.docker'),
            hasCICD: exists('.github/workflows') || exists('.gitlab-ci.yml') ||
                exists('Jenkinsfile') || exists('.circleci') ||
                exists('azure-pipelines.yml') || exists('bitbucket-pipelines.yml'),
            isMonorepo: exists('packages') || exists('apps') || exists('libs') ||
                exists('workspaces') || exists('pnpm-workspace.yaml') ||
                exists('lerna.json') || exists('nx.json') || exists('turbo.json')
        };
    }
    /**
     * Detect programming languages from file extensions
     */
    async detectLanguages(repoPath, languages) {
        const extensionMap = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.mjs': 'javascript',
            '.cjs': 'javascript',
            '.py': 'python',
            '.rs': 'rust',
            '.go': 'go',
            '.java': 'java',
            '.kt': 'kotlin',
            '.rb': 'ruby',
            '.php': 'php',
            '.cs': 'csharp',
            '.swift': 'swift',
            '.vue': 'vue',
            '.svelte': 'svelte',
        };
        // Recursive scan with depth limit
        const scanDir = (dir, depth = 0) => {
            if (depth > 3)
                return; // Max depth for performance
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    // Skip hidden dirs, node_modules, and common non-source dirs
                    if (entry.name.startsWith('.') ||
                        entry.name === 'node_modules' ||
                        entry.name === 'dist' ||
                        entry.name === 'build' ||
                        entry.name === 'coverage' ||
                        entry.name === 'vendor') {
                        continue;
                    }
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        scanDir(fullPath, depth + 1);
                    }
                    else {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (extensionMap[ext]) {
                            languages.add(extensionMap[ext]);
                        }
                    }
                }
            }
            catch {
                // Ignore permission errors
            }
        };
        scanDir(repoPath);
    }
    /**
     * Detect features from code patterns in key files
     */
    async detectPatterns(repoPath, features) {
        const checkFileContent = (filePath, patterns) => {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                for (const [regex, flag] of patterns) {
                    if (regex.test(content)) {
                        features.add(flag);
                    }
                }
            }
            catch {
                // Ignore read errors
            }
        };
        // API patterns
        const apiPatterns = [
            [/@(Get|Post|Put|Delete|Patch)\(/i, FEATURE_FLAGS.HAS_REST_API],
            [/router\.(get|post|put|delete|patch)\(/i, FEATURE_FLAGS.HAS_REST_API],
            [/app\.(get|post|put|delete|patch)\(/i, FEATURE_FLAGS.HAS_REST_API],
            [/\.get\s*\(\s*['"`]\//, FEATURE_FLAGS.HAS_REST_API],
            [/Query|Mutation|Subscription\s*[({]/i, FEATURE_FLAGS.HAS_GRAPHQL],
            [/WebSocket|\.on\s*\(\s*['"`]message/i, FEATURE_FLAGS.HAS_WEBSOCKET],
        ];
        // Auth patterns
        const authPatterns = [
            [/authenticate|authorization|Bearer/i, FEATURE_FLAGS.HAS_AUTH],
            [/jwt\.(sign|verify|decode)/i, FEATURE_FLAGS.HAS_JWT],
            [/roles?\s*[=:]\s*\[|hasRole|canActivate|@Roles/i, FEATURE_FLAGS.HAS_RBAC],
            [/OAuth|passport|GoogleAuth|GithubAuth/i, FEATURE_FLAGS.HAS_OAUTH],
        ];
        // Key files to scan
        const keyFiles = [
            'src/index.ts', 'src/main.ts', 'src/app.ts',
            'src/server.ts', 'src/api/index.ts',
            'src/routes/index.ts', 'src/controllers/index.ts',
            'app/api/route.ts', 'pages/api/index.ts',
            'index.ts', 'main.ts', 'app.ts', 'server.ts'
        ];
        const allPatterns = [...apiPatterns, ...authPatterns];
        for (const file of keyFiles) {
            const fullPath = path.join(repoPath, file);
            if (fs.existsSync(fullPath)) {
                checkFileContent(fullPath, allPatterns);
            }
        }
        // Also scan a few levels of src directory for common patterns
        const scanSrcPatterns = (dir, depth = 0) => {
            if (depth > 2)
                return;
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.name.startsWith('.') || entry.name === 'node_modules')
                        continue;
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        scanSrcPatterns(fullPath, depth + 1);
                    }
                    else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
                        // Only check first 1000 bytes for performance
                        try {
                            const fd = fs.openSync(fullPath, 'r');
                            const buffer = Buffer.alloc(1000);
                            fs.readSync(fd, buffer, 0, 1000, 0);
                            fs.closeSync(fd);
                            const content = buffer.toString('utf-8');
                            for (const [regex, flag] of allPatterns) {
                                if (regex.test(content)) {
                                    features.add(flag);
                                }
                            }
                        }
                        catch { }
                    }
                }
            }
            catch { }
        };
        const srcPath = path.join(repoPath, 'src');
        if (fs.existsSync(srcPath)) {
            scanSrcPatterns(srcPath);
        }
    }
    /**
     * Determine the repository type based on detected features
     */
    determineRepoType(structure, features, frameworks) {
        // 1. Check for monorepo first
        if (structure.isMonorepo)
            return 'monorepo';
        // 2. Check for mobile
        if (frameworks.has('react-native') || frameworks.has('flutter') ||
            frameworks.has('expo'))
            return 'mobile';
        // 3. Check for CLI (no frontend, no backend structure, has bin)
        if (features.has('has_bin') && !structure.hasFrontend && !structure.hasBackend)
            return 'cli';
        // 4. Check fullstack
        if (structure.hasBackend && structure.hasFrontend)
            return 'fullstack';
        // 5. Determine API presence
        const hasApi = features.has(FEATURE_FLAGS.HAS_REST_API) ||
            features.has(FEATURE_FLAGS.HAS_GRAPHQL) ||
            features.has(FEATURE_FLAGS.HAS_GRPC);
        const hasDb = features.has(FEATURE_FLAGS.HAS_SQL_DB) ||
            features.has(FEATURE_FLAGS.HAS_NOSQL_DB);
        // Backend frameworks
        const hasBackendFramework = frameworks.has('express') || frameworks.has('fastify') ||
            frameworks.has('nest') || frameworks.has('hono') ||
            frameworks.has('koa');
        // 6. Backend-only
        if (structure.hasBackend || hasApi || hasDb || hasBackendFramework)
            return 'backend';
        // 7. Frontend-only
        if (structure.hasFrontend)
            return 'frontend';
        // 8. Library (no specific structure but has source)
        if (!structure.hasBackend && !structure.hasFrontend)
            return 'library';
        return 'unknown';
    }
    /**
     * Detect which package manager is used
     */
    async detectPackageManager(repoPath) {
        if (fs.existsSync(path.join(repoPath, 'pnpm-lock.yaml')))
            return 'pnpm';
        if (fs.existsSync(path.join(repoPath, 'yarn.lock')))
            return 'yarn';
        if (fs.existsSync(path.join(repoPath, 'package-lock.json')))
            return 'npm';
        if (fs.existsSync(path.join(repoPath, 'requirements.txt')))
            return 'pip';
        if (fs.existsSync(path.join(repoPath, 'Cargo.toml')))
            return 'cargo';
        return undefined;
    }
    /**
     * Find entry point files
     */
    async findEntryPoints(repoPath) {
        const candidates = [
            'src/index.ts', 'src/main.ts', 'src/app.ts', 'src/server.ts',
            'index.ts', 'main.ts', 'app.ts', 'server.ts',
            'src/index.js', 'src/main.js', 'src/app.js', 'src/server.js',
            'index.js', 'main.js', 'app.js', 'server.js',
            'main.py', 'app.py', 'src/main.py',
            'src/main.rs', 'src/lib.rs'
        ];
        return candidates.filter(f => fs.existsSync(path.join(repoPath, f)));
    }
}
//# sourceMappingURL=feature-detector.js.map