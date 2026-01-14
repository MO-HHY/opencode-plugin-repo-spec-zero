export interface AgentContext {
    client: any;
    params: Record<string, unknown>;
    messages: any[];
    intent: any;
}

export interface AgentResult {
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
}

export interface AgentConfig {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    permissions?: string[];
    allowedSkills?: string[];
    triggers?: RegExp[];
    subAgents?: any[];
}
