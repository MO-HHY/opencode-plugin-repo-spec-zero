import { RepoSpecZeroAgent } from '../base.js';
export declare class FlagAgent extends RepoSpecZeroAgent {
    readonly id = "flag";
    readonly name = "Feature Flag Analysis";
    readonly description = "Analyzes feature flags and configuration";
    readonly systemPrompt = "You are an expert in software configuration and feature management.";
    readonly promptFile = "feature_flags.md";
    readonly contextDeps: string[];
    readonly category = "ops";
    readonly outputFile = "flag.md";
}
//# sourceMappingURL=flag.agent.d.ts.map