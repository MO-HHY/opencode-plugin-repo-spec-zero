import { RepoSpecZeroAgent } from '../base.js';
export class PromptSecAgent extends RepoSpecZeroAgent {
    id = 'prompt_sec';
    name = 'Prompt Security Analysis';
    description = 'Analyzes prompt injection and LLM security';
    systemPrompt = 'You are an expert in AI safety and prompt security.';
    promptFile = 'prompt_security_check.md';
    contextDeps = ['overview', 'ml'];
    category = 'security';
    outputFile = 'prompt_sec.md';
}
//# sourceMappingURL=prompt-sec.agent.js.map