import { RepoSpecZeroAgent } from '../base.js';
export class MonitorAgent extends RepoSpecZeroAgent {
    id = 'monitor';
    name = 'Monitoring Analysis';
    description = 'Analyzes observability and monitoring';
    systemPrompt = 'You are an expert SRE and observability engineer.';
    promptFile = 'monitoring.md';
    contextDeps = [];
    category = 'ops';
    outputFile = 'monitor.md';
}
//# sourceMappingURL=monitor.agent.js.map