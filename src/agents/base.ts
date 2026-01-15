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
export abstract class BaseAgent {
    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly description: string;
    abstract readonly systemPrompt: string;
    abstract readonly triggers: RegExp[];

    protected skills: Map<string, SkillExecutor> = new Map();
    protected subAgents: SubAgent[] = [];

    registerSkill(skillId: string, executor: SkillExecutor): void {
        this.skills.set(skillId, executor);
        // Propagate to sub-agents
        for (const subAgent of this.subAgents) {
            subAgent.registerSkill(skillId, executor);
        }
    }

    registerSubAgent(subAgent: SubAgent): void {
        subAgent.setParent(this);
        this.subAgents.push(subAgent);
        // Inherit
        for (const [skillId, executor] of this.skills.entries()) {
            subAgent.registerSkill(skillId, executor);
        }
    }

    abstract process(context: AgentContext): Promise<AgentResult>;
}

/**
 * Abstract base class for sub-agents (e.g. specialized agents)
 */
export abstract class SubAgent extends BaseAgent {
    protected parentAgent: BaseAgent | null = null;

    setParent(parent: BaseAgent): void {
        this.parentAgent = parent;
    }
}

/**
 * Agent registry for managing all agents
 */
export class AgentRegistry {
    private agents: Map<string, BaseAgent> = new Map();

    register(agent: BaseAgent): void {
        this.agents.set(agent.id, agent);
    }

    get(agentId: string): BaseAgent | undefined {
        return this.agents.get(agentId);
    }

    all(): BaseAgent[] {
        return Array.from(this.agents.values());
    }
}
