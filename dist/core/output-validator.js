/**
 * Output Validator - SPEC-OS format validation
 *
 * Validates that agent outputs conform to SPEC-OS standards:
 * - YAML frontmatter presence and validity
 * - Required fields (uid, title, status, etc.)
 * - Edge syntax correctness
 * - Citation format
 */
import { parseFrontmatter } from '../prompts/output-schema.js';
export class OutputValidator {
    options;
    constructor(options = {}) {
        this.options = {
            strict: false,
            autoFix: false,
            ...options
        };
    }
    /**
     * Validate content against SPEC-OS requirements
     */
    validate(content) {
        const errors = [];
        const warnings = [];
        let fixedContent = content;
        let fixedCount = 0;
        // 1. Check frontmatter presence
        const frontmatterResult = this.validateFrontmatter(content);
        errors.push(...frontmatterResult.errors);
        warnings.push(...frontmatterResult.warnings);
        // 2. Check UID format
        const uidResult = this.validateUID(content);
        errors.push(...uidResult.errors);
        warnings.push(...uidResult.warnings);
        // 3. Check prompt_version
        const promptVersionResult = this.validatePromptVersion(content);
        errors.push(...promptVersionResult.errors);
        warnings.push(...promptVersionResult.warnings);
        // 4. Check edges syntax
        const edgesResult = this.validateEdges(content);
        errors.push(...edgesResult.errors);
        warnings.push(...edgesResult.warnings);
        // 5. Check citations
        const citationsResult = this.validateCitations(content);
        warnings.push(...citationsResult.warnings); // Citations are warnings, not errors
        // 6. Check section structure
        const structureResult = this.validateStructure(content);
        warnings.push(...structureResult.warnings);
        // 7. Auto-fix if enabled
        if (this.options.autoFix) {
            const fixResult = this.autoFix(content, errors, warnings);
            fixedContent = fixResult.content;
            fixedCount = fixResult.count;
        }
        const valid = errors.length === 0 && (!this.options.strict || warnings.length === 0);
        return {
            valid,
            errors,
            warnings,
            fixed: this.options.autoFix ? fixedContent : undefined,
            fixedCount
        };
    }
    /**
     * Validate frontmatter presence and structure
     */
    validateFrontmatter(content) {
        const errors = [];
        const warnings = [];
        // Check for frontmatter delimiters
        if (!content.startsWith('---')) {
            errors.push('Missing YAML frontmatter (must start with ---)');
            return { valid: false, errors, warnings };
        }
        const endIndex = content.indexOf('---', 3);
        if (endIndex === -1) {
            errors.push('Unclosed YAML frontmatter (missing closing ---)');
            return { valid: false, errors, warnings };
        }
        // Parse frontmatter
        const frontmatter = parseFrontmatter(content);
        if (!frontmatter) {
            errors.push('Invalid YAML frontmatter structure');
            return { valid: false, errors, warnings };
        }
        // Required fields
        const requiredFields = ['uid', 'title', 'status', 'version', 'created', 'prompt_version'];
        for (const field of requiredFields) {
            if (!frontmatter[field]) {
                errors.push(`Missing required frontmatter field: ${field}`);
            }
        }
        // Validate status value
        if (frontmatter.status && !['draft', 'review', 'approved'].includes(frontmatter.status)) {
            errors.push(`Invalid status value: ${frontmatter.status} (must be draft, review, or approved)`);
        }
        // Check for optional but recommended fields
        if (!frontmatter.tags || frontmatter.tags.length === 0) {
            warnings.push('Frontmatter missing tags (recommended)');
        }
        return { valid: errors.length === 0, errors, warnings };
    }
    /**
     * Validate UID format
     */
    validateUID(content) {
        const errors = [];
        const warnings = [];
        const uidMatch = content.match(/uid:\s*(.+)/);
        if (!uidMatch) {
            errors.push('Missing uid field');
            return { valid: false, errors, warnings };
        }
        const uid = uidMatch[1].trim();
        // UID format: {project-slug}:spec:{section-name}
        const uidPattern = /^[\w-]+:spec:[\w-]+$/;
        if (!uidPattern.test(uid)) {
            errors.push(`Invalid uid format: ${uid} (expected: project-slug:spec:section-name)`);
        }
        // Check against projectSlug if provided
        if (this.options.projectSlug) {
            if (!uid.startsWith(`${this.options.projectSlug}:`)) {
                warnings.push(`UID doesn't start with project slug: expected ${this.options.projectSlug}:...`);
            }
        }
        return { valid: errors.length === 0, errors, warnings };
    }
    /**
     * Validate prompt_version format
     */
    validatePromptVersion(content) {
        const errors = [];
        const warnings = [];
        const match = content.match(/prompt_version:\s*(.+)/);
        if (!match) {
            errors.push('Missing prompt_version field');
            return { valid: false, errors, warnings };
        }
        const version = match[1].trim();
        // Format: {prompt-id}@v{version}
        const versionPattern = /^[\w-]+@v\d+$/;
        if (!versionPattern.test(version)) {
            warnings.push(`Prompt version may not follow convention: ${version} (expected: prompt-id@vN)`);
        }
        return { valid: errors.length === 0, errors, warnings };
    }
    /**
     * Validate edge syntax
     */
    validateEdges(content) {
        const errors = [];
        const warnings = [];
        // Find all edges in content
        const edgePattern = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
        let match;
        while ((match = edgePattern.exec(content)) !== null) {
            const [fullMatch, target, edgeType] = match;
            // Validate edge type
            const validEdgeTypes = ['depends_on', 'implements', 'extends', 'uses', 'contains', 'summarizes'];
            if (!validEdgeTypes.includes(edgeType)) {
                warnings.push(`Unknown edge type: ${edgeType} in ${fullMatch}`);
            }
            // Validate target format
            if (!target.includes(':spec:')) {
                warnings.push(`Edge target may not be a spec reference: ${target}`);
            }
        }
        // Check edges in frontmatter
        const frontmatter = parseFrontmatter(content);
        if (frontmatter?.edges) {
            for (const edge of frontmatter.edges) {
                if (!edge.includes('|')) {
                    warnings.push(`Edge in frontmatter missing edge type: ${edge}`);
                }
            }
        }
        return { valid: true, errors, warnings };
    }
    /**
     * Validate citations (file references)
     */
    validateCitations(content) {
        const warnings = [];
        // Look for file path citations like `path/file.ts:42`
        const citationPattern = /`([^`]+\.(ts|js|tsx|jsx|py|go|rs|java|kt|swift|md|json|yaml|yml))(?::(\d+))?`/g;
        let citationCount = 0;
        let match;
        while ((match = citationPattern.exec(content)) !== null) {
            citationCount++;
            const [, filePath, , lineNumber] = match;
            // Check for line numbers (recommended)
            if (!lineNumber) {
                // Only warn if it looks like a code reference, not a general file mention
                if (content.includes(`Found in \`${filePath}\``) ||
                    content.includes(`See \`${filePath}\``) ||
                    content.includes(`from \`${filePath}\``)) {
                    warnings.push(`Citation missing line number: ${filePath}`);
                }
            }
        }
        // Warn if no citations found (might indicate hallucination)
        if (citationCount === 0) {
            const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');
            if (contentWithoutFrontmatter.length > 500) {
                warnings.push('No file citations found in output (may indicate hallucination)');
            }
        }
        // Check for NOT_FOUND usage
        if (!content.includes('NOT_FOUND') && content.toLowerCase().includes('not found')) {
            warnings.push('Consider using "NOT_FOUND" instead of "not found" for missing data');
        }
        return { valid: true, errors: [], warnings };
    }
    /**
     * Validate section structure
     */
    validateStructure(content) {
        const warnings = [];
        // Check for H1 outside frontmatter (should be H2)
        const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');
        if (/^#\s+(?!#)/m.test(contentWithoutFrontmatter)) {
            warnings.push('Found H1 heading outside frontmatter (use H2 for main sections)');
        }
        // Check for Executive Summary
        if (!content.includes('## Executive Summary') && !content.includes('## Summary')) {
            warnings.push('Missing Executive Summary section (recommended)');
        }
        // Check for code blocks without language tags
        const codeBlockPattern = /```\s*\n/g;
        if (codeBlockPattern.test(content)) {
            warnings.push('Found code blocks without language tags');
        }
        return { valid: true, errors: [], warnings };
    }
    /**
     * Attempt to auto-fix common issues
     */
    autoFix(content, errors, warnings) {
        let fixed = content;
        let count = 0;
        // Fix: Add missing frontmatter
        if (errors.includes('Missing YAML frontmatter (must start with ---)')) {
            const today = new Date().toISOString().split('T')[0];
            const frontmatter = `---
uid: unknown:spec:unknown
title: "Untitled Analysis"
status: draft
version: 1.0.0
created: ${today}
prompt_version: unknown@v1
---

`;
            fixed = frontmatter + fixed;
            count++;
        }
        // Fix: Replace "not found" with "NOT_FOUND"
        if (warnings.some(w => w.includes('NOT_FOUND'))) {
            const patterns = [
                /\bnot found\b(?![\w])/gi,
                /\bcouldn't find\b/gi,
                /\bwas not found\b/gi,
                /\bno .+ found\b/gi
            ];
            for (const pattern of patterns) {
                const newContent = fixed.replace(pattern, 'NOT_FOUND');
                if (newContent !== fixed) {
                    fixed = newContent;
                    count++;
                }
            }
        }
        // Fix: Add language tags to code blocks
        if (warnings.some(w => w.includes('code blocks without language tags'))) {
            // Simple heuristic: add 'text' if no language specified
            fixed = fixed.replace(/```\s*\n(?!\s*$)/g, '```text\n');
            count++;
        }
        return { content: fixed, count };
    }
    /**
     * Quick validation check (returns boolean only)
     */
    isValid(content) {
        return this.validate(content).valid;
    }
    /**
     * Validate and return fixed content or throw
     */
    validateOrThrow(content) {
        const result = this.validate(content);
        if (!result.valid) {
            throw new Error(`Validation failed:\n${result.errors.join('\n')}`);
        }
        return result.fixed || content;
    }
}
/**
 * Quick validation function
 */
export function validateOutput(content, options) {
    const validator = new OutputValidator(options);
    return validator.validate(content);
}
/**
 * Validate with auto-fix
 */
export function validateAndFix(content, options) {
    const validator = new OutputValidator({ ...options, autoFix: true });
    return validator.validate(content);
}
//# sourceMappingURL=output-validator.js.map