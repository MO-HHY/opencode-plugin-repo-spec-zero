import { RepoSpecZeroAgent } from '../base.js';
export class ApiAgent extends RepoSpecZeroAgent {
    id = 'api';
    name = 'API Analysis';
    description = 'Analyzes API endpoints and contracts';
    systemPrompt = 'You are an expert API architect.';
    promptFile = 'apis.md';
    contextDeps = [];
    category = 'integration';
    outputFile = 'api.md';
}
//# sourceMappingURL=api.agent.js.map