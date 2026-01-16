import { RepoSpecZeroAgent } from '../base.js';
export class EntityAgent extends RepoSpecZeroAgent {
    id = 'entity';
    name = 'Entity Analysis';
    description = 'Identifies core domain entities';
    systemPrompt = 'You are an expert software architect identifying domain entities.';
    promptFile = 'core_entities.md';
    contextDeps = [];
    category = 'core';
    outputFile = 'entity.md';
}
//# sourceMappingURL=entity.agent.js.map