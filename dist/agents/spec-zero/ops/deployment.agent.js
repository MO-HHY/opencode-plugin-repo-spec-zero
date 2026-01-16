import { RepoSpecZeroAgent } from '../base.js';
export class DeploymentAgent extends RepoSpecZeroAgent {
    id = 'deployment';
    name = 'Deployment Analysis';
    description = 'Analyzes deployment pipelines and infrastructure';
    systemPrompt = 'You are an expert DevOps engineer.';
    promptFile = 'deployment.md';
    contextDeps = ['overview', 'dependency'];
    category = 'ops';
    outputFile = 'deployment.md';
}
//# sourceMappingURL=deployment.agent.js.map