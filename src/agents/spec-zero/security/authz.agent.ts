import { RepoSpecZeroAgent } from '../base.js';

export class AuthzAgent extends RepoSpecZeroAgent {
    readonly id = 'authz';
    readonly name = 'Authorization Analysis';
    readonly description = 'Analyzes authorization and permission models';
    readonly systemPrompt = 'You are an expert security architect specializing in authorization.';
    readonly promptFile = 'authorization.md';
    readonly contextDeps = [];
    readonly category = 'security';
    readonly outputFile = 'authz.md';
}
