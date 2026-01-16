/**
 * Output Schema - SPEC-OS compliant output format definitions
 *
 * Defines the required output format for all agents, including:
 * - YAML frontmatter requirements
 * - Section structure
 * - Edge syntax
 * - Citation rules
 */
/**
 * Get the output schema prompt to append to agent prompts
 */
export declare function getOutputSchema(variables: {
    projectSlug: string;
    sectionName: string;
    promptId: string;
    promptVersion: string;
}): string;
/**
 * Section-specific output schemas
 */
export declare const SECTION_SCHEMAS: Record<string, string>;
/**
 * Get output schema with section-specific requirements
 */
export declare function getFullOutputSchema(variables: {
    projectSlug: string;
    sectionName: string;
    promptId: string;
    promptVersion: string;
}): string;
/**
 * SPEC-OS Frontmatter interface
 */
export interface SpecOSFrontmatter {
    uid: string;
    title: string;
    status: 'draft' | 'review' | 'approved';
    version: string;
    created: string;
    prompt_version: string;
    edges?: string[];
    tags?: string[];
}
/**
 * Generate frontmatter YAML string
 */
export declare function generateFrontmatter(data: SpecOSFrontmatter): string;
/**
 * Parse frontmatter from markdown content
 */
export declare function parseFrontmatter(content: string): SpecOSFrontmatter | null;
//# sourceMappingURL=output-schema.d.ts.map