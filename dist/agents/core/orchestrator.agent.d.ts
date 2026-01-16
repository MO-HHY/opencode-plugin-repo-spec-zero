import { BaseAgent } from '../base.js';
import type { AgentContext, AgentResult } from '../../types.js';
import { SpecZeroDetectionSkill } from '../../skills/spec-zero-detection.skill.js';
import { GitSkill } from '../../skills/git.skill.js';
import { TaskSpecAgent } from './task-spec.agent.js';
export declare class RepoSpecZeroOrchestrator extends BaseAgent {
    private detectionSkill;
    private gitSkill;
    private taskSpecAgent;
    readonly id = "orchestrator";
    readonly name = "RepoSpecZero Orchestrator";
    readonly description = "Coordinates the RepoSpecZero analysis swarm.";
    readonly systemPrompt = "You are the orchestrator of the SpecZero swarm.";
    readonly triggers: RegExp[];
    constructor(detectionSkill: SpecZeroDetectionSkill, gitSkill: GitSkill, taskSpecAgent: TaskSpecAgent);
    process(context: AgentContext): Promise<AgentResult>;
    private getSlug;
    private notify;
    private getExecutionOrder;
}
//# sourceMappingURL=orchestrator.agent.d.ts.map