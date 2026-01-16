import { RepoSpecZeroAgent } from '../base.js';
export declare class ServiceDepAgent extends RepoSpecZeroAgent {
    readonly id = "service_dep";
    readonly name = "Service Dependency Analysis";
    readonly description = "Analyzes service-to-service dependencies and integration patterns";
    readonly systemPrompt = "You are an expert in microservices and integration architecture.";
    readonly promptFile = "service_dependencies.md";
    readonly contextDeps: string[];
    readonly category = "integration";
    readonly outputFile = "service_dep.md";
}
//# sourceMappingURL=service-dep.agent.d.ts.map