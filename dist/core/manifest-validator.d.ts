import { SpecsManifest, ValidationResult } from '../types';
/**
 * Validates and repairs SpecsManifest files
 */
export declare class ManifestValidator {
    /**
     * Validates manifest against schema
     */
    validate(manifest: any): ValidationResult;
    /**
     * Validates that all files listed in manifest exist on disk
     */
    validateFileLocations(manifest: SpecsManifest, specsPath: string): ValidationResult;
    /**
     * Repairs common issues in manifest
     */
    repairManifest(manifest: any): SpecsManifest;
}
//# sourceMappingURL=manifest-validator.d.ts.map