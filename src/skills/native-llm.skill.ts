import type { PluginInput } from '@opencode-ai/plugin';
import type { SkillExecutor, SkillResult } from '../agents/base.js';

type Client = PluginInput['client'];

/**
 * NativeLLMSkill - Uses OpenCode's session.prompt() API to interact with LLM
 * 
 * The OpenCode SDK provides client.session.prompt() for LLM interactions.
 * This skill creates a temporary session, sends the prompt, and extracts the response.
 */
export class NativeLLMSkill implements SkillExecutor {
    private client: Client;
    private sessionCache: Map<string, string> = new Map();

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
                const data = promptResult.data as any;
                
                if (typeof data === 'string') {
                    content = data;
                } else if (data.content && typeof data.content === 'string') {
                    content = data.content;
                } else if (data.text && typeof data.text === 'string') {
                    content = data.text;
                } else if (data.message?.content) {
                    content = String(data.message.content);
                } else if (data.parts && Array.isArray(data.parts)) {
                    // Extract text from parts array
                    content = data.parts
                        .filter((p: any) => p.type === 'text' && p.text)
                        .map((p: any) => p.text)
                        .join('\n');
                } else if (data.messages && Array.isArray(data.messages)) {
                    // Extract from messages array (assistant responses)
                    const assistantMessages = data.messages.filter((m: any) => m.role === 'assistant');
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
            this.client.session.delete({ path: { id: sessionId } }).catch(() => {});

            if (!content.trim()) {
                return { success: false, error: "LLM returned empty content" };
            }

            return { success: true, data: content as T };

        } catch (error: any) {
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            console.error('[NativeLLMSkill] Error:', errorMessage);
            return { success: false, error: `Native LLM Chat failed: ${errorMessage}` };
        }
    }

    // Convenience alias for direct usage outside of skill framework if needed
    async analyze(systemPrompt: string, userPrompt: string): Promise<string> {
        const res = await this.execute<string>({ systemPrompt, userPrompt });
        if (!res.success) throw new Error(res.error);
        return res.data!;
    }
}
