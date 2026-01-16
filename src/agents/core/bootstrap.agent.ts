/**
 * Bootstrap Agent - Reads key files into SharedContext
 * 
 * This is the first agent in the DAG execution chain.
 * It reads critical files like package.json, README, configs etc.
 * and populates the SharedContext for downstream agents.
 */

import { SubAgent } from '../base.js';
import type { AgentContext, AgentResult } from '../../types.js';
import { DEFAULT_KEY_FILES, type KeyFileDefinition, type RepoType } from '../../types.js';
import type { SharedContext } from '../../core/context.js';
import * as fs from 'fs';
import * as path from 'path';

export class BootstrapAgent extends SubAgent {
    readonly id = 'bootstrap';
    readonly name = 'Bootstrap Agent';
    readonly description = 'Reads key repository files into shared context for downstream agents.';
    readonly systemPrompt = 'You are a bootstrap agent that prepares context for analysis.';
    readonly triggers = [];

    // Additional files to search for beyond the defaults
    private static readonly ADDITIONAL_KEY_FILES: KeyFileDefinition[] = [
        // Entry points
        { path: 'src/index.ts', required: false, maxChars: 3000, description: 'Main entry point' },
        { path: 'src/index.js', required: false, maxChars: 3000, description: 'Main entry point' },
        { path: 'src/main.ts', required: false, maxChars: 3000, description: 'Main entry point' },
        { path: 'src/main.js', required: false, maxChars: 3000, description: 'Main entry point' },
        { path: 'server.ts', required: false, maxChars: 3000, description: 'Server entry point' },
        { path: 'server.js', required: false, maxChars: 3000, description: 'Server entry point' },
        { path: 'app.ts', required: false, maxChars: 3000, description: 'App entry point' },
        { path: 'app.js', required: false, maxChars: 3000, description: 'App entry point' },
        
        // Config files
        { path: '.eslintrc.json', required: false, maxChars: 2000, description: 'ESLint config' },
        { path: '.prettierrc', required: false, maxChars: 1000, description: 'Prettier config' },
        { path: 'jest.config.js', required: false, maxChars: 2000, description: 'Jest config' },
        { path: 'vitest.config.ts', required: false, maxChars: 2000, description: 'Vitest config' },
        
        // CI/CD
        { path: '.github/workflows/ci.yml', required: false, maxChars: 5000, description: 'GitHub CI workflow' },
        { path: '.github/workflows/main.yml', required: false, maxChars: 5000, description: 'GitHub main workflow' },
        { path: '.gitlab-ci.yml', required: false, maxChars: 5000, description: 'GitLab CI config' },
        
        // Monorepo configs
        { path: 'packages/*/package.json', required: false, maxChars: 3000, description: 'Package manifest' },
        { path: 'apps/*/package.json', required: false, maxChars: 3000, description: 'App manifest' },
    ];

    async process(context: AgentContext): Promise<AgentResult> {
        const params = context.params || {};
        const baseDir = String(params.baseDir || process.cwd());
        const repoType = String(params.repoType || 'generic') as RepoType;
        const sharedContext = params.sharedContext as SharedContext | undefined;

        if (!fs.existsSync(baseDir)) {
            return { success: false, message: `Base directory does not exist: ${baseDir}` };
        }

        try {
            const filesLoaded: string[] = [];
            const filesFailed: string[] = [];
            const summary: string[] = [];

            // Get key files for this repo type
            const keyFiles = this.getKeyFilesForType(repoType);

            console.log(`[Bootstrap] Loading key files for ${repoType} repo from ${baseDir}`);

            for (const fileDef of keyFiles) {
                // Handle glob patterns (simple * matching)
                if (fileDef.path.includes('*')) {
                    const loadedGlob = await this.loadGlobPattern(baseDir, fileDef, sharedContext);
                    filesLoaded.push(...loadedGlob);
                    continue;
                }

                const fullPath = path.join(baseDir, fileDef.path);
                
                if (fs.existsSync(fullPath)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        const maxChars = fileDef.maxChars || 5000;
                        
                        if (sharedContext) {
                            sharedContext.addKeyFile(fileDef.path, content, maxChars);
                        }
                        
                        filesLoaded.push(fileDef.path);
                        
                        // Add to summary for output
                        const truncated = content.length > maxChars ? ` (truncated to ${maxChars} chars)` : '';
                        summary.push(`- **${fileDef.path}**: ${fileDef.description}${truncated}`);
                        
                        console.log(`[Bootstrap] Loaded: ${fileDef.path} (${content.length} chars)`);
                    } catch (e: any) {
                        filesFailed.push(`${fileDef.path}: ${e.message}`);
                        console.warn(`[Bootstrap] Failed to read ${fileDef.path}: ${e.message}`);
                    }
                } else if (fileDef.required) {
                    filesFailed.push(`${fileDef.path}: File not found (required)`);
                    console.warn(`[Bootstrap] Required file not found: ${fileDef.path}`);
                }
            }

            // Try to detect and load additional key files based on structure
            const detected = await this.detectAdditionalFiles(baseDir, repoType, sharedContext);
            filesLoaded.push(...detected);

            // Generate output summary
            const outputSummary = `
## Bootstrap Summary

**Repository Type:** ${repoType}
**Base Directory:** ${baseDir}
**Files Loaded:** ${filesLoaded.length}
**Files Failed:** ${filesFailed.length}

### Loaded Files
${summary.join('\n') || '(none)'}

### Failed Files
${filesFailed.map(f => `- ${f}`).join('\n') || '(none)'}

### Additional Detection
${detected.map(f => `- ${f}`).join('\n') || '(none detected)'}
`.trim();

            return {
                success: true,
                data: {
                    output: outputSummary,
                    summary: `Loaded ${filesLoaded.length} key files for ${repoType} analysis`,
                    filesLoaded,
                    filesFailed,
                    promptVersion: { id: 'bootstrap', version: '1', hash: 'native' }
                },
                message: `Bootstrap complete: loaded ${filesLoaded.length} files`
            };

        } catch (error: any) {
            return { success: false, message: `Bootstrap failed: ${error.message}` };
        }
    }

    /**
     * Get key files for a specific repo type
     */
    private getKeyFilesForType(repoType: RepoType): KeyFileDefinition[] {
        const generic = DEFAULT_KEY_FILES.generic || [];
        const typeSpecific = DEFAULT_KEY_FILES[repoType] || [];
        const additional = BootstrapAgent.ADDITIONAL_KEY_FILES;

        // Merge and dedupe by path
        const all = [...generic, ...typeSpecific, ...additional];
        const seen = new Set<string>();
        return all.filter(f => {
            if (seen.has(f.path)) return false;
            seen.add(f.path);
            return true;
        });
    }

    /**
     * Load files matching a simple glob pattern
     */
    private async loadGlobPattern(
        baseDir: string,
        fileDef: KeyFileDefinition,
        sharedContext: SharedContext | undefined
    ): Promise<string[]> {
        const loaded: string[] = [];
        const pattern = fileDef.path;
        
        // Simple glob handling: split by * and check directories
        const parts = pattern.split('*');
        if (parts.length !== 2) return loaded;

        const prefix = parts[0].replace(/\/$/, '');
        const suffix = parts[1].replace(/^\//, '');
        
        const prefixPath = path.join(baseDir, prefix);
        if (!fs.existsSync(prefixPath)) return loaded;

        try {
            const dirs = fs.readdirSync(prefixPath, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name);

            for (const dir of dirs.slice(0, 10)) { // Limit to 10 matches
                const fullPath = path.join(prefixPath, dir, suffix);
                const relativePath = path.join(prefix, dir, suffix);
                
                if (fs.existsSync(fullPath)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        if (sharedContext) {
                            sharedContext.addKeyFile(relativePath, content, fileDef.maxChars || 3000);
                        }
                        loaded.push(relativePath);
                        console.log(`[Bootstrap] Loaded (glob): ${relativePath}`);
                    } catch (e) {
                        console.warn(`[Bootstrap] Failed to read ${relativePath}`);
                    }
                }
            }
        } catch (e) {
            console.warn(`[Bootstrap] Failed to scan ${prefixPath}`);
        }

        return loaded;
    }

    /**
     * Detect and load additional important files based on repo structure
     */
    private async detectAdditionalFiles(
        baseDir: string,
        repoType: RepoType,
        sharedContext: SharedContext | undefined
    ): Promise<string[]> {
        const detected: string[] = [];

        // Detect schema files
        const schemaPatterns = [
            'prisma/schema.prisma',
            'drizzle/*.ts',
            'schema/*.graphql',
            'graphql/*.graphql',
            'src/schema/*.ts',
            'db/schema.ts',
        ];

        for (const pattern of schemaPatterns) {
            if (pattern.includes('*')) {
                const loaded = await this.loadGlobPattern(baseDir, {
                    path: pattern,
                    required: false,
                    maxChars: 10000,
                    description: 'Schema file'
                }, sharedContext);
                detected.push(...loaded);
            } else {
                const fullPath = path.join(baseDir, pattern);
                if (fs.existsSync(fullPath)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        if (sharedContext) {
                            sharedContext.addKeyFile(pattern, content, 10000);
                        }
                        detected.push(pattern);
                        console.log(`[Bootstrap] Detected: ${pattern}`);
                    } catch (e) {
                        // ignore
                    }
                }
            }
        }

        // Detect API route files for backend/fullstack
        if (repoType === 'backend' || repoType === 'fullstack') {
            const apiPatterns = [
                'src/routes/index.ts',
                'src/api/index.ts',
                'routes/index.js',
                'api/index.js',
            ];

            for (const pattern of apiPatterns) {
                const fullPath = path.join(baseDir, pattern);
                if (fs.existsSync(fullPath)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        if (sharedContext) {
                            sharedContext.addKeyFile(pattern, content, 5000);
                        }
                        detected.push(pattern);
                    } catch (e) {
                        // ignore
                    }
                }
            }
        }

        return detected;
    }
}
