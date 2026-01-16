import { RepoSpecZeroAgent } from '../base.js';
export declare class MonitorAgent extends RepoSpecZeroAgent {
    readonly id = "monitor";
    readonly name = "Monitoring Analysis";
    readonly description = "Analyzes observability and monitoring";
    readonly systemPrompt = "You are an expert SRE and observability engineer.";
    readonly promptFile = "monitoring.md";
    readonly contextDeps: never[];
    readonly category = "ops";
    readonly outputFile = "monitor.md";
}
//# sourceMappingURL=monitor.agent.d.ts.map