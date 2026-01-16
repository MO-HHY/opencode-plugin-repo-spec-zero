/**
 * Base Agent Classes
 */
/**
 * Abstract base class for all RepoSpecZero agents
 */
export class BaseAgent {
    skills = new Map();
    subAgents = [];
    registerSkill(skillId, executor) {
        this.skills.set(skillId, executor);
        // Propagate to sub-agents
        for (const subAgent of this.subAgents) {
            subAgent.registerSkill(skillId, executor);
        }
    }
    registerSubAgent(subAgent) {
        subAgent.setParent(this);
        this.subAgents.push(subAgent);
        // Inherit
        for (const [skillId, executor] of this.skills.entries()) {
            subAgent.registerSkill(skillId, executor);
        }
    }
}
/**
 * Abstract base class for sub-agents (e.g. specialized agents)
 */
export class SubAgent extends BaseAgent {
    parentAgent = null;
    setParent(parent) {
        this.parentAgent = parent;
    }
}
/**
 * Agent registry for managing all agents
 */
export class AgentRegistry {
    agents = new Map();
    register(agent) {
        this.agents.set(agent.id, agent);
    }
    get(agentId) {
        return this.agents.get(agentId);
    }
    all() {
        return Array.from(this.agents.values());
    }
}
//# sourceMappingURL=base.js.map