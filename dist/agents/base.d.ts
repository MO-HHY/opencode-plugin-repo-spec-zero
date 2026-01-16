/**
 * Base Agent Classes
 */
import type { AgentContext, AgentResult } from '../types.js';
/**
 * Skill result interface
 */
export interface SkillResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Skill executor interface
 */
export interface SkillExecutor {
    execute<T = unknown>(params: Record<string, unknown>): Promise<SkillResult<T>>;
}
/**
 * Abstract base class for all RepoSpecZero agents
 */
export declare abstract class BaseAgent {
    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly description: string;
    abstract readonly systemPrompt: string;
    abstract readonly triggers: RegExp[];
    protected skills: Map<string, SkillExecutor>;
    protected subAgents: SubAgent[];
    registerSkill(skillId: string, executor: SkillExecutor): void;
    registerSubAgent(subAgent: SubAgent): void;
    abstract process(context: AgentContext): Promise<AgentResult>;
}
/**
 * Abstract base class for sub-agents (e.g. specialized agents)
 */
export declare abstract class SubAgent extends BaseAgent {
    protected parentAgent: BaseAgent | null;
    setParent(parent: BaseAgent): void;
}
/**
 * Agent registry for managing all agents
 */
export declare class AgentRegistry {
    private agents;
    register(agent: BaseAgent): void;
    get(agentId: string): BaseAgent | undefined;
    all(): BaseAgent[];
}
//# sourceMappingURL=base.d.ts.map