import { RepoSpecZeroAgent } from '../base.js';
export declare class DeploymentAgent extends RepoSpecZeroAgent {
    readonly id = "deployment";
    readonly name = "Deployment Analysis";
    readonly description = "Analyzes deployment pipelines and infrastructure";
    readonly systemPrompt = "You are an expert DevOps engineer.";
    readonly promptFile = "deployment.md";
    readonly contextDeps: string[];
    readonly category = "ops";
    readonly outputFile = "deployment.md";
}
//# sourceMappingURL=deployment.agent.d.ts.map