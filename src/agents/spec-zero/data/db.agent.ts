import { RepoSpecZeroAgent } from '../base.js';

export class DbAgent extends RepoSpecZeroAgent {
    readonly id = 'db';
    readonly name = 'Database Analysis';
    readonly description = 'Analyzes database schema and usage';
    readonly systemPrompt = 'You are an expert database architect.';
    readonly promptFile = 'db.md';
    readonly contextDeps = [];
    readonly category = 'data';
    readonly outputFile = 'db.md';
}
