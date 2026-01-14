import { RepoSpecZeroAgent } from '../base.js';

export class PromptSecAgent extends RepoSpecZeroAgent {
    readonly id = 'prompt_sec';
    readonly name = 'Prompt Security Analysis';
    readonly description = 'Analyzes prompt injection and LLM security';
    readonly systemPrompt = 'You are an expert in AI safety and prompt security.';
    readonly promptFile = 'prompt_security_check.md';
    readonly contextDeps = ['overview', 'ml'];
    readonly category = 'security';
    readonly outputFile = 'prompt_sec.md';
}
