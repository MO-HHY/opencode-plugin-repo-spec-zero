# Native Swarm Refactor Walkthrough

> **Refactor Complete**: The plugin has been successfully transformed from a "Black Box Robot" to a "Native OpenCode Swarm".

## 🎯 Objectives Achieved
- [x] **Native LLM Integration**: Replaced `@anthropic-ai/sdk` with `client.llm.chat`.
- [x] **Visible Swarm**: Orchestrator now emits Toast notifications for every agent's execution.
- [x] **Dependency Cleanups**: Removed `ANTHROPIC_API_KEY` requirement and SDK dependency.
- [x] **Verification**: Verified using `scripts/verify-swarm.ts`.
- [x] **NPM Installer**: Added `npx ... install` mode for zero-config setup.

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

### 3. NPM Installer (`src/bin/install.ts`)
A new CLI entry point allows installing the plugin into any workspace without cloning the repo.
- **Command**: `npx @mo-hhy/opencode-plugin-repo-spec-zero install`
- **Logic**: Automatically creates `.opencode` folder, `.npmrc`, loader file, and `opencode.json`.

## 🧪 Verification

### Swarm Verification
Run `npm run verify` to test the full 17-agent swarm logic on the repo itself.

### Installer Verification
Run `npm run verify:installer` to test the `npx install` logic (folder generation).

## 🚀 Next Steps
The plugin is ready for release.
1.  **Publish**: `npm publish` (to GitHub Packages)
2.  **Use**: `npx @mo-hhy/opencode-plugin-repo-spec-zero install` in any target repo.
