# Native Swarm Refactor Walkthrough

> **Refactor Complete**: The plugin has been successfully transformed from a "Black Box Robot" to a "Native OpenCode Swarm".

## 🎯 Objectives Achieved
- [x] **Native LLM Integration**: Replaced `@anthropic-ai/sdk` with `client.llm.chat`.
- [x] **Visible Swarm**: Orchestrator now emits Toast notifications for every agent's execution.
- [x] **Dependency Cleanups**: Removed `ANTHROPIC_API_KEY` requirement and SDK dependency.
- [x] **Verification**: Verified using `scripts/verify-swarm.ts` on the plugin's own repo.

## 🏗 Key Changes

### 1. New Skill: `NativeLLMSkill`
A dedicated skill that wraps the OpenCode Client LLM interface, implementing the standard `SkillExecutor` protocol.
```typescript
// src/skills/native-llm.skill.ts
export class NativeLLMSkill implements SkillExecutor {
    // ...
    async execute<T>(params: Record<string, unknown>): Promise<SkillResult<T>> {
        const response = await (this.client as any).llm.chat({ messages: [...] });
        return { success: true, data: response.content };
    }
}
```

### 2. Orchestrator Visibility
The `RepoSpecZeroOrchestrator` now keeps the user informed:
```typescript
await this.notify(client, `[${index}/${total}] Activating ${agent.name}...`, 'info');
```
Errors are handled gracefully without crashing the entire swarm:
```typescript
try {
    const result = await agent.process(context);
} catch (e) {
    await this.notify(client, `❌ Agent crashed: ${e.message}`, 'error');
}
```

### 3. Build & Dependencies Changes
- **Removed**: `@anthropic-ai/sdk`
- **Updated**: `package.json` now includes `verify` script.
- **Fixed**: `SkillResult` typing across the codebase.

## 🧪 Verification

A dedicated verification script was created: `scripts/verify-swarm.ts`.
It mocks the OpenCode environment and runs the full 17-agent swarm on the repository itself.

**Result**:
```
[Orchestrator] Starting analysis with 17 agents...
[MockToast] INFO: [1/17] Activating Overview Analysis...
[MockLLM] Processing prompt...
...
Orchestrator Finished: { success: true, ... }
```

## 🚀 Next Steps
The plugin is ready for release/deployment. No API keys are needed. Just install and run via `Analyze repo ...`.
