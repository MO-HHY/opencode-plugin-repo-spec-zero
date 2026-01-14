import { RepoSpecZeroAgent } from '../base.js';

export class MonitorAgent extends RepoSpecZeroAgent {
    readonly id = 'monitor';
    readonly name = 'Monitoring Analysis';
    readonly description = 'Analyzes observability and monitoring';
    readonly systemPrompt = 'You are an expert SRE and observability engineer.';
    readonly promptFile = 'monitoring.md';
    readonly contextDeps = [];
    readonly category = 'ops';
    readonly outputFile = 'monitor.md';
}
