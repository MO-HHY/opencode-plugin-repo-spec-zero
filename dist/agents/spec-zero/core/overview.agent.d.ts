import { RepoSpecZeroAgent } from '../base.js';
export declare class OverviewAgent extends RepoSpecZeroAgent {
    readonly id = "overview";
    readonly name = "Overview Analysis";
    readonly description = "Provides a high-level overview of the codebase";
    readonly systemPrompt = "You are an expert software architect providing a high-level overview.";
    readonly promptFile = "hl_overview.md";
    readonly contextDeps: never[];
    readonly category = "core";
    readonly outputFile = "overview.md";
}
//# sourceMappingURL=overview.agent.d.ts.map