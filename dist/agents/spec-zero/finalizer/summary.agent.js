/**
 * Summary Agent - Final consolidation agent
 *
 * This agent runs last in the DAG and:
 * - Consolidates all previous agent outputs
 * - Generates an executive summary
 * - Creates navigation index
 * - Produces architecture diagram
 */
import { SubAgent } from '../../base.js';
import { getSummarySystemContext } from '../../../prompts/system-context.js';
import { generateFrontmatter } from '../../../prompts/output-schema.js';
import { DiagramGenerator } from '../../../core/diagram-generator.js';
import * as fs from 'fs';
import * as path from 'path';
export class SummaryAgent extends SubAgent {
    id = 'summary';
    name = 'Summary Agent';
    description = 'Consolidates all analysis into an executive summary with navigation.';
    systemPrompt = 'You are the summary agent for SPEC-OS analysis.';
    triggers = [];
    // Summary depends on all other agents (DAG uses '*')
    contextDeps = ['*'];
    promptFile = 'summary.md';
    outputFile = 'SUMMARY.md';
    category = ''; // Root level
    async process(context) {
        const params = context.params || {};
        const projectSlug = String(params.projectSlug || 'unknown-repo');
        const baseDir = String(params.baseDir || process.cwd());
        const repoType = params.repoType || 'generic';
        const sharedContext = params.sharedContext;
        const allResults = params.allResults || {};
        if (!fs.existsSync(baseDir)) {
            return { success: false, message: `Invalid baseDir: ${baseDir}` };
        }
        try {
            // 1. Gather all summaries from context
            const summaries = this.gatherSummaries(sharedContext, allResults);
            // 2. Build system prompt
            const systemPrompt = getSummarySystemContext(projectSlug, repoType);
            // 3. Build user prompt with all summaries
            const userPrompt = this.buildSummaryPrompt(summaries, sharedContext);
            // 4. Execute via Native LLM
            const nativeLLM = this.skills.get('native_llm');
            if (!nativeLLM) {
                return { success: false, message: 'Native LLM skill not found' };
            }
            const result = await nativeLLM.execute({
                systemPrompt: systemPrompt,
                userPrompt: userPrompt
            });
            if (!result.success || !result.data) {
                // Fallback: generate summary from collected data
                return this.generateFallbackSummary(projectSlug, repoType, baseDir, summaries, sharedContext);
            }
            let summaryContent = result.data;
            // 5. Sanitize and extract diagrams
            const diagramGenerator = new DiagramGenerator();
            summaryContent = diagramGenerator.sanitizeAllDiagrams(summaryContent);
            const extractedDiagrams = diagramGenerator.extractDiagrams(summaryContent);
            const standaloneDiagrams = extractedDiagrams.map((diag, index) => ({
                path: `_diagrams/summary-${diag.type}-${index}.mmd`,
                content: this.wrapDiagramWithFrontmatter(diag.content, diag.type, projectSlug)
            }));
            // 6. Ensure frontmatter
            summaryContent = this.ensureFrontmatter(summaryContent, projectSlug, sharedContext);
            // 7. Write output
            const specDir = path.join(baseDir, `${projectSlug}-spec`);
            const fullPath = path.join(specDir, 'SUMMARY.md');
            fs.mkdirSync(specDir, { recursive: true });
            fs.writeFileSync(fullPath, summaryContent);
            // 8. Write standalone diagrams
            const diagramsDir = path.join(specDir, '_generated', '_diagrams');
            if (standaloneDiagrams.length > 0) {
                fs.mkdirSync(diagramsDir, { recursive: true });
                for (const diag of standaloneDiagrams) {
                    const standalonePath = path.join(specDir, '_generated', diag.path);
                    fs.mkdirSync(path.dirname(standalonePath), { recursive: true });
                    fs.writeFileSync(standalonePath, diag.content);
                }
            }
            // 9. Also create index.md as navigation
            const indexContent = this.generateIndex(projectSlug, sharedContext);
            fs.writeFileSync(path.join(specDir, 'index.md'), indexContent);
            const promptVersion = {
                id: 'analysis/summary',
                version: '1',
                hash: 'native'
            };
            return {
                success: true,
                data: {
                    output: summaryContent,
                    path: fullPath,
                    summary: this.extractExecutiveSummary(summaryContent),
                    diagrams: standaloneDiagrams,
                    promptVersion
                },
                message: 'Summary generation complete'
            };
        }
        catch (error) {
            return { success: false, message: `Summary agent failed: ${error.message}` };
        }
    }
    /**
     * Gather summaries from context or allResults
     */
    gatherSummaries(sharedContext, allResults) {
        const summaries = new Map();
        if (sharedContext) {
            // Use SharedContext summaries
            for (const agentId of sharedContext.getExecutedAgentIds()) {
                const output = sharedContext.getFullContent(agentId);
                if (output) {
                    summaries.set(agentId, this.extractSummaryFromOutput(output));
                }
            }
        }
        else {
            // Fallback to allResults
            for (const [agentId, output] of Object.entries(allResults)) {
                summaries.set(agentId, this.extractSummaryFromOutput(output));
            }
        }
        return summaries;
    }
    /**
     * Extract summary section from agent output
     */
    extractSummaryFromOutput(content, maxLength = 500) {
        const summaryMatch = content.match(/## Executive Summary\n([\s\S]*?)(?=\n##|$)/);
        if (summaryMatch) {
            return summaryMatch[1].trim().slice(0, maxLength);
        }
        // Fallback: first paragraph after frontmatter
        const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');
        const firstParagraph = withoutFrontmatter.split('\n\n')[0];
        return (firstParagraph || content.slice(0, maxLength)).trim().slice(0, maxLength);
    }
    /**
     * Build prompt for summary generation
     */
    buildSummaryPrompt(summaries, sharedContext) {
        let prompt = '## Collected Analysis Results\n\n';
        // Add each agent's summary
        for (const [agentId, summary] of summaries) {
            prompt += `### ${this.formatAgentName(agentId)}\n${summary}\n\n`;
        }
        // Add metadata if available
        if (sharedContext) {
            const metadata = sharedContext.generateMetadata();
            prompt += `\n## Execution Metadata\n`;
            prompt += `- Agents executed: ${metadata.agentsExecuted?.length || 0}\n`;
            prompt += `- Total duration: ${Math.round((metadata.durationMs || 0) / 1000)}s\n`;
            prompt += `- Key files analyzed: ${metadata.keyFilesLoaded?.length || 0}\n`;
        }
        prompt += `\n## Instructions\n`;
        prompt += `Using the collected results above, generate the Executive Summary following the system instructions. Ensure the Tech Stack table is accurate based on the findings, and the Architecture Diagram uses valid Mermaid syntax (avoiding common errors like --|->).\n`;
        prompt += `DO NOT use filler phrases. Start directly with the # Executive Summary heading.\n`;
        return prompt;
    }
    /**
     * Format agent ID to readable name
     */
    formatAgentName(agentId) {
        return agentId
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }
    /**
     * Ensure frontmatter exists
     */
    ensureFrontmatter(content, projectSlug, sharedContext) {
        if (content.startsWith('---')) {
            return content;
        }
        const today = new Date().toISOString().split('T')[0];
        const executedAgents = sharedContext?.getExecutedAgentIds() || [];
        const frontmatter = {
            uid: `${projectSlug}:spec:summary`,
            title: `${projectSlug} - Analysis Summary`,
            status: 'draft',
            version: '1.0.0',
            created: today,
            prompt_version: 'summary@v1',
            edges: executedAgents.map(a => `[[${projectSlug}:spec:${a}|summarizes]]`),
            tags: ['spec', 'summary', 'executive']
        };
        return `${generateFrontmatter(frontmatter)}\n\n${content}`;
    }
    /**
     * Generate fallback summary if LLM fails
     */
    generateFallbackSummary(projectSlug, repoType, baseDir, summaries, sharedContext) {
        const today = new Date().toISOString().split('T')[0];
        let content = `---
uid: ${projectSlug}:spec:summary
title: "${projectSlug} - Analysis Summary"
status: draft
version: 1.0.0
created: ${today}
prompt_version: summary@v1
tags:
  - spec
  - summary
---

# ${projectSlug} Analysis Summary

## Executive Summary

This is an automated analysis summary for **${projectSlug}**, a **${repoType}** project.

## Agents Executed

| Agent | Summary |
|-------|---------|
`;
        for (const [agentId, summary] of summaries) {
            const shortSummary = summary.slice(0, 100).replace(/\n/g, ' ');
            content += `| ${this.formatAgentName(agentId)} | ${shortSummary}... |\n`;
        }
        content += `
## Navigation

`;
        for (const agentId of summaries.keys()) {
            content += `- [[${projectSlug}:spec:${agentId}|${this.formatAgentName(agentId)}]]\n`;
        }
        if (sharedContext) {
            const metadata = sharedContext.generateMetadata();
            content += `
## Analysis Metadata

- **Analysis Date:** ${metadata.analysisDate}
- **Duration:** ${Math.round((metadata.durationMs || 0) / 1000)}s
- **Agents Executed:** ${metadata.agentsExecuted?.length || 0}
- **Key Files Loaded:** ${metadata.keyFilesLoaded?.length || 0}
`;
        }
        const specDir = path.join(baseDir, `${projectSlug}-spec`);
        const fullPath = path.join(specDir, 'SUMMARY.md');
        fs.mkdirSync(specDir, { recursive: true });
        fs.writeFileSync(fullPath, content);
        return {
            success: true,
            data: {
                output: content,
                path: fullPath,
                summary: `Fallback summary generated for ${projectSlug}`,
                promptVersion: { id: 'summary', version: '1', hash: 'fallback' }
            },
            message: 'Fallback summary generated'
        };
    }
    /**
     * Generate index.md for navigation
     */
    generateIndex(projectSlug, sharedContext) {
        const today = new Date().toISOString().split('T')[0];
        const executedAgents = sharedContext?.getExecutedAgentIds() || [];
        let index = `---
uid: ${projectSlug}:spec:index
title: "${projectSlug} - Specification Index"
status: draft
version: 1.0.0
created: ${today}
---

# ${projectSlug} Specification

## Quick Navigation

- [[${projectSlug}:spec:summary|Executive Summary]]

## Analysis Sections

### Core
- [[${projectSlug}:spec:overview|Overview]]
- [[${projectSlug}:spec:module|Modules]]
- [[${projectSlug}:spec:entity|Entities]]

### Data Layer
- [[${projectSlug}:spec:db|Database]]
- [[${projectSlug}:spec:data_map|Data Mapping]]
- [[${projectSlug}:spec:event|Events]]

### Integration
- [[${projectSlug}:spec:api|APIs]]
- [[${projectSlug}:spec:dependency|Dependencies]]
- [[${projectSlug}:spec:service_dep|Service Dependencies]]

### Security
- [[${projectSlug}:spec:auth|Authentication]]
- [[${projectSlug}:spec:authz|Authorization]]
- [[${projectSlug}:spec:security|Security]]
- [[${projectSlug}:spec:prompt_sec|Prompt Security]]

### Operations
- [[${projectSlug}:spec:deployment|Deployment]]
- [[${projectSlug}:spec:monitor|Monitoring]]
- [[${projectSlug}:spec:ml|ML Services]]
- [[${projectSlug}:spec:flag|Feature Flags]]

## Meta
- [[${projectSlug}:spec:_meta/analysis_audit|Analysis Audit]]
`;
        return index;
    }
    /**
     * Extract executive summary from content
     */
    extractExecutiveSummary(content) {
        const match = content.match(/## Executive Summary\n([\s\S]*?)(?=\n##|$)/);
        return match ? match[1].trim().slice(0, 500) : content.slice(0, 500);
    }
    /**
     * Wrap diagram with frontmatter for standalone saving
     */
    wrapDiagramWithFrontmatter(content, type, projectSlug) {
        const today = new Date().toISOString().split('T')[0];
        return `---
uid: ${projectSlug}:diagram:summary:${type}
title: "Summary ${type.toUpperCase()} Diagram"
type: diagram
diagram_type: ${type}
created: ${today}
source: SUMMARY.md
---

\`\`\`mermaid
${content}
\`\`\`
`;
    }
}
//# sourceMappingURL=summary.agent.js.map