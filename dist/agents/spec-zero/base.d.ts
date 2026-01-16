import { SubAgent } from '../base.js';
import type { AgentContext, AgentResult } from '../../types.js';
export declare abstract class RepoSpecZeroAgent extends SubAgent {
    abstract readonly promptFile: string;
    abstract readonly contextDeps: string[];
    abstract readonly outputFile: string;
    abstract readonly category: string;
    readonly triggers: never[];
    process(context: AgentContext): Promise<AgentResult>;
    private loadPrompt;
    private buildContext;
}
//# sourceMappingURL=base.d.ts.map