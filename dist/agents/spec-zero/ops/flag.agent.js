import { RepoSpecZeroAgent } from '../base.js';
export class FlagAgent extends RepoSpecZeroAgent {
    id = 'flag';
    name = 'Feature Flag Analysis';
    description = 'Analyzes feature flags and configuration';
    systemPrompt = 'You are an expert in software configuration and feature management.';
    promptFile = 'feature_flags.md';
    contextDeps = ['overview'];
    category = 'ops';
    outputFile = 'flag.md';
}
//# sourceMappingURL=flag.agent.js.map