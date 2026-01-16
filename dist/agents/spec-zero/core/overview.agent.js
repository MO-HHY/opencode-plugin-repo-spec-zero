import { RepoSpecZeroAgent } from '../base.js';
export class OverviewAgent extends RepoSpecZeroAgent {
    id = 'overview';
    name = 'Overview Analysis';
    description = 'Provides a high-level overview of the codebase';
    systemPrompt = 'You are an expert software architect providing a high-level overview.';
    // Prompt file relative to prompt dir (or shared)
    // In repo-swarm, hl_overview is in 'shared'.
    promptFile = 'hl_overview.md';
    contextDeps = [];
    category = 'core';
    outputFile = 'overview.md';
}
//# sourceMappingURL=overview.agent.js.map