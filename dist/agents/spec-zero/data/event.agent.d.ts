import { RepoSpecZeroAgent } from '../base.js';
export declare class EventAgent extends RepoSpecZeroAgent {
    readonly id = "event";
    readonly name = "Event Analysis";
    readonly description = "Analyzes event-driven architecture";
    readonly systemPrompt = "You are an expert in event-driven systems.";
    readonly promptFile = "events.md";
    readonly contextDeps: never[];
    readonly category = "data";
    readonly outputFile = "event.md";
}
//# sourceMappingURL=event.agent.d.ts.map