import { RepoSpecZeroAgent } from '../base.js';

export class DependencyAgent extends RepoSpecZeroAgent {
    readonly id = 'dependency';
    readonly name = 'Dependency Analysis';
    readonly description = 'Analyzes external and internal dependencies';
    readonly systemPrompt = 'You are an expert in dependency management and software supply chain.';
    readonly promptFile = 'dependencies.md';
    readonly contextDeps = ['overview'];
    readonly category = 'integration';
    readonly outputFile = 'dependency.md';
}
