import { RepoSpecZeroAgent } from '../base.js';
export class MlAgent extends RepoSpecZeroAgent {
    id = 'ml';
    name = 'ML Services Analysis';
    description = 'Analyzes ML/AI services';
    systemPrompt = 'You are an expert in Machine Learning engineering.';
    promptFile = 'ml_services.md';
    contextDeps = ['overview'];
    category = 'ops';
    outputFile = 'ml.md';
}
//# sourceMappingURL=ml.agent.js.map