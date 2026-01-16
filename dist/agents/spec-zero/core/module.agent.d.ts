import { RepoSpecZeroAgent } from '../base.js';
export declare class ModuleAgent extends RepoSpecZeroAgent {
    readonly id = "module";
    readonly name = "Module Analysis";
    readonly description = "Analyzes key modules and their responsibilities";
    readonly systemPrompt = "You are an expert software architect analyzing code modules.";
    readonly promptFile = "module_deep_dive.md";
    readonly contextDeps: string[];
    readonly category = "core";
    readonly outputFile = "module.md";
}
//# sourceMappingURL=module.agent.d.ts.map