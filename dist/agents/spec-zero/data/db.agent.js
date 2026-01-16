import { RepoSpecZeroAgent } from '../base.js';
export class DbAgent extends RepoSpecZeroAgent {
    id = 'db';
    name = 'Database Analysis';
    description = 'Analyzes database schema and usage';
    systemPrompt = 'You are an expert database architect.';
    promptFile = 'db.md';
    contextDeps = [];
    category = 'data';
    outputFile = 'db.md';
}
//# sourceMappingURL=db.agent.js.map