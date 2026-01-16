import { RepoSpecZeroAgent } from '../base.js';
export declare class DependencyAgent extends RepoSpecZeroAgent {
    readonly id = "dependency";
    readonly name = "Dependency Analysis";
    readonly description = "Analyzes external and internal dependencies";
    readonly systemPrompt = "You are an expert in dependency management and software supply chain.";
    readonly promptFile = "dependencies.md";
    readonly contextDeps: string[];
    readonly category = "integration";
    readonly outputFile = "dependency.md";
}
//# sourceMappingURL=dependency.agent.d.ts.map