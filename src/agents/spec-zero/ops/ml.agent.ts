import { RepoSpecZeroAgent } from '../base.js';

export class MlAgent extends RepoSpecZeroAgent {
    readonly id = 'ml';
    readonly name = 'ML Services Analysis';
    readonly description = 'Analyzes ML/AI services';
    readonly systemPrompt = 'You are an expert in Machine Learning engineering.';
    readonly promptFile = 'ml_services.md';
    readonly contextDeps = ['overview'];
    readonly category = 'ops';
    readonly outputFile = 'ml.md';
}
