/**
 * Bootstrap Agent - Reads key files into SharedContext
 *
 * This is the first agent in the DAG execution chain.
 * It reads critical files like package.json, README, configs etc.
 * and populates the SharedContext for downstream agents.
 */
import { SubAgent } from '../base.js';
import type { AgentContext, AgentResult } from '../../types.js';
export declare class BootstrapAgent extends SubAgent {
    readonly id = "bootstrap";
    readonly name = "Bootstrap Agent";
    readonly description = "Reads key repository files into shared context for downstream agents.";
    readonly systemPrompt = "You are a bootstrap agent that prepares context for analysis.";
    readonly triggers: never[];
    private static readonly ADDITIONAL_KEY_FILES;
    process(context: AgentContext): Promise<AgentResult>;
    /**
     * Get key files for a specific repo type
     */
    private getKeyFilesForType;
    /**
     * Load files matching a simple glob pattern
     */
    private loadGlobPattern;
    /**
     * Detect and load additional important files based on repo structure
     */
    private detectAdditionalFiles;
}
//# sourceMappingURL=bootstrap.agent.d.ts.map