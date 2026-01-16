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

        // Defensive: Ensure prompts are valid strings
        const safeSystemPrompt = String(systemPrompt || '');
        const safeUserPrompt = String(userPrompt || '');

        if (!safeSystemPrompt.trim() || !safeUserPrompt.trim()) {
            return { success: false, error: "Empty systemPrompt or userPrompt after sanitization" };
        }

        try {
            const response = await (this.client as any).llm.chat({
                messages: [
                    { role: 'system', content: safeSystemPrompt },
                    { role: 'user', content: safeUserPrompt }
                ]
            });

            // Defensive: Handle undefined/null response
            if (response === undefined || response === null) {
                return { success: false, error: "LLM returned undefined or null response" };
            }

            let content = "";
            if (typeof response === 'string') {
                content = response;
            } else if (response && typeof response.content === 'string') {
                content = response.content;
            } else if (response && response.message && typeof response.message.content === 'string') {
                content = response.message.content;
            } else {
                // Fallback: stringify but guard against undefined
                content = JSON.stringify(response) || '';
            }

            // Defensive: Ensure content is always a string
            content = String(content || '');

            if (!content.trim()) {
                return { success: false, error: "LLM returned empty content" };
            }

            return { success: true, data: content as T };

        } catch (error: any) {
            return { success: false, error: `Native LLM Chat failed: ${error?.message || 'Unknown error'}` };
        }
    }

    // Convenience alias for direct usage outside of skill framework if needed
    async analyze(systemPrompt: string, userPrompt: string): Promise<string> {
        const res = await this.execute<string>({ systemPrompt, userPrompt });
        if (!res.success) throw new Error(res.error);
        return res.data!;
    }
}
