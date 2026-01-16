import Anthropic from '@anthropic-ai/sdk';
import { CONFIG } from '../core/config.js';
export class AnalyzeContextSkill {
    client;
    logger;
    constructor(apiKey, logger) {
        this.logger = logger;
        const key = apiKey || process.env.ANTHROPIC_API_KEY;
        if (!key) {
            this.logger.error("No Anthropic API Key provided");
        }
        this.client = new Anthropic({
            apiKey: key,
        });
    }
    async analyze(promptTemplate, repoStructure, previousContext = "", configOverrides = {}) {
        const cleanedTemplate = this.cleanPrompt(promptTemplate);
        let prompt = cleanedTemplate.replace("{repo_structure}", repoStructure);
        if (previousContext) {
            const contextSection = `\n\n## Previous Analysis Context\n\n${previousContext}\n\n`;
            prompt = prompt.replace("{previous_context}", contextSection);
        }
        else {
            prompt = prompt.replace("{previous_context}", "");
        }
        const model = configOverrides.claude_model || CONFIG.CLAUDE_MODEL;
        const maxTokens = configOverrides.max_tokens || CONFIG.MAX_TOKENS;
        this.logger.info(`Sending analysis request to Claude (${model})`);
        try {
            const response = await this.client.messages.create({
                model: model,
                max_tokens: maxTokens,
                messages: [{ role: "user", content: prompt }],
            });
            // Handle response content block
            const contentBlock = response.content[0];
            if (contentBlock.type === 'text') {
                return contentBlock.text;
            }
            return "";
        }
        catch (error) {
            this.logger.error(`Claude API request failed: ${error}`);
            throw error;
        }
    }
    cleanPrompt(template) {
        if (!template)
            return "";
        const lines = template.split('\n');
        // Remove version line if present
        if (lines.length > 0 && lines[0].startsWith('version')) {
            let i = 1;
            while (i < lines.length && lines[i].trim() === '')
                i++;
            return lines.slice(i).join('\n');
        }
        return template;
    }
}
//# sourceMappingURL=analyze-context.skill.js.map