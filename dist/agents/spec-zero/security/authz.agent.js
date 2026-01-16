import { RepoSpecZeroAgent } from '../base.js';
export class AuthzAgent extends RepoSpecZeroAgent {
    id = 'authz';
    name = 'Authorization Analysis';
    description = 'Analyzes authorization and permission models';
    systemPrompt = 'You are an expert security architect specializing in authorization.';
    promptFile = 'authorization.md';
    contextDeps = [];
    category = 'security';
    outputFile = 'authz.md';
}
//# sourceMappingURL=authz.agent.js.map