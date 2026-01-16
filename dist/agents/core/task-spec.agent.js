import { BaseAgent } from '../base.js';
export class TaskSpecAgent extends BaseAgent {
    id = 'task-spec';
    name = 'Task Specification Agent';
    description = 'Manages task lifecycle via Activity Register (ClickUp integration).';
    systemPrompt = 'You are an agent responsible for fetching task details and updating progress on ClickUp.';
    triggers = [/^fetch task/, /^update task status/, /^push report/];
    async process(context) {
        const { intent } = context;
        // Basic routing logic (can be enhanced later with an IntentMatcher)
        if (intent.name === 'fetch_task' || context.messages[0].content.includes('fetch task')) {
            const taskId = context.params?.taskId;
            if (!taskId)
                return { success: false, message: 'TaskId is required' };
            return await this.fetchTask(taskId, context);
        }
        // Fallback
        return { success: false, message: 'Unknown intent for TaskSpecAgent' };
    }
    async fetchTask(taskId, context) {
        // This agent expects the 'activity_registry_pull' tool to be available in the environment
        // or passed via context. In OpenCode plugins, we typically call tools via the client or context.
        // For now, we simulate or assume the tool is callable.
        // In a real plugin execution, we would use:
        // const result = await context.client.callTool('activity_registry_pull', { task_id: taskId });
        // But since we are inside an agent process, we rely on the orchestrator or context to provide tools.
        const client = context.client;
        if (!client) {
            return { success: false, message: 'Client not available in context' };
        }
        try {
            console.log(`Fetching task ${taskId} from Activity Register...`);
            // We assume the tool activity_registry_pull exists and takes { task_id }
            const taskData = await client.callTool('activity_registry_pull', { task_id: taskId });
            // Parse repoUrl from description
            const repoUrl = this.extractRepoUrl(taskData.description || "");
            return {
                success: true,
                data: {
                    task: taskData,
                    repoUrl: repoUrl
                },
                message: `Fetched task ${taskId}. Repo URL: ${repoUrl || 'Not found'}`
            };
        }
        catch (error) {
            return { success: false, message: `Failed to fetch task: ${error.message}` };
        }
    }
    async updateProgress(taskId, status, comment, context) {
        const client = context.client;
        if (!client)
            return { success: false, message: 'Client not available' };
        try {
            // activity_registry_set_status tool
            await client.callTool('activity_registry_set_status', { task_id: taskId, status: status, comment: comment });
            return { success: true, message: `Updated task ${taskId} to ${status}` };
        }
        catch (error) {
            return { success: false, message: `Failed to update task: ${error.message}` };
        }
    }
    async pushFinalReport(taskId, reportContent, context) {
        const client = context.client;
        if (!client)
            return { success: false, message: 'Client not available' };
        try {
            // activity_registry_push_walkthrough (or similar for attaching files/comments)
            // If push_walkthrough isn't the right fit, we can use add_comment or attach_file.
            // Assuming push_walkthrough is the standard for reports.
            await client.callTool('activity_registry_push_walkthrough', { task_id: taskId, content: reportContent });
            return { success: true, message: `Pushed final report to task ${taskId}` };
        }
        catch (error) {
            return { success: false, message: `Failed to push report: ${error.message}` };
        }
    }
    extractRepoUrl(description) {
        // Simple regex to find first github url
        const match = description.match(/https:\/\/github\.com\/[\w-]+\/[\w-]+/);
        return match ? match[0] : null;
    }
}
//# sourceMappingURL=task-spec.agent.js.map