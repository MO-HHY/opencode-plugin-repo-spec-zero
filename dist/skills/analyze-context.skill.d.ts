export declare class AnalyzeContextSkill {
    private client;
    private logger;
    constructor(apiKey: string | undefined, logger: any);
    analyze(promptTemplate: string, repoStructure: string, previousContext?: string, configOverrides?: any): Promise<string>;
    private cleanPrompt;
}
//# sourceMappingURL=analyze-context.skill.d.ts.map