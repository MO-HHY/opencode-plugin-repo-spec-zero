/**
 * WriteSpecsAgent - Generation Mode Finalizer
 *
 * Layer 9 agent that runs after summary in GENERATION mode.
 * Responsibilities:
 * - Write all agent outputs to _generated/ folder
 * - Create initial manifest with v1.0.0
 * - Generate index.md with AUTO/MANUAL sections
 * - Prepare for commit-push agent
 *
 * Only runs in GENERATION mode (first-time analysis).
 */
import { SubAgent } from '../../base.js';
import { SubmoduleManager } from '../../../skills/submodule-manager.skill.js';
import { SPECS_FOLDER_STRUCTURE, INDEX_DELIMITERS, AGENT_TO_SUBDIR_MAP, AGENT_TO_FILENAME_MAP } from '../../../types.js';
import { generateFrontmatter } from '../../../prompts/output-schema.js';
import * as fs from 'fs';
import * as path from 'path';
/**
 * v2.1.0: Build full path from agent ID using hierarchical structure
 */
function getAgentOutputPath(agentId) {
    const subdir = AGENT_TO_SUBDIR_MAP[agentId];
    const filename = AGENT_TO_FILENAME_MAP[agentId];
    if (!subdir || !filename) {
        return undefined;
    }
    return `${subdir}/${filename}`;
}
/**
 * WriteSpecsAgent - Generation Mode Finalizer
 */
const AGENT_TO_FILE_MAP = Object.fromEntries(Object.keys(AGENT_TO_SUBDIR_MAP).map(agentId => [
    agentId,
    getAgentOutputPath(agentId) || ''
]).filter(([, path]) => path !== ''));
export class WriteSpecsAgent extends SubAgent {
    id = 'write_specs';
    name = 'Write Specs Agent';
    description = 'Writes all generated specs to the _generated folder in GENERATION mode.';
    systemPrompt = 'You are the specs writer agent for generation mode.';
    triggers = [];
    submoduleManager = null;
    /**
     * Get or create SubmoduleManager instance
     */
    getSubmoduleManager(logger) {
        if (!this.submoduleManager) {
            this.submoduleManager = new SubmoduleManager(logger);
        }
        return this.submoduleManager;
    }
    async process(context) {
        const params = context.params || {};
        const projectSlug = String(params.projectSlug || 'unknown-repo');
        const baseDir = String(params.baseDir || process.cwd());
        const repoType = params.repoType || 'generic';
        const specsFolder = String(params.specsFolder || 'specs');
        const pluginVersion = String(params.pluginVersion || '2.0.0');
        const sharedContext = params.sharedContext;
        const allResults = params.allResults || {};
        // Mode check - only run in generation mode
        const mode = params.mode;
        if (mode === 'audit') {
            return {
                success: true,
                message: 'WriteSpecsAgent skipped in audit mode',
                data: { skipped: true }
            };
        }
        // Logger
        const logger = {
            info: (msg) => console.log(`[WriteSpecs] ${msg}`),
            error: (msg) => console.error(`[WriteSpecs] ${msg}`),
            warn: (msg) => console.warn(`[WriteSpecs] ${msg}`),
        };
        const manager = this.getSubmoduleManager(logger);
        const specsPath = path.join(baseDir, specsFolder);
        try {
            logger.info(`Writing specs to ${specsPath}/_generated/`);
            // 1. Collect all agent outputs
            const agentOutputs = this.collectAgentOutputs(sharedContext, allResults);
            logger.info(`Collected ${agentOutputs.size} agent outputs`);
            // 2. Ensure _generated directory exists
            const generatedPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.GENERATED);
            if (!fs.existsSync(generatedPath)) {
                fs.mkdirSync(generatedPath, { recursive: true });
            }
            // 3. Write each agent output to corresponding file
            const filesWritten = [];
            for (const [agentId, output] of agentOutputs) {
                const relativePath = getAgentOutputPath(agentId);
                if (relativePath) {
                    await manager.writeSpec(specsPath, relativePath, output);
                    filesWritten.push(relativePath); // Full hierarchical path
                    logger.info(`Wrote: ${relativePath}`);
                }
            }
            // 3b. Write standalone diagrams (v2.1.0)
            const diagrams = sharedContext?.getAllDiagrams() || [];
            if (diagrams.length > 0) {
                logger.info(`Writing ${diagrams.length} standalone diagrams`);
                for (const diagram of diagrams) {
                    await manager.writeSpec(specsPath, diagram.path, diagram.content);
                    filesWritten.push(diagram.path);
                    logger.info(`Wrote diagram: ${diagram.path}`);
                }
            }
            // 4. Generate and write index.md
            const indexContent = this.generateIndex(projectSlug, repoType, agentOutputs);
            await manager.writeIndex(specsPath, indexContent);
            filesWritten.push('index.md');
            logger.info('Wrote: index.md');
            // 5. Get repo info for manifest
            const repoSha = await manager.getCommitSha(baseDir);
            const repoBranch = await manager.getBranch(baseDir);
            const repoUrl = await manager.getRemoteUrl(baseDir);
            // 6. Read or create manifest
            let manifest = await manager.readManifest(specsPath);
            if (!manifest) {
                // Should have been created by SubmoduleCheckAgent, but create if missing
                const specsConfig = await manager.getSubmoduleConfig(baseDir, specsFolder);
                manifest = manager.createInitialManifest(projectSlug, repoUrl, specsConfig?.remoteUrl || '', pluginVersion);
            }
            // 7. Create analysis entry for v1.0.0
            const analysisEntry = {
                version: '1.0.0',
                type: 'generation',
                date: new Date().toISOString(),
                repo_sha: repoSha,
                repo_branch: repoBranch,
                specs_sha: '', // Will be updated after commit
                plugin_version: pluginVersion,
                agents_run: agentOutputs.size,
                agents_succeeded: agentOutputs.size,
                files_generated: filesWritten,
                summary: `Initial generation: ${filesWritten.length} spec files created`,
            };
            // 8. Update manifest
            manifest = manager.addAnalysisEntry(manifest, analysisEntry);
            await manager.writeManifest(specsPath, manifest);
            logger.info('Updated manifest with v1.0.0');
            // 9. Build result
            const summary = this.buildSummary(filesWritten, projectSlug);
            const result = {
                filesWritten,
                version: '1.0.0',
                specsPath,
                summary,
            };
            return {
                success: true,
                data: {
                    ...result,
                    output: summary,
                    promptVersion: { id: 'finalizer/write', version: '2', hash: 'native' },
                },
                message: `Generated ${filesWritten.length} spec files as v1.0.0`
            };
        }
        catch (error) {
            logger.error(`WriteSpecs failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: `Failed to write specs: ${error.message}`
            };
        }
    }
    /**
     * Collect outputs from all analysis agents
     */
    collectAgentOutputs(sharedContext, allResults) {
        const outputs = new Map();
        if (sharedContext) {
            // Use SharedContext
            for (const agentId of sharedContext.getExecutedAgentIds()) {
                // Skip non-analysis agents
                if (['bootstrap', 'submodule_check', 'summary', 'write_specs', 'commit_push'].includes(agentId)) {
                    continue;
                }
                const fullContent = sharedContext.getFullContent(agentId);
                if (fullContent) {
                    outputs.set(agentId, fullContent);
                }
            }
        }
        else {
            // Fallback to allResults
            for (const [agentId, result] of Object.entries(allResults)) {
                if (['bootstrap', 'submodule_check', 'summary', 'write_specs', 'commit_push'].includes(agentId)) {
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
     * Generate index.md with AUTO and MANUAL sections
     */
    generateIndex(projectSlug, repoType, agentOutputs) {
        const today = new Date().toISOString().split('T')[0];
        // Frontmatter
        const frontmatter = {
            uid: `${projectSlug}:spec:index`,
            title: `${projectSlug} Specifications`,
            status: 'draft',
            version: '1.0.0',
            created: today,
            prompt_version: 'index@v2',
            tags: ['spec', 'index'],
        };
        // Build AUTO section
        const autoSection = this.buildAutoSection(projectSlug, repoType, agentOutputs, today);
        // Build MANUAL section (template)
        const manualSection = this.buildManualSection(projectSlug);
        // Compose full index
        return `${generateFrontmatter(frontmatter)}

${INDEX_DELIMITERS.AUTO_START}

${autoSection}

${INDEX_DELIMITERS.AUTO_END}

${INDEX_DELIMITERS.MANUAL_START}

${manualSection}

${INDEX_DELIMITERS.MANUAL_END}
`;
    }
    /**
     * Build the auto-generated section of index.md
     * v2.1.0: Organized by hierarchical folders
     */
    buildAutoSection(projectSlug, repoType, agentOutputs, date) {
        let section = `## Project Overview

- **Name:** ${projectSlug}
- **Type:** ${this.formatRepoType(repoType)}
- **Generated:** ${date}
- **Specs Version:** 1.0.0

## Generated Specifications

`;
        // v2.1.0: Organize by folder sections
        const folderSections = [
            {
                folder: '00-foundation',
                title: '🏛 Foundation',
                icon: '🏛',
                agents: ['overview']
            },
            {
                folder: '01-domain',
                title: '📦 Domain',
                icon: '📦',
                agents: ['entity', 'event']
            },
            {
                folder: '02-modules',
                title: '🧩 Modules',
                icon: '🧩',
                agents: ['module']
            },
            {
                folder: '03-api',
                title: '🔌 API',
                icon: '🔌',
                agents: ['api']
            },
            {
                folder: '04-data',
                title: '💾 Data',
                icon: '💾',
                agents: ['db', 'data_map']
            },
            {
                folder: '05-auth',
                title: '🔐 Auth & Security',
                icon: '🔐',
                agents: ['auth', 'authz', 'security', 'prompt_sec']
            },
            {
                folder: '06-integration',
                title: '🔗 Integration',
                icon: '🔗',
                agents: ['dependency', 'service_dep']
            },
            {
                folder: '07-ops',
                title: '⚙️ Operations',
                icon: '⚙️',
                agents: ['deployment', 'monitor', 'ml', 'flag']
            },
        ];
        for (const { folder, title, agents } of folderSections) {
            // Check if any agents in this section were generated
            const generatedAgents = agents.filter(a => agentOutputs.has(a));
            if (generatedAgents.length === 0)
                continue;
            section += `### ${title}\n\n`;
            section += `| Spec | Description | Status |\n`;
            section += `|------|-------------|--------|\n`;
            for (const agentId of generatedAgents) {
                const filePath = getAgentOutputPath(agentId);
                if (filePath) {
                    const title = this.formatAgentTitle(agentId);
                    const desc = this.getAgentDescription(agentId);
                    section += `| [${title}](_generated/${filePath}) | ${desc} | Generated |\n`;
                }
            }
            section += '\n';
        }
        return section;
    }
    /**
     * Build the manual section template
     */
    buildManualSection(projectSlug) {
        return `## Domain Specifications

*Add your domain-specific documentation here. These files in \`domains/\` are never modified by Spec-Zero.*

| Domain | Owner | Status |
|--------|-------|--------|
| [Example Domain](domains/example-domain.md) | @team | Draft |

## Project Notes

Add custom notes, decisions, and documentation here. Spec-Zero will preserve this section across updates.

## Links

- Repository: *Add link*
- Documentation: *Add link*
- Issue Tracker: *Add link*`;
    }
    /**
     * Format repo type for display
     */
    formatRepoType(repoType) {
        const formats = {
            'frontend': 'Frontend Application',
            'backend': 'Backend Service',
            'fullstack': 'Fullstack Application',
            'library': 'Library/Package',
            'mobile': 'Mobile Application',
            'infra-as-code': 'Infrastructure as Code',
            'monorepo': 'Monorepo',
            'generic': 'Generic Project',
        };
        return formats[repoType] || repoType;
    }
    /**
     * Format agent ID to title
     */
    formatAgentTitle(agentId) {
        const titles = {
            'overview': 'Overview',
            'module': 'Modules',
            'entity': 'Core Entities',
            'db': 'Database',
            'data_map': 'Data Mapping',
            'event': 'Events',
            'api': 'APIs',
            'dependency': 'Dependencies',
            'service_dep': 'Service Dependencies',
            'auth': 'Authentication',
            'authz': 'Authorization',
            'security': 'Security',
            'prompt_sec': 'Prompt Security',
            'deployment': 'Deployment',
            'monitor': 'Monitoring',
            'ml': 'ML Services',
            'flag': 'Feature Flags',
        };
        return titles[agentId] || agentId;
    }
    /**
     * Get agent description for index
     */
    getAgentDescription(agentId) {
        const descriptions = {
            'overview': 'High-level architecture overview',
            'module': 'Module structure and responsibilities',
            'entity': 'Core domain entities',
            'db': 'Database schema and design',
            'data_map': 'Data flow and transformations',
            'event': 'Event-driven patterns',
            'api': 'API endpoints and contracts',
            'dependency': 'External dependencies',
            'service_dep': 'Service-to-service dependencies',
            'auth': 'Authentication mechanisms',
            'authz': 'Authorization and permissions',
            'security': 'Security analysis',
            'prompt_sec': 'LLM/Prompt security',
            'deployment': 'Deployment configuration',
            'monitor': 'Monitoring and observability',
            'ml': 'ML/AI services',
            'flag': 'Feature flags and configuration',
        };
        return descriptions[agentId] || 'Analysis results';
    }
    /**
     * Build human-readable summary
     */
    buildSummary(filesWritten, projectSlug) {
        return `## Write Specs Summary

**Project:** ${projectSlug}
**Version:** 1.0.0 (Initial Generation)
**Files Written:** ${filesWritten.length}

### Generated Files

${filesWritten.map(f => `- \`_generated/${f}\``).join('\n')}

### Next Steps

The specs have been written to the \`_generated/\` folder. 
The commit-push agent will now commit and push these changes.

After this initial generation, subsequent \`analyze\` runs will operate in 
**AUDIT mode**, generating only an AUDIT_REPORT.md without modifying existing specs.`;
    }
}
//# sourceMappingURL=write-specs.agent.js.map