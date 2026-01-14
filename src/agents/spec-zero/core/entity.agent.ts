import { RepoSpecZeroAgent } from '../base.js';

export class EntityAgent extends RepoSpecZeroAgent {
    readonly id = 'entity';
    readonly name = 'Entity Analysis';
    readonly description = 'Identifies core domain entities';
    readonly systemPrompt = 'You are an expert software architect identifying domain entities.';
    readonly promptFile = 'core_entities.md';
    readonly contextDeps = [];
    readonly category = 'core';
    readonly outputFile = 'entity.md';
}
