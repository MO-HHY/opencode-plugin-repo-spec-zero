import { RepoSpecZeroAgent } from '../base.js';

export class FlagAgent extends RepoSpecZeroAgent {
    readonly id = 'flag';
    readonly name = 'Feature Flag Analysis';
    readonly description = 'Analyzes feature flags and configuration';
    readonly systemPrompt = 'You are an expert in software configuration and feature management.';
    readonly promptFile = 'feature_flags.md';
    readonly contextDeps = ['overview'];
    readonly category = 'ops';
    readonly outputFile = 'flag.md';
}
