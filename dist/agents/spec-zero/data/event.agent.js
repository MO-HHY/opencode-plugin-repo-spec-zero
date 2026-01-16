import { RepoSpecZeroAgent } from '../base.js';
export class EventAgent extends RepoSpecZeroAgent {
    id = 'event';
    name = 'Event Analysis';
    description = 'Analyzes event-driven architecture';
    systemPrompt = 'You are an expert in event-driven systems.';
    promptFile = 'events.md';
    contextDeps = [];
    category = 'data';
    outputFile = 'event.md';
}
//# sourceMappingURL=event.agent.js.map