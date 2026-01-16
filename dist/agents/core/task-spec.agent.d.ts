import { BaseAgent } from '../base.js';
import type { AgentContext, AgentResult } from '../../types.js';
export declare class TaskSpecAgent extends BaseAgent {
    readonly id = "task-spec";
    readonly name = "Task Specification Agent";
    readonly description = "Manages task lifecycle via Activity Register (ClickUp integration).";
    readonly systemPrompt = "You are an agent responsible for fetching task details and updating progress on ClickUp.";
    readonly triggers: RegExp[];
    process(context: AgentContext): Promise<AgentResult>;
    fetchTask(taskId: string, context: AgentContext): Promise<AgentResult>;
    updateProgress(taskId: string, status: string, comment: string, context: AgentContext): Promise<AgentResult>;
    pushFinalReport(taskId: string, reportContent: string, context: AgentContext): Promise<AgentResult>;
    private extractRepoUrl;
}
//# sourceMappingURL=task-spec.agent.d.ts.map