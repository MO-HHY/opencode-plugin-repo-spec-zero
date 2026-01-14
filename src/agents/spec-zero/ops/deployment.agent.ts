import { RepoSpecZeroAgent } from '../base.js';

export class DeploymentAgent extends RepoSpecZeroAgent {
    readonly id = 'deployment';
    readonly name = 'Deployment Analysis';
    readonly description = 'Analyzes deployment pipelines and infrastructure';
    readonly systemPrompt = 'You are an expert DevOps engineer.';
    readonly promptFile = 'deployment.md';
    readonly contextDeps = ['overview', 'dependency'];
    readonly category = 'ops';
    readonly outputFile = 'deployment.md';
}
