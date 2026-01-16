/**
 * PromptRouter - Intelligent prompt routing and composition
 * 
 * Responsibilities:
 * 1. Select appropriate prompts for context
 * 2. Compose prompts with base + specific + output schema
 * 3. Add diagram instructions
 * 4. Provide templates to use
 */

import * as fs from 'fs';
import * as path from 'path';
import type { 
    RoutingContext, 
    RoutedPrompt, 
    DiagramInstruction,
    DiagramType,
    PromptDefinition,
    RepoType
} from '../types.js';
import { PromptRegistry } from './prompt-registry.js';

export class PromptRouter {
    private registry: PromptRegistry;
    private promptsDir: string;

    constructor(registry: PromptRegistry, promptsDir: string) {
        this.registry = registry;
        this.promptsDir = promptsDir;
    }

    /**
     * Route: select and compose prompt for an agent
     */
    route(context: RoutingContext): RoutedPrompt {
        // 1. Find applicable prompt
        const definition = this.selectPrompt(context);
        
        // 2. Load prompt content
        const loaded = this.registry.load(definition.id);
        
        // 3. Load base components
        const baseSystem = this.loadBaseSystem(context.repoType);
        const outputSchema = this.loadOutputSchema();
        
        // 4. Build context from previous agents
        const previousContext = this.buildPreviousContext(
            context.previousOutputs,
            definition.dependsOn
        );
        
        // 5. Prepare diagram instructions
        const diagramInstructions = this.buildDiagramInstructions(
            definition.diagrams,
            definition.id
        );
        
        // 6. Compose final prompt
        return {
            systemPrompt: this.composeSystemPrompt(baseSystem, context.repoType),
            analysisPrompt: this.composeAnalysisPrompt(
                loaded.content,
                previousContext,
                diagramInstructions
            ),
            outputSchema,
            diagramInstructions,
            templateId: definition.templateId,
            metadata: {
                promptId: definition.id,
                version: loaded.version,
                hash: loaded.hash
            }
        };
    }

    /**
     * Select the most appropriate prompt for the current context
     */
    private selectPrompt(context: RoutingContext): PromptDefinition {
        const applicable = this.registry.findApplicable(
            context.repoType,
            context.detectedFeatures,
            context.completedAgents
        );
        
        // Filter for current agent (match on produces)
        const forAgent = applicable.filter(p => 
            p.produces.some(prod => prod.includes(context.currentAgentId))
        );
        
        if (forAgent.length === 0) {
            throw new Error(
                `No prompt found for agent ${context.currentAgentId} ` +
                `in repo type ${context.repoType}`
            );
        }
        
        return forAgent[0]; // Already sorted by priority
    }

    /**
     * Load base system prompt
     */
    private loadBaseSystem(repoType: RepoType): string {
        const basePath = path.join(this.promptsDir, '_base', 'system.md');
        
        if (fs.existsSync(basePath)) {
            const content = fs.readFileSync(basePath, 'utf-8');
            // Strip version comment
            return content.replace(/^<!--\s*version[=:]\s*\d+\s*-->\n?/, '');
        }
        
        return this.getDefaultSystemPrompt();
    }

    /**
     * Load output schema
     */
    private loadOutputSchema(): string {
        const schemaPath = path.join(this.promptsDir, '_base', 'output-format.md');
        
        if (fs.existsSync(schemaPath)) {
            const content = fs.readFileSync(schemaPath, 'utf-8');
            return content.replace(/^<!--\s*version[=:]\s*\d+\s*-->\n?/, '');
        }
        
        return this.getDefaultOutputSchema();
    }

    /**
     * Build context from previous agent outputs
     */
    private buildPreviousContext(
        outputs: Map<string, string>,
        dependencies: string[]
    ): string {
        if (dependencies.length === 0 || dependencies[0] === '*') return '';
        
        const sections: string[] = ['## Context from Previous Analyses\n'];
        
        for (const dep of dependencies) {
            const summary = outputs.get(dep);
            if (summary) {
                sections.push(`### From ${dep}:\n${summary}\n`);
            }
        }
        
        return sections.length > 1 ? sections.join('\n') : '';
    }

    /**
     * Build diagram generation instructions
     */
    private buildDiagramInstructions(
        types: DiagramType[],
        promptId: string
    ): DiagramInstruction[] {
        return types.map(type => ({
            type,
            description: this.getDiagramDescription(type),
            outputFile: `${promptId.replace('/', '-')}-${type}.mmd`,
            inline: true
        }));
    }

    /**
     * Get description for diagram type
     */
    private getDiagramDescription(type: DiagramType): string {
        const descriptions: Record<DiagramType, string> = {
            sequence: 'Generate a sequence diagram showing the main interaction flows',
            flowchart: 'Generate a flowchart showing logic and decision flows',
            erd: 'Generate an ERD showing entity relationships',
            classDiagram: 'Generate a class diagram showing type structures',
            stateDiagram: 'Generate a state diagram showing state transitions',
            c4: 'Generate a C4 architecture diagram',
            gantt: 'Generate a Gantt chart for timeline visualization',
            pie: 'Generate a pie chart for distribution visualization'
        };
        return descriptions[type] || '';
    }

    /**
     * Compose system prompt with repo context
     */
    private composeSystemPrompt(base: string, repoType: RepoType): string {
        return `${base}

## Repository Context
- Type: ${repoType}
- Analysis Mode: SPEC-OS compliant output

## Your Role
You are an expert code analyst specializing in ${repoType} repositories.
Analyze thoroughly and provide accurate, well-structured documentation.
`;
    }

    /**
     * Compose analysis prompt with context and diagrams
     */
    private composeAnalysisPrompt(
        specific: string,
        previousContext: string,
        diagrams: DiagramInstruction[]
    ): string {
        let prompt = '';
        
        if (previousContext) {
            prompt += previousContext + '\n---\n\n';
        }
        
        prompt += specific;
        
        if (diagrams.length > 0) {
            prompt += '\n\n## Required Diagrams\n\n';
            for (const d of diagrams) {
                prompt += `### ${d.type}\n${d.description}\n\n`;
                prompt += this.getDiagramTemplate(d.type);
                prompt += '\n\n';
            }
        }
        
        return prompt;
    }

    /**
     * Get Mermaid template for diagram type
     */
    private getDiagramTemplate(type: DiagramType): string {
        const templates: Record<DiagramType, string> = {
            sequence: `\`\`\`mermaid
sequenceDiagram
    participant A as Actor
    participant S as System
    A->>S: Request
    S-->>A: Response
\`\`\``,
            flowchart: `\`\`\`mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[Other]
\`\`\``,
            erd: `\`\`\`mermaid
erDiagram
    ENTITY1 ||--o{ ENTITY2 : has
    ENTITY1 {
        string id PK
        string name
    }
\`\`\``,
            classDiagram: `\`\`\`mermaid
classDiagram
    class ClassName {
        +property: type
        +method(): returnType
    }
\`\`\``,
            stateDiagram: `\`\`\`mermaid
stateDiagram-v2
    [*] --> State1
    State1 --> State2
    State2 --> [*]
\`\`\``,
            c4: `\`\`\`mermaid
C4Context
    Person(user, "User")
    System(system, "System")
    Rel(user, system, "Uses")
\`\`\``,
            gantt: `\`\`\`mermaid
gantt
    title Timeline
    section Phase
    Task1 :a1, 2024-01-01, 30d
\`\`\``,
            pie: `\`\`\`mermaid
pie title Distribution
    "A" : 40
    "B" : 60
\`\`\``
        };
        return templates[type] || '';
    }

    /**
     * Default system prompt fallback
     */
    private getDefaultSystemPrompt(): string {
        return `You are an expert code analyst. Analyze repositories thoroughly 
and provide accurate, well-structured documentation in SPEC-OS format.`;
    }

    /**
     * Default output schema fallback
     */
    private getDefaultOutputSchema(): string {
        return `## Output Format (MANDATORY)

Every output MUST include:

### YAML Frontmatter
\`\`\`yaml
---
uid: {project}:spec:{section}
title: "{Title}"
status: draft
version: 1.0.0
created: {date}
prompt_version: {prompt-id}@v{version}
edges:
  - [[{project}:spec:{related}|{edge_type}]]
tags: [spec, {category}]
---
\`\`\`

### Citation Rules
- ALWAYS cite file paths: \`src/file.ts:42\`
- NEVER invent information
- Write "NOT_FOUND" if data unavailable
`;
    }
}

/**
 * Factory function
 */
export function createPromptRouter(registry: PromptRegistry, promptsDir: string): PromptRouter {
    return new PromptRouter(registry, promptsDir);
}
