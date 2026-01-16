import { RepoSpecZeroAgent } from '../base.js';
export declare class ApiAgent extends RepoSpecZeroAgent {
    readonly id = "api";
    readonly name = "API Analysis";
    readonly description = "Analyzes API endpoints and contracts";
    readonly systemPrompt = "You are an expert API architect.";
    readonly promptFile = "apis.md";
    readonly contextDeps: never[];
    readonly category = "integration";
    readonly outputFile = "api.md";
}
//# sourceMappingURL=api.agent.d.ts.map