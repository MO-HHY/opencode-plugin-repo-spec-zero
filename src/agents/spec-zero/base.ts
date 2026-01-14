import { BaseAgent } from '../base.js';
import type { AgentContext, AgentResult } from '@opencode-ai/plugin';
import type { AnalyzeContextSkill } from '../../skills/analyze-context.skill.js';
import type { OutputWriterSkill } from '../../skills/output-writer.skill.js';
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from '../../core/config.js';

export abstract class RepoSpecZeroAgent extends BaseAgent {
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
            const analyzeExecutor = this.skills.get('repo_spec_zero_analyze_context');
            if (!analyzeExecutor) {
                return { success: false, message: 'Analyze skill not found' };
            }

            const analysisResult = await analyzeExecutor.execute<string>({
                prompt: promptContent,
                repoStructure,
                prevContext: previousContext
            });

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
        // Try specific type first
        // Assuming prompts are copied to `dist/prompts` or `prompts` in root
        // In development, it's `prompts` in root.
        const rootDir = process.cwd(); // Should be plugin root
        const typePath = path.join(rootDir, CONFIG.PROMPTS_DIR, repoType, filename);
        const genericPath = path.join(rootDir, CONFIG.PROMPTS_DIR, 'generic', filename);
        // Also check shared folder if filename starts with "../shared" (which some do in the plan/legacy)
        // The plan lists "hl_overview.md". The legacy `base_prompts.json` had `"../shared/hl_overview.md"`.
        // I should probably normalize this. 
        // If the filename passed is just "hl_overview.md", I look in type/hl_overview.md.
        // If the legacy structure used shared, I should probably have flat "generic" folder or similar.
        // Let's try to find it.

        if (fs.existsSync(typePath)) return fs.readFileSync(typePath, 'utf-8');
        if (fs.existsSync(genericPath)) return fs.readFileSync(genericPath, 'utf-8');

        // Try 'shared' directory if it exists
        const sharedPath = path.join(rootDir, CONFIG.PROMPTS_DIR, 'shared', filename);
        if (fs.existsSync(sharedPath)) return fs.readFileSync(sharedPath, 'utf-8');

        throw new Error(`Prompt file ${filename} not found for type ${repoType} or generic`);
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
