/**
 * Output Validator - SPEC-OS format validation
 *
 * Validates that agent outputs conform to SPEC-OS standards:
 * - YAML frontmatter presence and validity
 * - Required fields (uid, title, status, etc.)
 * - Edge syntax correctness
 * - Citation format
 */
import type { ValidationResult } from '../types.js';
export interface ValidationOptions {
    strict?: boolean;
    autoFix?: boolean;
    projectSlug?: string;
}
export interface DetailedValidationResult extends ValidationResult {
    fixed?: string;
    fixedCount?: number;
}
export declare class OutputValidator {
    private options;
    constructor(options?: ValidationOptions);
    /**
     * Validate content against SPEC-OS requirements
     */
    validate(content: string): DetailedValidationResult;
    /**
     * Validate frontmatter presence and structure
     */
    private validateFrontmatter;
    /**
     * Validate UID format
     */
    private validateUID;
    /**
     * Validate prompt_version format
     */
    private validatePromptVersion;
    /**
     * Validate edge syntax
     */
    private validateEdges;
    /**
     * Validate citations (file references)
     */
    private validateCitations;
    /**
     * Validate section structure
     */
    private validateStructure;
    /**
     * Attempt to auto-fix common issues
     */
    private autoFix;
    /**
     * Quick validation check (returns boolean only)
     */
    isValid(content: string): boolean;
    /**
     * Validate and return fixed content or throw
     */
    validateOrThrow(content: string): string;
}
/**
 * Quick validation function
 */
export declare function validateOutput(content: string, options?: ValidationOptions): ValidationResult;
/**
 * Validate with auto-fix
 */
export declare function validateAndFix(content: string, options?: ValidationOptions): DetailedValidationResult;
//# sourceMappingURL=output-validator.d.ts.map