/**
 * StructureBuilderAgent - Pre-write folder structure initialization
 *
 * Layer 8.5 agent that runs after summary but before write-specs.
 * Responsibilities:
 * - Ensure _generated/ subdirectories exist
 * - Create _templates/ and _diagrams/ if needed
 * - Validate folder structure matches schema version
 *
 * Only runs in GENERATION mode (first-time analysis).
 */
import { SubAgent } from '../../base.js';
import { GENERATED_SUBDIRS, SPECS_FOLDER_STRUCTURE } from '../../../types.js';
import * as fs from 'fs';
import * as path from 'path';
export class StructureBuilderAgent extends SubAgent {
    id = 'structure_builder';
    name = 'Structure Builder Agent';
    description = 'Initializes folder structure for specs output in v2.1.0 hierarchical format.';
    systemPrompt = 'You are the folder structure builder for spec generation.';
    triggers = [];
    async process(context) {
        const params = context.params || {};
        const baseDir = String(params.baseDir || process.cwd());
        const specsFolder = String(params.specsFolder || 'specs');
        const repoType = String(params.repoType || 'generic');
        const mode = params.mode;
        // Skip in audit mode
        if (mode === 'audit') {
            return {
                success: true,
                message: 'StructureBuilder skipped in audit mode',
                data: { skipped: true }
            };
        }
        const specsPath = path.join(baseDir, specsFolder);
        const generatedPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.GENERATED);
        try {
            console.log(`[StructureBuilder] Initializing folder structure at ${specsPath}`);
            const subdirectoriesCreated = [];
            // 1. Ensure base specs folder exists
            if (!fs.existsSync(specsPath)) {
                fs.mkdirSync(specsPath, { recursive: true });
            }
            // 2. Ensure _generated folder exists
            if (!fs.existsSync(generatedPath)) {
                fs.mkdirSync(generatedPath, { recursive: true });
            }
            // 3. Create all subdirectories from GENERATED_SUBDIRS
            for (const subdir of Object.values(GENERATED_SUBDIRS)) {
                const subdirPath = path.join(generatedPath, subdir);
                if (!fs.existsSync(subdirPath)) {
                    fs.mkdirSync(subdirPath, { recursive: true });
                    // Create .gitkeep to preserve empty directories
                    fs.writeFileSync(path.join(subdirPath, '.gitkeep'), '');
                    subdirectoriesCreated.push(subdir);
                    console.log(`[StructureBuilder] Created: ${subdir}/`);
                }
            }
            // 4. Create dynamic substructure for modules based on repoType
            if (repoType === 'fullstack' || repoType === 'monorepo') {
                const modulesPath = path.join(generatedPath, GENERATED_SUBDIRS.MODULES);
                for (const sub of ['backend', 'frontend']) {
                    const subPath = path.join(modulesPath, sub);
                    if (!fs.existsSync(subPath)) {
                        fs.mkdirSync(subPath, { recursive: true });
                        fs.writeFileSync(path.join(subPath, '.gitkeep'), '');
                        subdirectoriesCreated.push(`${GENERATED_SUBDIRS.MODULES}/${sub}`);
                        console.log(`[StructureBuilder] Created: ${GENERATED_SUBDIRS.MODULES}/${sub}/`);
                    }
                }
            }
            // 5. Create _templates folder
            const templatesPath = path.join(specsPath, '_templates');
            if (!fs.existsSync(templatesPath)) {
                fs.mkdirSync(templatesPath, { recursive: true });
                fs.writeFileSync(path.join(templatesPath, '.gitkeep'), '');
                console.log('[StructureBuilder] Created: _templates/');
            }
            // 6. Create domains and contracts folders (user-managed)
            for (const folder of ['domains', 'contracts']) {
                const folderPath = path.join(specsPath, folder);
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: true });
                    fs.writeFileSync(path.join(folderPath, '.gitkeep'), '');
                    console.log(`[StructureBuilder] Created: ${folder}/`);
                }
            }
            const result = {
                specsPath,
                repoType,
                structureCreated: true,
                subdirectoriesCreated,
            };
            return {
                success: true,
                message: `Folder structure initialized: ${subdirectoriesCreated.length} directories created`,
                data: {
                    ...result,
                    promptVersion: {
                        id: 'structure_builder',
                        version: '1',
                        hash: 'native'
                    },
                }
            };
        }
        catch (error) {
            console.error(`[StructureBuilder] Failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: `Failed to initialize structure: ${error.message}`
            };
        }
    }
}
//# sourceMappingURL=structure-builder.agent.js.map