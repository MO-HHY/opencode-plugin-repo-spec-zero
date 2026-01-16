import { RepoSpecZeroAgent } from '../base.js';
export class SecurityAgent extends RepoSpecZeroAgent {
    id = 'security';
    name = 'General Security Analysis';
    description = 'Performs general security analysis and vulnerability check';
    systemPrompt = 'You are an expert security auditor.';
    promptFile = 'security_check.md';
    contextDeps = [];
    category = 'security';
    outputFile = 'security.md';
}
//# sourceMappingURL=security.agent.js.map