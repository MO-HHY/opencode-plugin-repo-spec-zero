/**
 * GenericAnalysisAgent - Generic agent driven by external prompts
 * 
 * This agent replaces all specialized analysis agents with a single
 * configurable agent that receives its behavior from:
 * - PlannedAgent configuration from SmartDAGPlanner
 * - Prompts from PromptRouter
 * - Templates from TemplateLoader
 */

import type { AgentContext, AgentResult } from '../types.js';
import type {
    PlannedAgent,
    RoutedPrompt,
    DiagramInstruction,
    LLMMessage,
    GeneratedDiagram,
    StandaloneDiagram,
    GenericAgentOutput,
    PromptVersion,
    DiagramType,
} from '../types.js';
import { SubAgent } from './base.js';
import type { PromptRouter } from '../core/prompt-router.js';
import type { TemplateLoader } from '../core/template-loader.js';
import type { DiagramGenerator } from '../core/diagram-generator.js';

export class GenericAnalysisAgent extends SubAgent {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly systemPrompt: string = '';
    readonly triggers: RegExp[] = [];

    private config: PlannedAgent;
    private router: PromptRouter;
    private templateLoader: TemplateLoader;
    private diagramGenerator?: DiagramGenerator;

    constructor(
        config: PlannedAgent,
        router: PromptRouter,
        templateLoader: TemplateLoader,
        diagramGenerator?: DiagramGenerator
    ) {
        super();
        this.config = config;
        this.router = router;
        this.templateLoader = templateLoader;
        this.diagramGenerator = diagramGenerator;

        this.id = config.id;
        this.name = `${config.id} Analysis`;
        this.description = `Analyzes ${config.id} using prompt ${config.promptId}`;
    }

    /**
     * Main process method - executes the analysis
     */
    async process(context: AgentContext): Promise<AgentResult> {
        try {
            // 1. Get routed prompt from router
            const routedPrompt = this.getRoutedPrompt(context);

            // 2. Build LLM messages
            const messages = this.buildLLMMessages(context, routedPrompt);

            // 3. Call LLM
            const llmResult = await this.callLLM(context, messages);
            
            if (!llmResult.success) {
                return {
                    success: false,
                    message: `LLM call failed: ${llmResult.error}`,
                    data: null,
                };
            }

            // 4. Apply template if present
            let formattedOutput = llmResult.content!;
            if (this.config.templateId) {
                formattedOutput = this.applyTemplate(
                    llmResult.content!,
                    this.config.templateId,
                    context
                );
            }

            // 5. Process diagrams
            const { contentWithDiagrams, standaloneDiagrams } = await this.processDiagrams(
                formattedOutput,
                routedPrompt.diagramInstructions,
                context
            );

            // 6. Build output
            const output: GenericAgentOutput = {
                output: contentWithDiagrams,
                path: this.config.outputFile,
                diagrams: standaloneDiagrams,
                promptVersion: {
                    id: routedPrompt.metadata.promptId,
                    version: routedPrompt.metadata.version,
                    hash: routedPrompt.metadata.hash,
                },
            };

            return {
                success: true,
                message: `${this.id} analysis complete`,
                data: output,
            };

        } catch (error: any) {
            return {
                success: false,
                message: error.message,
                data: null,
            };
        }
    }

    // =========================================================================
    // PRIVATE METHODS - To be implemented in subsequent tasks
    // =========================================================================

    /**
     * Get the routed prompt for this agent
     */
    private getRoutedPrompt(context: AgentContext): RoutedPrompt {
        const params = context.params as any;
        const sharedContext = params.sharedContext;
        const completedPrompts = sharedContext ? sharedContext.getCompletedPrompts() : new Set<string>();
        
        return this.router.route({
            repoType: params.repoType || 'unknown',
            detectedFeatures: params.features?.features || new Set(),
            completedAgents: completedPrompts, // Actually using prompts now
            previousOutputs: new Map(Object.entries(params.previousOutputs || {})),
            currentAgentId: this.id,
        });
    }

    /**
     * Build messages array for LLM
     */
    private buildLLMMessages(
        context: AgentContext,
        routedPrompt: RoutedPrompt
    ): LLMMessage[] {
        const params = context.params as any;
        const parts: string[] = [];

        // Repository structure
        if (params.repoStructure) {
            parts.push('## Repository Structure\n```\n' + params.repoStructure + '\n```\n');
        }

        // Key files from shared context
        const keyFiles = params.sharedContext?.getKeyFiles?.();
        if (keyFiles && keyFiles.size > 0) {
            parts.push('## Key Files\n');
            for (const [filePath, content] of keyFiles) {
                parts.push(`### ${filePath}\n\`\`\`\n${content}\n\`\`\`\n`);
            }
        }

        // Analysis prompt
        parts.push('## Analysis Task\n' + routedPrompt.analysisPrompt);

        return [
            {
                role: 'system',
                content: routedPrompt.systemPrompt + '\n\n' + routedPrompt.outputSchema,
            },
            {
                role: 'user',
                content: parts.join('\n'),
            },
        ];
    }

    /**
     * Call the LLM with messages
     */
    private async callLLM(
        context: AgentContext,
        messages: LLMMessage[]
    ): Promise<{ success: boolean; content?: string; error?: string }> {
        try {
            // Use native_llm skill if available
            const llmSkill = this.skills.get('native_llm');
            if (llmSkill) {
                const result = await llmSkill.execute({
                    messages,
                    model: 'default',
                });
                
                if (result.success && result.data) {
                    return { success: true, content: String(result.data) };
                }
                return { success: false, error: result.error || 'LLM call failed' };
            }

            // Fallback to client session prompt
            const response = await context.client.session.prompt(
                messages.map((m: LLMMessage) => ({
                    role: m.role,
                    content: m.content,
                }))
            );
            
            return { success: true, content: response };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Apply template to LLM output
     */
    private applyTemplate(
        content: string,
        templateId: string,
        context: AgentContext
    ): string {
        try {
            const template = this.templateLoader.load(templateId);
            const variables = this.extractVariablesFromContent(content);
            const params = context.params as any;
            
            const result = this.templateLoader.fill(template, {
                ...variables,
                project: params.projectSlug || 'unknown',
                date: new Date().toISOString().split('T')[0],
            });
            
            return result.content;
        } catch (error) {
            // If template fails, return original content
            console.warn(`Template ${templateId} failed, using raw output`);
            return content;
        }
    }

    /**
     * Extract variables from LLM output markdown
     */
    private extractVariablesFromContent(content: string): Record<string, string> {
        const variables: Record<string, string> = {};

        // Extract title from # heading
        const titleMatch = content.match(/^#\s+(.+)/m);
        if (titleMatch) variables.title = titleMatch[1];

        // Extract description (first paragraph after title)
        const descMatch = content.match(/^#.+\n\n(.+)/m);
        if (descMatch) variables.description = descMatch[1];

        // Extract sections by ## headings
        const sections = content.split(/^##\s+/m);
        for (const section of sections.slice(1)) {
            const lines = section.split('\n');
            const sectionName = lines[0]?.toLowerCase().replace(/\s+/g, '_');
            if (sectionName) {
                variables[sectionName] = lines.slice(1).join('\n').trim();
            }
        }

        return variables;
    }

    /**
     * Process diagrams - extract inline and create standalone
     */
    private async processDiagrams(
        content: string,
        instructions: DiagramInstruction[],
        context: AgentContext
    ): Promise<{ contentWithDiagrams: string; standaloneDiagrams: StandaloneDiagram[] }> {
        let contentWithDiagrams = content;
        const standaloneDiagrams: StandaloneDiagram[] = [];
        const processedTypes = new Set<DiagramType>();

        // 1. Process requested diagrams
        for (const instruction of instructions) {
            // Try to extract existing diagram from content using DiagramGenerator if available
            let diagramContent: string | null = null;
            
            if (this.diagramGenerator) {
                const extracted = this.diagramGenerator.extractDiagrams(content, instruction.type);
                if (extracted.length > 0) {
                    diagramContent = extracted[0].content;
                }
            } else {
                // Fallback to internal extractor if DiagramGenerator not provided
                diagramContent = this.extractMermaidDiagram(content, instruction.type);
            }

            // If not found and generator is available, try to generate it
            if (!diagramContent && this.diagramGenerator) {
                try {
                    const generated = await this.diagramGenerator.generate(
                        instruction.type,
                        content,
                        context
                    );
                    if (generated) {
                        diagramContent = generated.content;
                        // If it should be inline, add it to content
                        if (instruction.inline) {
                            contentWithDiagrams += `\n\n## ${this.getDiagramTitle(instruction.type)}\n\n\`\`\`mermaid\n${diagramContent}\n\`\`\`\n`;
                        }
                    }
                } catch (error) {
                    console.error(`[GenericAnalysisAgent] Error generating diagram ${instruction.type}:`, error);
                }
            }

            if (diagramContent) {
                // Create standalone version with frontmatter
                standaloneDiagrams.push({
                    path: `_diagrams/${instruction.outputFile}`,
                    content: this.wrapWithFrontmatter(diagramContent, instruction),
                });
                processedTypes.add(instruction.type);
            }

            // If diagram should be inline but isn't present, add placeholder
            if (instruction.inline && !contentWithDiagrams.includes(`## ${this.getDiagramTitle(instruction.type)}`)) {
                contentWithDiagrams += `\n\n## ${this.getDiagramTitle(instruction.type)}\n\n`;
                contentWithDiagrams += `> Diagram: ${instruction.description}\n`;
            }
        }

        // 2. Extra task: Extract ANY other existing mermaid diagrams not explicitly requested
        if (this.diagramGenerator) {
            const allExtracted = this.diagramGenerator.extractDiagrams(content);
            for (const diag of allExtracted) {
                if (!processedTypes.has(diag.type)) {
                    // It's an unrequested but existing diagram, save it standalone too
                    const fileName = `${this.id}-${diag.type}-${standaloneDiagrams.length}.mmd`;
                    standaloneDiagrams.push({
                        path: `_diagrams/${fileName}`,
                        content: this.wrapWithFrontmatter(diag.content, {
                            type: diag.type,
                            description: `Extracted ${diag.type} diagram`,
                            outputFile: fileName,
                            inline: false
                        }),
                    });
                }
            }
        }

        return { contentWithDiagrams, standaloneDiagrams };
    }

    /**
     * Extract Mermaid diagram of specific type from content
     */
    private extractMermaidDiagram(content: string, type: DiagramType): string | null {
        // Match ```mermaid blocks
        const regex = /```mermaid\n([\s\S]*?)```/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            const diagramContent = match[1].trim();
            // Check if diagram type matches
            if (this.isDiagramType(diagramContent, type)) {
                return diagramContent;
            }
        }

        return null;
    }

    /**
     * Check if diagram content matches the expected type
     */
    private isDiagramType(content: string, type: DiagramType): boolean {
        const typePatterns: Record<DiagramType, RegExp> = {
            sequence: /^sequenceDiagram/i,
            flowchart: /^flowchart|^graph/i,
            erd: /^erDiagram/i,
            classDiagram: /^classDiagram/i,
            stateDiagram: /^stateDiagram/i,
            c4: /^C4/i,
            gantt: /^gantt/i,
            pie: /^pie/i,
        };

        return typePatterns[type]?.test(content) ?? false;
    }

    /**
     * Wrap diagram with YAML frontmatter
     */
    private wrapWithFrontmatter(
        diagramContent: string,
        instruction: DiagramInstruction
    ): string {
        const date = new Date().toISOString().split('T')[0];
        
        return `---
uid: ${this.config.id}:diagram:${instruction.type}
title: "${this.getDiagramTitle(instruction.type)}"
type: diagram
diagram_type: ${instruction.type}
created: ${date}
source: ${this.config.outputFile}
---

\`\`\`mermaid
${diagramContent}
\`\`\`
`;
    }

    /**
     * Get human-readable title for diagram type
     */
    private getDiagramTitle(type: DiagramType): string {
        const titles: Record<DiagramType, string> = {
            sequence: 'Sequence Diagram',
            flowchart: 'Flow Diagram',
            erd: 'Entity Relationship Diagram',
            classDiagram: 'Class Diagram',
            stateDiagram: 'State Diagram',
            c4: 'C4 Architecture Diagram',
            gantt: 'Timeline',
            pie: 'Distribution Chart',
        };
        return titles[type] || 'Diagram';
    }
}
