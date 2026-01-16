import { RepoSpecZeroAgent } from '../base.js';
export class ServiceDepAgent extends RepoSpecZeroAgent {
    id = 'service_dep';
    name = 'Service Dependency Analysis';
    description = 'Analyzes service-to-service dependencies and integration patterns';
    systemPrompt = 'You are an expert in microservices and integration architecture.';
    promptFile = 'service_dependencies.md';
    contextDeps = ['overview', 'api', 'event'];
    category = 'integration';
    outputFile = 'service_dep.md';
}
//# sourceMappingURL=service-dep.agent.js.map