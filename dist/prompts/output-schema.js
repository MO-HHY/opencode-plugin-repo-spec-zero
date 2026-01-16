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
export function getOutputSchema(variables) {
    const { projectSlug, sectionName, promptId, promptVersion } = variables;
    const today = new Date().toISOString().split('T')[0];
    return `## Output Format (MANDATORY)

Your output MUST follow this exact structure:

### YAML Frontmatter (Required)
\`\`\`yaml
---
uid: ${projectSlug}:spec:${sectionName}
title: "{Section Title}"
status: draft
version: 1.0.0
created: ${today}
prompt_version: ${promptId}@v${promptVersion}
edges:
  - [[${projectSlug}:spec:{related-section}|depends_on]]
tags:
  - spec
  - ${sectionName}
---
\`\`\`

### Content Structure
- Use **H2 (##)** for main sections
- Use **H3 (###)** for subsections
- Include code blocks with language tags
- Use tables for structured data

### Edge Syntax
Use Obsidian-safe format for linking:
\`[[${projectSlug}:spec:{target}|{edge_type}]]\`

Valid edge types:
- \`depends_on\` - This section depends on another
- \`implements\` - Implements a specification
- \`extends\` - Extends another component
- \`uses\` - Uses functionality from
- \`contains\` - Contains sub-components

### Citation Rules (Critical)
1. **ALWAYS** cite file paths: \`backend/src/server.ts:42\`
2. **NEVER** invent information not in the code
3. Write **"NOT_FOUND"** if data is unavailable
4. Use actual code snippets when relevant

### Example Output
\`\`\`markdown
---
uid: ${projectSlug}:spec:${sectionName}
title: "Example Section"
status: draft
version: 1.0.0
created: ${today}
prompt_version: ${promptId}@v${promptVersion}
edges:
  - [[${projectSlug}:spec:overview|depends_on]]
---

## Executive Summary

Brief description of findings...

## Key Findings

| Finding | Location | Impact |
|---------|----------|--------|
| Uses React 19 | \`package.json:15\` | High |

## Details

### Subsection 1

Content with code reference \`src/index.ts:10\`

\`\`\`typescript
// Actual code snippet
export function main() {}
\`\`\`
\`\`\`

---

`;
}
/**
 * Section-specific output schemas
 */
export const SECTION_SCHEMAS = {
    overview: `
### Required Sections for Overview
1. **## Executive Summary** (3-5 sentences)
2. **## Technology Stack** (table format)
3. **## Architecture Pattern**
4. **## Entry Points**
5. **## Build & Run Commands**
`,
    module: `
### Required Sections for Module Analysis
For each module:
1. **## Module: {name}**
   - Purpose
   - Key Files
   - Dependencies
   - Public API
   - Internal Structure
`,
    entity: `
### Required Sections for Entity Analysis
1. **## Core Entities** (table)
2. **## Entity Details** (per entity)
   - Fields/Properties
   - Relationships
   - Validation Rules
   - Source Location
`,
    api: `
### Required Sections for API Analysis
1. **## Endpoints** (table: Method | Path | Description | Auth)
2. **## Authentication**
3. **## Request/Response Examples**
4. **## Error Handling**
`,
    db: `
### Required Sections for Database Analysis
1. **## Schema Overview**
2. **## Tables/Collections** (per entity)
3. **## Relationships** (ERD if possible)
4. **## Indexes**
5. **## Migrations**
`,
    security: `
### Required Sections for Security Analysis
1. **## Security Overview**
2. **## Vulnerabilities Found** (table with severity)
3. **## Recommendations**
4. **## Compliance Notes**
`,
    summary: `
### Required Sections for Summary
1. **## Executive Summary** (comprehensive)
2. **## Architecture Overview** (with Mermaid diagram)
3. **## Key Findings**
4. **## Technology Stack**
5. **## Next Steps / Recommendations**
6. **## Analysis Navigation** (links to all sections)
`
};
/**
 * Get output schema with section-specific requirements
 */
export function getFullOutputSchema(variables) {
    const baseSchema = getOutputSchema(variables);
    const sectionSchema = SECTION_SCHEMAS[variables.sectionName] || '';
    return baseSchema + sectionSchema;
}
/**
 * Generate frontmatter YAML string
 */
export function generateFrontmatter(data) {
    const edges = data.edges?.length
        ? `edges:\n${data.edges.map(e => `  - ${e}`).join('\n')}`
        : '';
    const tags = data.tags?.length
        ? `tags:\n${data.tags.map(t => `  - ${t}`).join('\n')}`
        : '';
    return `---
uid: ${data.uid}
title: "${data.title}"
status: ${data.status}
version: ${data.version}
created: ${data.created}
prompt_version: ${data.prompt_version}
${edges}
${tags}
---`;
}
/**
 * Parse frontmatter from markdown content
 */
export function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match)
        return null;
    const yaml = match[1];
    const result = {};
    // Simple YAML parsing (not a full YAML parser)
    const lines = yaml.split('\n');
    let currentKey = '';
    let inArray = false;
    let arrayValues = [];
    for (const line of lines) {
        const keyMatch = line.match(/^(\w+):\s*(.*)$/);
        if (keyMatch) {
            if (inArray && currentKey) {
                result[currentKey] = arrayValues;
                arrayValues = [];
            }
            currentKey = keyMatch[1];
            const value = keyMatch[2].trim();
            if (value === '' || value === undefined) {
                inArray = true;
            }
            else {
                inArray = false;
                result[currentKey] = value.replace(/^["']|["']$/g, '');
            }
        }
        else if (inArray && line.trim().startsWith('- ')) {
            arrayValues.push(line.trim().substring(2));
        }
    }
    if (inArray && currentKey) {
        result[currentKey] = arrayValues;
    }
    return result;
}
//# sourceMappingURL=output-schema.js.map