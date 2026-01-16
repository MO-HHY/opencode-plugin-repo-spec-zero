/**
 * ManifestMigrator - Utility for migrating manifest schema versions
 *
 * Handles migration from v2.0 to v2.1 manifest format.
 */
import type { SpecsManifest } from '../types.js';
/**
 * Check if manifest needs migration to v2.1
 */
export declare function needsMigration(manifest: SpecsManifest): boolean;
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
export declare function migrateManifest(manifest: SpecsManifest): SpecsManifest;
/**
 * Validate manifest structure
 */
export declare function validateManifest(manifest: SpecsManifest): {
    valid: boolean;
    errors: string[];
};
/**
 * Get recommended version bump based on changes
 */
export declare function getVersionBump(oldLocations: Record<string, string>, newLocations: Record<string, string>): 'major' | 'minor' | 'patch';
//# sourceMappingURL=manifest-migrator.d.ts.map