# Plan: Native Swarm Refactor (De-Robotization)

**Objective**: Transform `opencode-plugin-repo-spec-zero` from a "black-box robot" (using internal SDK) to a transparent, native **OpenCode Agent Swarm**.

---

## 🎯 Goals

| # | Goal | Success Criteria |
|---|------|------------------|
| 1 | Remove Hidden Intelligence | `@anthropic-ai/sdk` removed from `package.json`. No `ANTHROPIC_API_KEY` references. |
| 2 | Visible Deliberation | User sees Toast/Log for each of the 17 agent activations. |
| 3 | Agentic Architecture | Each sub-agent uses `client.llm.chat` with its own `systemPrompt`. |
| 4 | Task Automation | ClickUp task flow works end-to-end with native LLM. |

---

## 🏗 Architecture

### 1. Native LLM Bridge (`NativeLLMSkill`)
**File**: `src/skills/native-llm.skill.ts` (NEW)

Replaces `AnalyzeContextSkill`. Uses `PluginInput.client`.

```typescript
// Signature
async analyze(systemPrompt: string, userPrompt: string): Promise<string>

// Implementation
const response = await this.client.llm.chat({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]
});
return response.content;
```

### 2. Orchestrator (`RepoSpecZeroOrchestrator`)
**File**: `src/agents/core/orchestrator.agent.ts` (MODIFY)

| Responsibility | Implementation |
|----------------|----------------|
| Owns 17 Sub-Agents | `this.subAgents: SubAgent[]` |
| Determines Execution Order | Hardcoded topological sort or `contextDeps` graph. |
| Delegates Explicitly | `await subAgent.execute(context)` |
| Reports Progress | `client.tui.showToast({ title: 'RepoSpecZero', message: 'Activating DbAgent...' })` |
| Aggregates Results | Writes files to `{project}-spec/` via `OutputWriterSkill`. |

### 3. Sub-Agents (17 Workers)
**Directory**: `src/agents/spec-zero/` (MODIFY)

Each extends `SubAgent` (from `src/agents/base.ts`).

| Property | Value (Example: DbAgent) |
|----------|--------------------------|
| `id` | `repo_spec_zero_db` |
| `name` | `Database Agent` |
| `systemPrompt` | Loaded from `prompts/generic/database.md` |
| `execute(context)` | Calls `NativeLLMSkill.analyze(this.systemPrompt, context.repoTree)` |

---

## 🌳 Git Strategy

| Step | Command | Branch |
|------|---------|--------|
| 1. Backup | `git checkout -b backup/v1-sdk-robot && git push origin backup/v1-sdk-robot` | `backup/v1-sdk-robot` |
| 2. Feature | `git checkout main && git checkout -b feat/native-swarm` | `feat/native-swarm` |
| 3. Merge | After verification: `git checkout main && git merge feat/native-swarm` | `main` |

---

## 📋 Implementation Steps (Surgical Detail)

### Phase 0: Git Safety
**Goal**: Preserve current working state.

| Step | Action | Command/Path |
|------|--------|--------------|
| 0.1 | Create backup branch | `git checkout -b backup/v1-sdk-robot` |
| 0.2 | Push backup | `git push origin backup/v1-sdk-robot` |
| 0.3 | Return to main | `git checkout main` |
| 0.4 | Create feature branch | `git checkout -b feat/native-swarm` |

**Verification**: `git branch -a` shows both branches.

---

### Phase 1: Core Switch (Native LLM)
**Goal**: Replace Anthropic SDK with OpenCode Native LLM.

#### Step 1.1: Create `NativeLLMSkill`
**Path**: `src/skills/native-llm.skill.ts`

```typescript
import type { Client } from '@opencode-ai/plugin';

export class NativeLLMSkill {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async analyze(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await this.client.llm.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });
    // Handle response structure
    if (typeof response === 'string') return response;
    if (response.content) return response.content;
    return JSON.stringify(response);
  }
}
```

#### Step 1.2: Refactor `RepoSpecZeroAgent` Base Class
**Path**: `src/agents/spec-zero/base.ts`

| Change | Before | After |
|--------|--------|-------|
| Skill Reference | `skills.get('repo_spec_zero_analyze_context')` | `skills.get('native_llm')` |
| Execution | `analyzeExecutor.execute({ prompt, repoStructure, prevContext })` | `nativeLLM.analyze(this.systemPromptContent, combinedPrompt)` |

#### Step 1.3: Remove Anthropic Dependency
**Path**: `package.json`

```diff
  "dependencies": {
    "yaml": "^2.3.0",
    "zod": "4.1.8",
-   "@anthropic-ai/sdk": "^0.20.0"
  },
```

**Command**: `npm uninstall @anthropic-ai/sdk`

#### Step 1.4: Delete Old Skill
**Path**: `src/skills/analyze-context.skill.ts` → DELETE

#### Step 1.5: Update Index
**Path**: `src/index.ts`

| Change | Before | After |
|--------|--------|-------|
| Import | `import { AnalyzeContextSkill }` | `import { NativeLLMSkill }` |
| Init | `new AnalyzeContextSkill(...)` | `new NativeLLMSkill(client)` |

**Verification**: `npm run build` succeeds. No Anthropic references in `dist/`.

---

### Phase 2: Orchestration & Visibility
**Goal**: Make agent execution transparent to the user.

#### Step 2.1: Add Toast Notifications to Orchestrator
**Path**: `src/agents/core/orchestrator.agent.ts`

```typescript
// Inside the loop that iterates over sub-agents
await this.client.tui.showToast({
  body: {
    title: 'RepoSpecZero Swarm',
    message: `Activating: ${subAgent.name}...`,
    variant: 'info',
    duration: 2000,
  }
});

const result = await subAgent.execute(context);

await this.client.tui.showToast({
  body: {
    title: 'RepoSpecZero Swarm',
    message: `Completed: ${subAgent.name}`,
    variant: 'success',
    duration: 1500,
  }
});
```

#### Step 2.2: Granular Error Handling
**Path**: `src/agents/core/orchestrator.agent.ts`

```typescript
try {
  const result = await subAgent.execute(context);
  allResults[subAgent.id] = result.data?.output || '';
} catch (error) {
  await this.client.tui.showToast({
    body: {
      title: 'RepoSpecZero Error',
      message: `${subAgent.name} failed: ${error.message}. Skipping.`,
      variant: 'warning',
      duration: 4000,
    }
  });
  // Continue to next agent instead of crashing
}
```

**Verification**: Trigger analysis. Observe 17 Toast notifications in sequence.

---

### Phase 3: Prompt Tuning & Final Verification
**Goal**: Ensure prompts work well with the user's default model.

#### Step 3.1: Test Single Agent
Run analysis on a small, known repo using only `OverviewAgent`.

**Path**: Temporarily modify `orchestrator.agent.ts` to only execute one agent.

#### Step 3.2: Full Swarm Test
Run full analysis on a medium-complexity repo (e.g., `palantir`).

**Verification Checklist**:
- [ ] All 17 Toasts appear.
- [ ] `{project}-spec/` folder is created with all expected files.
- [ ] No Anthropic errors in console.
- [ ] README.md no longer mentions `ANTHROPIC_API_KEY`.

#### Step 3.3: Update Documentation
**Path**: `README.md`

- Remove "Configuration" section about `ANTHROPIC_API_KEY`.
- Update "Features" to emphasize "Uses your OpenCode model".

---

## 📁 Files Changed Summary

| File | Action | Phase |
|------|--------|-------|
| `src/skills/native-llm.skill.ts` | CREATE | 1 |
| `src/skills/analyze-context.skill.ts` | DELETE | 1 |
| `src/agents/spec-zero/base.ts` | MODIFY | 1 |
| `src/agents/core/orchestrator.agent.ts` | MODIFY | 1, 2 |
| `src/index.ts` | MODIFY | 1 |
| `package.json` | MODIFY | 1 |
| `README.md` | MODIFY | 3 |

---

## ✅ Execution Readiness Checklist

- [ ] **Phase 0**: Branches created and pushed.
- [ ] **Phase 1**: Build succeeds without `@anthropic-ai/sdk`.
- [ ] **Phase 2**: Toast notifications visible during execution.
- [ ] **Phase 3**: Full swarm test passes on a real repository.
- [ ] **Merge**: `feat/native-swarm` merged to `main` and pushed.
