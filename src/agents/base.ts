/**
 * Base Agent Classes
 */

import type { AgentContext, AgentResult } from '@opencode-ai/plugin';

/**
 * Skill executor interface
 */
export interface SkillExecutor {
    execute<T = unknown>(params: Record<string, unknown>): Promise<T>;
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

    registerSkill(skillId: string, executor: SkillExecutor): void {
        this.skills.set(skillId, executor);
    }

    abstract process(context: AgentContext): Promise<AgentResult>;
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
