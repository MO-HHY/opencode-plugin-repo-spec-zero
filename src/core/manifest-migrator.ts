/**
 * ManifestMigrator - Utility for migrating manifest schema versions
 * 
 * Handles migration from v2.0 to v2.1 manifest format.
 */

import * as crypto from 'crypto';
import type { SpecsManifest } from '../types.js';
import { AGENT_TO_SUBDIR_MAP, AGENT_TO_FILENAME_MAP, GENERATED_SUBDIRS } from '../types.js';

/**
 * Check if manifest needs migration to v2.1
 */
export function needsMigration(manifest: SpecsManifest): boolean {
    return manifest.schema_version === '2.0';
}

/**
 * Migrate manifest from v2.0 to v2.1
 * 
 * Adds new fields:
 * - folder_structure_version
 * - structure_hash
 * - file_locations
 * 
 * Idempotent: safe to call on already-migrated manifest
 */
export function migrateManifest(manifest: SpecsManifest): SpecsManifest {
    // Already v2.1, return as-is
    if (manifest.schema_version === '2.1') {
        return manifest;
    }
    
    // Build file locations from existing analyses
    const fileLocations = buildFileLocations(manifest);
    
    // Calculate structure hash
    const structureHash = calculateStructureHash(fileLocations);
    
    // Return migrated manifest
    return {
        ...manifest,
        schema_version: '2.1',
        folder_structure_version: '2.0',
        structure_hash: structureHash,
        file_locations: fileLocations,
    };
}

/**
 * Build file locations mapping from manifest analysis entries
 * Maps agent IDs to their new hierarchical file paths
 */
function buildFileLocations(manifest: SpecsManifest): Record<string, string> {
    const locations: Record<string, string> = {};
    
    // Get files from latest analysis if available
    const latestAnalysis = manifest.analyses?.[manifest.analyses.length - 1];
    const generatedFiles = latestAnalysis?.files_generated || [];
    
    // Build locations for each known agent
    for (const [agentId, subdir] of Object.entries(AGENT_TO_SUBDIR_MAP)) {
        const filename = AGENT_TO_FILENAME_MAP[agentId];
        if (filename) {
            locations[agentId] = `${subdir}/${filename}`;
        }
    }
    
    // Also map any files from previous analysis that might use old flat structure
    for (const file of generatedFiles) {
        const agentId = findAgentIdByFilename(file);
        if (agentId && !locations[agentId]) {
            const subdir = AGENT_TO_SUBDIR_MAP[agentId];
            const filename = AGENT_TO_FILENAME_MAP[agentId];
            if (subdir && filename) {
                locations[agentId] = `${subdir}/${filename}`;
            }
        }
    }
    
    return locations;
}

/**
 * Find agent ID by old filename (for migration from flat structure)
 */
function findAgentIdByFilename(filename: string): string | undefined {
    // Remove path and get just filename
    const baseName = filename.replace(/^.*[\\/]/, '');
    
    // Map old filenames to agent IDs
    const oldFilenameMap: Record<string, string> = {
        'overview.md': 'overview',
        'module.md': 'module',
        'entity.md': 'entity',
        'database.md': 'db',
        'data_mapping.md': 'data_map',
        'events.md': 'event',
        'api.md': 'api',
        'dependencies.md': 'dependency',
        'service_dependencies.md': 'service_dep',
        'authentication.md': 'auth',
        'authorization.md': 'authz',
        'security.md': 'security',
        'prompt_security.md': 'prompt_sec',
        'deployment.md': 'deployment',
        'monitoring.md': 'monitor',
        'ml_services.md': 'ml',
        'feature_flags.md': 'flag',
    };
    
    return oldFilenameMap[baseName];
}

/**
 * Calculate hash of folder structure for drift detection
 * Uses sorted keys to ensure deterministic output
 */
function calculateStructureHash(locations: Record<string, string>): string {
    const sortedKeys = Object.keys(locations).sort();
    const structureString = sortedKeys.map(k => `${k}:${locations[k]}`).join('|');
    return crypto.createHash('sha256').update(structureString).digest('hex').slice(0, 12);
}

/**
 * Validate manifest structure
 */
export function validateManifest(manifest: SpecsManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!manifest.schema_version) {
        errors.push('Missing schema_version');
    }
    
    if (!manifest.project) {
        errors.push('Missing project information');
    }
    
    if (!manifest.current_version) {
        errors.push('Missing current_version');
    }
    
    if (!manifest.mode) {
        errors.push('Missing mode');
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get recommended version bump based on changes
 */
export function getVersionBump(
    oldLocations: Record<string, string>,
    newLocations: Record<string, string>
): 'major' | 'minor' | 'patch' {
    const oldKeys = new Set(Object.keys(oldLocations));
    const newKeys = new Set(Object.keys(newLocations));
    
    // Check for removed files (breaking change)
    for (const key of oldKeys) {
        if (!newKeys.has(key)) {
            return 'major';
        }
    }
    
    // Check for added files
    for (const key of newKeys) {
        if (!oldKeys.has(key)) {
            return 'minor';
        }
    }
    
    // Check for path changes
    for (const key of oldKeys) {
        if (oldLocations[key] !== newLocations[key]) {
            return 'minor';
        }
    }
    
    return 'patch';
}
