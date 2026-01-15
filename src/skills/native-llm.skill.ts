import type { PluginInput } from '@opencode-ai/plugin';
import type { SkillExecutor, SkillResult } from '../agents/base.js';

type Client = PluginInput['client'];

export class NativeLLMSkill implements SkillExecutor {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute<T = string>(params: Record<string, unknown>): Promise<SkillResult<T>> {
        const systemPrompt = params.systemPrompt as string;
        const userPrompt = params.userPrompt as string;

        if (!systemPrompt || !userPrompt) {
            return { success: false, error: "Missing systemPrompt or userPrompt in params" };
        }

        try {
            const response = await (this.client as any).llm.chat({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            });

            let content = "";
            if (typeof response === 'string') content = response;
            else if (response && response.content) content = response.content;
            else content = JSON.stringify(response);

            return { success: true, data: content as T };

        } catch (error: any) {
            return { success: false, error: `Native LLM Chat failed: ${error.message}` };
        }
    }

    // Convenience alias for direct usage outside of skill framework if needed
    async analyze(systemPrompt: string, userPrompt: string): Promise<string> {
        const res = await this.execute<string>({ systemPrompt, userPrompt });
        if (!res.success) throw new Error(res.error);
        return res.data!;
    }
}
