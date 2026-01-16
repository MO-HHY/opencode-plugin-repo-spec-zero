import { RepoSpecZeroAgent } from '../base.js';
export class DependencyAgent extends RepoSpecZeroAgent {
    id = 'dependency';
    name = 'Dependency Analysis';
    description = 'Analyzes external and internal dependencies';
    systemPrompt = 'You are an expert in dependency management and software supply chain.';
    promptFile = 'dependencies.md';
    contextDeps = ['overview'];
    category = 'integration';
    outputFile = 'dependency.md';
}
//# sourceMappingURL=dependency.agent.js.map