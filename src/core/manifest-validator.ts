import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { 
    SpecsManifest, 
    ValidationResult
} from '../types';

/**
 * Validates and repairs SpecsManifest files
 */
export class ManifestValidator {
    /**
     * Validates manifest against schema
     */
    validate(manifest: any): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!manifest) {
            return { valid: false, errors: ['Manifest is empty'], warnings: [] };
        }

        // Base schema for common fields
        const BaseSchema = z.object({
            schema_version: z.string(),
            project: z.object({
                name: z.string(),
                repo_url: z.string(),
                specs_repo_url: z.string(),
                created: z.string(),
            }),
            current_version: z.string(),
            mode: z.string(),
            pending_audit: z.boolean()
        });

        try {
            BaseSchema.parse(manifest);
            
            // Refined version checks
            if (manifest.schema_version !== '2.0' && manifest.schema_version !== '2.1') {
                errors.push('schema_version must be 2.0 or 2.1');
            }
            
            if (manifest.mode !== 'generation' && manifest.mode !== 'audit') {
                errors.push('mode must be generation or audit');
            }

            // v2.1 specific checks
            if (manifest.schema_version === '2.1') {
                if (manifest.folder_structure_version && 
                    manifest.folder_structure_version !== '1.0' && 
                    manifest.folder_structure_version !== '2.0') {
                    errors.push('folder_structure_version must be 1.0 or 2.0');
                }
                
                if (manifest.structure_hash && !/^[a-f0-9]{8}$/.test(manifest.structure_hash)) {
                    errors.push('structure_hash must be an 8-character hex string');
                }

                if (!manifest.file_locations) {
                    warnings.push('Manifest v2.1 should ideally contain file_locations');
                }
            }

        } catch (error) {
            if (error instanceof z.ZodError) {
                const issues = (error as any).issues || (error as any).errors || [];
                issues.forEach((err: any) => {
                    errors.push(`${err.path.join('.')}: ${err.message}`);
                });
            } else {
                errors.push('Schema validation failed');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validates that all files listed in manifest exist on disk
     */
    validateFileLocations(manifest: SpecsManifest, specsPath: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!manifest.file_locations) {
            return { valid: true, errors: [], warnings: [] };
        }

        for (const [agentId, relativePath] of Object.entries(manifest.file_locations)) {
            const fullPath = path.join(specsPath, '_generated', relativePath);
            if (!fs.existsSync(fullPath)) {
                errors.push(`File for agent "${agentId}" not found at: ${relativePath}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Repairs common issues in manifest
     */
    repairManifest(manifest: any): SpecsManifest {
        const repaired = { ...manifest };

        // Ensure mandatory arrays exist
        if (!repaired.analyses) repaired.analyses = [];
        if (!repaired.audits) repaired.audits = [];

        // Set default version if missing
        if (!repaired.schema_version) repaired.schema_version = '2.0';

        // Ensure project info structure
        if (!repaired.project) {
            repaired.project = {
                name: 'Unknown Project',
                repo_url: '',
                specs_repo_url: '',
                created: new Date().toISOString()
            };
        }

        return repaired as SpecsManifest;
    }
}
