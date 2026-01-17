import { DiagramType, GeneratedDiagram, AgentContext } from '../types';
/**
 * DiagramGenerator - Generates Mermaid diagrams from analysis content
 *
 * Capability:
 * 1. Extract diagrams from LLM output
 * 2. Generate diagrams from structured data
 * 3. Validate Mermaid syntax
 * 4. Create standalone files with frontmatter
 */
export declare class DiagramGenerator {
    /**
     * Generates a diagram based on analysis content
     */
    generate(type: DiagramType, analysisContent: string, context: AgentContext): Promise<GeneratedDiagram | null>;
    /**
     * Entity Relationship Diagram Generator
     */
    private generateERD;
    /**
     * Sequence Diagram Generator
     */
    private generateSequence;
    /**
     * Flowchart Diagram Generator
     */
    private generateFlowchart;
    /**
     * Class Diagram Generator
     */
    private generateClassDiagram;
    /**
     * State Diagram Generator
     */
    private generateStateDiagram;
    /**
     * C4 Context Diagram Generator
     */
    private generateC4;
    private extractEntities;
    private extractFlows;
    private extractSteps;
    private extractClasses;
    private extractStates;
    private extractComponents;
    private mapERDCardinality;
    private sanitizeId;
    validateMermaid(content: string): boolean;
}
//# sourceMappingURL=diagram-generator.d.ts.map