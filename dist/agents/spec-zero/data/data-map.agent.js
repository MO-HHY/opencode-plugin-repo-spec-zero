import { RepoSpecZeroAgent } from '../base.js';
export class DataMapAgent extends RepoSpecZeroAgent {
    id = 'data_map';
    name = 'Data Mapping Analysis';
    description = 'Maps data flow and relationships';
    systemPrompt = 'You are an expert data architect.';
    promptFile = 'data_mapping.md';
    contextDeps = [];
    category = 'data';
    outputFile = 'data_map.md';
}
//# sourceMappingURL=data-map.agent.js.map