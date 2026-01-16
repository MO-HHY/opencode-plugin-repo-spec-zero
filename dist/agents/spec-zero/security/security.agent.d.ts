import { RepoSpecZeroAgent } from '../base.js';
export declare class SecurityAgent extends RepoSpecZeroAgent {
    readonly id = "security";
    readonly name = "General Security Analysis";
    readonly description = "Performs general security analysis and vulnerability check";
    readonly systemPrompt = "You are an expert security auditor.";
    readonly promptFile = "security_check.md";
    readonly contextDeps: never[];
    readonly category = "security";
    readonly outputFile = "security.md";
}
//# sourceMappingURL=security.agent.d.ts.map