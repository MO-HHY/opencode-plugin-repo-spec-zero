import { RepoSpecZeroAgent } from '../base.js';

export class DataMapAgent extends RepoSpecZeroAgent {
    readonly id = 'data_map';
    readonly name = 'Data Mapping Analysis';
    readonly description = 'Maps data flow and relationships';
    readonly systemPrompt = 'You are an expert data architect.';
    readonly promptFile = 'data_mapping.md';
    readonly contextDeps = [];
    readonly category = 'data';
    readonly outputFile = 'data_map.md';
}
