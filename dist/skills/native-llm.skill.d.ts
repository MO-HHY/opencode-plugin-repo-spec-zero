import type { PluginInput } from '@opencode-ai/plugin';
import type { SkillExecutor, SkillResult } from '../agents/base.js';
type Client = PluginInput['client'];
export declare class NativeLLMSkill implements SkillExecutor {
    private client;
    constructor(client: Client);
    execute<T = string>(params: Record<string, unknown>): Promise<SkillResult<T>>;
    analyze(systemPrompt: string, userPrompt: string): Promise<string>;
}
export {};
//# sourceMappingURL=native-llm.skill.d.ts.map