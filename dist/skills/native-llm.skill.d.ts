import type { PluginInput } from '@opencode-ai/plugin';
import type { SkillExecutor, SkillResult } from '../agents/base.js';
type Client = PluginInput['client'];
/**
 * NativeLLMSkill - Uses OpenCode's session.prompt() API to interact with LLM
 *
 * The OpenCode SDK provides client.session.prompt() for LLM interactions.
 * This skill creates a temporary session, sends the prompt, and extracts the response.
 */
export declare class NativeLLMSkill implements SkillExecutor {
    private client;
    private sessionCache;
    constructor(client: Client);
    execute<T = string>(params: Record<string, unknown>): Promise<SkillResult<T>>;
    analyze(systemPrompt: string, userPrompt: string): Promise<string>;
}
export {};
//# sourceMappingURL=native-llm.skill.d.ts.map