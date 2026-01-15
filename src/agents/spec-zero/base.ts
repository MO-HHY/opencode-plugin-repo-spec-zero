import { BaseAgent, SubAgent } from '../base.js';
import type { AgentContext, AgentResult } from '../../types.js';

import type { OutputWriterSkill } from '../../skills/output-writer.skill.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from '../../core/config.js';

export abstract class RepoSpecZeroAgent extends SubAgent {
    abstract readonly promptFile: string;
    abstract readonly contextDeps: string[];
    abstract readonly outputFile: string;
    abstract readonly category: string; // e.g., 'core', 'data', 'security'

    // Triggers can be generic for these agents as they are mostly orchestrated
    readonly triggers = [];

    async process(context: AgentContext): Promise<AgentResult> {
        const { client } = context;
        const params = context.params || {};
        const repoStructure = params.repoStructure as string;
        const projectSlug = params.projectSlug as string;
        const baseDir = params.baseDir as string;

        // Previous results should be passed in params or accessible via context
        // For simplicity, let's assume orchestrator passes a map of "agentId" -> "outputContent"
        const allResults = params.allResults as Record<string, string> || {};

        if (!repoStructure || !projectSlug || !baseDir) {
            return { success: false, message: 'Missing required params: repoStructure, projectSlug, baseDir' };
        }

        try {
            // 1. Resolve Prompt
            // The prompt file path is relative to the prompts directory (e.g. "generic/hl_overview.md")
            // But wait, the detection logic gives us the directory (e.g. "frontend").
            // The agents are generic in class definition, but the *prompt file* might vary by repo type?
            // The plan says: "Agent ID: overview, Prompt: hl_overview.md".
            // And "SpecZeroDetectionSkill" returns the *type*.
            // So the actual prompt path is `prompts/${repoType}/${this.promptFile}`.
            // If not found, fallback to `prompts/generic/${this.promptFile}`.

            const repoType = params.repoType as string || 'generic';
            const promptContent = this.loadPrompt(repoType, this.promptFile);

            // 2. Build Context from Deps
            const previousContext = this.buildContext(allResults);

            // 3. Execute Analysis (using AnalyzeContextSkill)
            // We need to access the skill instance. In BaseAgent, we have `skills` map.
            // We assume 'repo_spec_zero_analyze_context' is registered or we use the class directly if we had dependency injection.
            // Since we are inside the plugin, we can rely on the `skills` map populated by `registerSkill`.

            // However, `BaseAgent` structure in `base.ts` has `protected skills: Map<string, SkillExecutor>`.
            // Let's use that.
            // 3. Execute Analysis (using NativeLLMSkill)
            const nativeLLM = this.skills.get('native_llm');
            if (!nativeLLM) {
                return { success: false, message: 'Native LLM skill not found' };
            }

            // Prepare combined user prompt (Context + Tree)
            let userPrompt = `Repository Structure:\n${repoStructure}\n`;
            if (previousContext) {
                userPrompt += `\nPrevious Analysis Context:\n${previousContext}\n`;
            }

            // Execute via SkillExecutor interface
            const analysisResultRaw = await nativeLLM.execute<string>({
                systemPrompt: promptContent,
                userPrompt: userPrompt
            });

            if (!analysisResultRaw.success || !analysisResultRaw.data) {
                throw new Error(analysisResultRaw.error || "Empty response from Native LLM");
            }
            const analysisResult = analysisResultRaw.data;

            // 4. Write Output
            const writerExecutor = this.skills.get('repo_spec_zero_write_output');
            // Actually, OutputWriterSkill has `writeAnalysisFile`, but the wrapper tool `repo_spec_zero_write_output` might just do the structure.
            // We might need to call the skill directly or have a tool for writing specific files.
            // Let's assume we can use the `OutputWriterSkill` directly or we bind a tool for it.
            // For now, let's just use `fs` directly here or assume the orchestrator handles writing? 
            // The plan says: "WRITE: OutputWriterSkill.createStructure...". 
            // But the agent base class says: "await ctx.writeOutput(this.outputFile, result);"
            // Let's implement writing logic here using `OutputWriterSkill` logic (re-instantiated or passed).
            // Better: let's assume the orchestrator will write it, or we do it here. 
            // To keep agents autonomous, they should write their own output.
            // I'll add a helper to write the file.

            const specDir = path.join(baseDir, `${projectSlug}-spec`);
            const fullPath = path.join(specDir, 'analysis', this.category, this.outputFile);

            // Ensure dir exists (OutputWriterSkill.createStructure should have done it, but just in case)
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, analysisResult);

            return {
                success: true,
                data: {
                    output: analysisResult,
                    path: fullPath
                },
                message: `Completed analysis for ${this.id}`
            };

        } catch (error: any) {
            return { success: false, message: `Agent ${this.id} failed: ${error.message}` };
        }
    }

    private loadPrompt(repoType: string, filename: string): string {
        // Resolve plugin root directory relative to this file
        // dist/agents/spec-zero/base.js -> ../../../ -> root
        // src/agents/spec-zero/base.ts -> ../../../ -> root
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const rootDir = path.resolve(__dirname, '../../../../');

        // Note: In some build setups, dist/ might vary, so we might need robust check. 
        // But assuming standard tsc output matching src structure:
        // src/agents/spec-zero/base.ts -> 3 levels down from src, which is 1 level from root = 4 levels?
        // src/agents/spec-zero/base.ts -> spec-zero(1) -> agents(2) -> src(3) -> root(4)? No.
        // path.dirname(base.ts) = spec-zero. 
        // spec-zero -> agents -> src -> root. That is 3 ".." jumps.
        // Let's verify: 
        // /root/src/agents/spec-zero/base.ts
        // path.dirname = /root/src/agents/spec-zero
        // resolve(.., '..') = /root/src/agents
        // resolve(.., '../..') = /root/src
        // resolve(.., '../../..') = /root

        // However, if we are in dist/agents/spec-zero/base.js:
        // /root/dist/agents/spec-zero/base.js
        // Same depth.

        // If prompts are in /root/prompts:
        const promptsDir = path.join(rootDir, 'prompts'); // CONFIG.PROMPTS_DIR might be 'prompts'
        const typePath = path.join(promptsDir, repoType, filename);
        const genericPath = path.join(promptsDir, 'generic', filename);
        const sharedPath = path.join(promptsDir, 'shared', filename);

        if (fs.existsSync(typePath)) return fs.readFileSync(typePath, 'utf-8');
        if (fs.existsSync(genericPath)) return fs.readFileSync(genericPath, 'utf-8');
        if (fs.existsSync(sharedPath)) return fs.readFileSync(sharedPath, 'utf-8');

        // Fallback: Check if we are in dev mode or structure is different (e.g. prompts copied to dist)
        // Try resolving from process.cwd temporarily if the above fails, mainly for local testing if links are weird?
        // No, we want to ABOLISH process.cwd dependency.

        throw new Error(`Prompt file ${filename} not found in ${promptsDir} (checked: ${typePath}, ${genericPath}, ${sharedPath})`);
    }

    private buildContext(allResults: Record<string, string>): string {
        let context = "";
        for (const depId of this.contextDeps) {
            if (allResults[depId]) {
                context += `\n--- Output from ${depId} ---\n${allResults[depId]}\n`;
            }
        }
        return context;
    }
}
