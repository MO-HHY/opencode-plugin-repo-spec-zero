export class NativeLLMSkill {
    client;
    constructor(client) {
        this.client = client;
    }
    async execute(params) {
        const systemPrompt = params.systemPrompt;
        const userPrompt = params.userPrompt;
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
            const response = await this.client.llm.chat({
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
            }
            else if (response && typeof response.content === 'string') {
                content = response.content;
            }
            else if (response && response.message && typeof response.message.content === 'string') {
                content = response.message.content;
            }
            else {
                // Fallback: stringify but guard against undefined
                content = JSON.stringify(response) || '';
            }
            // Defensive: Ensure content is always a string
            content = String(content || '');
            if (!content.trim()) {
                return { success: false, error: "LLM returned empty content" };
            }
            return { success: true, data: content };
        }
        catch (error) {
            return { success: false, error: `Native LLM Chat failed: ${error?.message || 'Unknown error'}` };
        }
    }
    // Convenience alias for direct usage outside of skill framework if needed
    async analyze(systemPrompt, userPrompt) {
        const res = await this.execute({ systemPrompt, userPrompt });
        if (!res.success)
            throw new Error(res.error);
        return res.data;
    }
}
//# sourceMappingURL=native-llm.skill.js.map