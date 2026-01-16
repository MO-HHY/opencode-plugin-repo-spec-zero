/**
 * StructureBuilderAgent - Pre-write folder structure initialization
 *
 * Layer 8.5 agent that runs after summary but before write-specs.
 * Responsibilities:
 * - Ensure _generated/ subdirectories exist
 * - Create _templates/ and _diagrams/ if needed
 * - Validate folder structure matches schema version
 *
 * Only runs in GENERATION mode (first-time analysis).
 */
import { SubAgent } from '../../base.js';
import type { AgentContext, AgentResult } from '../../../types.js';
export interface StructureBuilderResult {
    /** Path to specs folder */
    specsPath: string;
    /** Detected repo type */
    repoType: string;
    /** Whether structure was created */
    structureCreated: boolean;
    /** Subdirectories created */
    subdirectoriesCreated: string[];
}
export declare class StructureBuilderAgent extends SubAgent {
    readonly id = "structure_builder";
    readonly name = "Structure Builder Agent";
    readonly description = "Initializes folder structure for specs output in v2.1.0 hierarchical format.";
    readonly systemPrompt = "You are the folder structure builder for spec generation.";
    readonly triggers: RegExp[];
    process(context: AgentContext): Promise<AgentResult>;
}
//# sourceMappingURL=structure-builder.agent.d.ts.map