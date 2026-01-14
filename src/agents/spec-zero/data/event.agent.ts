import { RepoSpecZeroAgent } from '../base.js';

export class EventAgent extends RepoSpecZeroAgent {
    readonly id = 'event';
    readonly name = 'Event Analysis';
    readonly description = 'Analyzes event-driven architecture';
    readonly systemPrompt = 'You are an expert in event-driven systems.';
    readonly promptFile = 'events.md';
    readonly contextDeps = [];
    readonly category = 'data';
    readonly outputFile = 'event.md';
}
