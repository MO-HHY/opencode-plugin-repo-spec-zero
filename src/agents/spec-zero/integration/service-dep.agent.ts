import { RepoSpecZeroAgent } from '../base.js';

export class ServiceDepAgent extends RepoSpecZeroAgent {
    readonly id = 'service_dep';
    readonly name = 'Service Dependency Analysis';
    readonly description = 'Analyzes service-to-service dependencies and integration patterns';
    readonly systemPrompt = 'You are an expert in microservices and integration architecture.';
    readonly promptFile = 'service_dependencies.md';
    readonly contextDeps = ['overview', 'api', 'event'];
    readonly category = 'integration';
    readonly outputFile = 'service_dep.md';
}
