import { RepoSpecZeroAgent } from '../base.js';
export declare class MlAgent extends RepoSpecZeroAgent {
    readonly id = "ml";
    readonly name = "ML Services Analysis";
    readonly description = "Analyzes ML/AI services";
    readonly systemPrompt = "You are an expert in Machine Learning engineering.";
    readonly promptFile = "ml_services.md";
    readonly contextDeps: string[];
    readonly category = "ops";
    readonly outputFile = "ml.md";
}
//# sourceMappingURL=ml.agent.d.ts.map