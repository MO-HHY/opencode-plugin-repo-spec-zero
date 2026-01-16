/**
 * NativeLLMSkill - Uses OpenCode's session.prompt() API to interact with LLM
 *
 * The OpenCode SDK provides client.session.prompt() for LLM interactions.
 * This skill creates a temporary session, sends the prompt, and extracts the response.
 */
export class NativeLLMSkill {
    client;
    sessionCache = new Map();
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
            // Create a new session for this analysis
            const sessionResult = await this.client.session.create({
                body: {
                    title: `SpecZero Analysis - ${Date.now()}`
                }
            });
            if (!sessionResult.data?.id) {
                return { success: false, error: "Failed to create session for LLM analysis" };
            }
            const sessionId = sessionResult.data.id;
            // Combine system prompt and user prompt into a single message
            const combinedPrompt = `${safeSystemPrompt}\n\n---\n\n${safeUserPrompt}`;
            // Send prompt to the session
            const promptResult = await this.client.session.prompt({
                path: { id: sessionId },
                body: {
                    parts: [
                        { type: 'text', text: combinedPrompt }
                    ]
                }
            });
            // Extract response content from the result
            let content = "";
            if (promptResult.data) {
                // The response structure may vary - handle multiple formats
                const data = promptResult.data;
                if (typeof data === 'string') {
                    content = data;
                }
                else if (data.content && typeof data.content === 'string') {
                    content = data.content;
                }
                else if (data.text && typeof data.text === 'string') {
                    content = data.text;
                }
                else if (data.message?.content) {
                    content = String(data.message.content);
                }
                else if (data.parts && Array.isArray(data.parts)) {
                    // Extract text from parts array
                    content = data.parts
                        .filter((p) => p.type === 'text' && p.text)
                        .map((p) => p.text)
                        .join('\n');
                }
                else if (data.messages && Array.isArray(data.messages)) {
                    // Extract from messages array (assistant responses)
                    const assistantMessages = data.messages.filter((m) => m.role === 'assistant');
                    if (assistantMessages.length > 0) {
                        const lastMessage = assistantMessages[assistantMessages.length - 1];
                        content = lastMessage.content || lastMessage.text || JSON.stringify(lastMessage);
                    }
                }
                // Fallback: stringify the entire response
                if (!content && data) {
                    content = JSON.stringify(data);
                }
            }
            // Defensive: Ensure content is always a string
            content = String(content || '');
            // Clean up session (fire and forget)
            this.client.session.delete({ path: { id: sessionId } }).catch(() => { });
            if (!content.trim()) {
                return { success: false, error: "LLM returned empty content" };
            }
            return { success: true, data: content };
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            console.error('[NativeLLMSkill] Error:', errorMessage);
            return { success: false, error: `Native LLM Chat failed: ${errorMessage}` };
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