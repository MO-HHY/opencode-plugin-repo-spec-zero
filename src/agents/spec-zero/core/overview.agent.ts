import { RepoSpecZeroAgent } from '../base.js';

export class OverviewAgent extends RepoSpecZeroAgent {
    readonly id = 'overview';
    readonly name = 'Overview Analysis';
    readonly description = 'Provides a high-level overview of the codebase';
    readonly systemPrompt = 'You are an expert software architect providing a high-level overview.';

    // Prompt file relative to prompt dir (or shared)
    // In repo-swarm, hl_overview is in 'shared'.
    readonly promptFile = 'hl_overview.md';
    readonly contextDeps = [];
    readonly category = 'core';
    readonly outputFile = 'overview.md';
}
