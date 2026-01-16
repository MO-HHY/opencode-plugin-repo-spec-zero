import { RepoSpecZeroAgent } from '../base.js';
export class AuthAgent extends RepoSpecZeroAgent {
    id = 'auth';
    name = 'Authentication Analysis';
    description = 'Analyzes authentication mechanisms';
    systemPrompt = 'You are an expert security architect specializing in authentication.';
    promptFile = 'authentication.md';
    contextDeps = [];
    category = 'security';
    outputFile = 'auth.md';
}
//# sourceMappingURL=auth.agent.js.map