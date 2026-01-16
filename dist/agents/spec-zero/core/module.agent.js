import { RepoSpecZeroAgent } from '../base.js';
export class ModuleAgent extends RepoSpecZeroAgent {
    id = 'module';
    name = 'Module Analysis';
    description = 'Analyzes key modules and their responsibilities';
    systemPrompt = 'You are an expert software architect analyzing code modules.';
    promptFile = 'module_deep_dive.md';
    contextDeps = ['overview'];
    category = 'core';
    outputFile = 'module.md';
}
//# sourceMappingURL=module.agent.js.map