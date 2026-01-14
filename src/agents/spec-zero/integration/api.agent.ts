import { RepoSpecZeroAgent } from '../base.js';

export class ApiAgent extends RepoSpecZeroAgent {
    readonly id = 'api';
    readonly name = 'API Analysis';
    readonly description = 'Analyzes API endpoints and contracts';
    readonly systemPrompt = 'You are an expert API architect.';
    readonly promptFile = 'apis.md';
    readonly contextDeps = [];
    readonly category = 'integration';
    readonly outputFile = 'api.md';
}
