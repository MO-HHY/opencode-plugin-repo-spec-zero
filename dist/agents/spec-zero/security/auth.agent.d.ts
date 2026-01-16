import { RepoSpecZeroAgent } from '../base.js';
export declare class AuthAgent extends RepoSpecZeroAgent {
    readonly id = "auth";
    readonly name = "Authentication Analysis";
    readonly description = "Analyzes authentication mechanisms";
    readonly systemPrompt = "You are an expert security architect specializing in authentication.";
    readonly promptFile = "authentication.md";
    readonly contextDeps: never[];
    readonly category = "security";
    readonly outputFile = "auth.md";
}
//# sourceMappingURL=auth.agent.d.ts.map