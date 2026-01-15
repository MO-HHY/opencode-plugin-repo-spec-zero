# Plan: v0.1.1 Fix & Static Agent

## 🚨 Problem
1.  **Runtime Error**: `TypeError: def.execute is not a function` when calling `repo_spec_zero_analyze`.
    -   *Root Cause*: The plugin likely registers agents/tools but the internal binding to the `execute` method in `src/index.ts` or the wrapper class is malformed. OpenCode expects a specific signature for tools.
2.  **Missing Agent Definition**: The user wants a static agent definition in `opencode.json` (like `orchestrator`) that is aware of the plugin's capabilities and acts as the interface.

## 🎯 Goals (v0.1.1)
1.  **Fix Tool Registration**: Ensure `execute` is correctly bound for all exposed tools.
2.  **Expose Static Agent**: Add a `repo-spec-zero` agent definition to the plugin's `opencode.json` template (in the installer) and document it.
3.  **Robust Error Handling**: Ensure tool failures are caught and reported gracefully.
4.  **Audit Logging**: Generate a `_meta/analysis_audit.md` file in the output that lists all executed agents, their status (Success/Fail), and any error logs. This helps improve the plugin by identifying specific agent failures.

## 🛠 Implementation Plan

### 1. Fix `src/index.ts`
Inspect how `specZeroAgent` is converted to a tool/agent.
If we are using `@opencode-ai/plugin` SDK's `definePlugin`, we need to check the `tool` or `agent` property.
Likely the issue is in how we return the object.
*Hypothesis*: We are returning an object where `execute` is missing on the registered tool definition.

**Action**: Wrap the agent's `process` method into a proper Tool definition.
```typescript
// Current (suspected)
tools: {
  analyze: specZeroAgent // fails if class doesn't have .execute matching the interface
}

// Fix
tools: {
  analyze: {
    description: "...",
    execute: async (args) => specZeroAgent.process(args)
  }
}
```

### 2. Define Static Agent in `opencode.json` (Installer)
Update `src/bin/install.ts` to inject a `repo-spec-zero` agent into the root `opencode.json`.

**Agent Definition**:
```json
"repo-spec-zero": {
  "model": "antigravity-gemini-3-flash", // or inherit
  "mode": "primary",
  "description": "RepoSpecZero: Autonomous Spec Analysis Swarm.",
  "prompt": "You are RepoSpecZero, an autonomous swarm for analyzing codebases.\n\nYour primary tool is `repo_spec_zero_analyze`. \n\nWHEN USER ASKS TO ANALYZE A REPO:\n1. Call `repo_spec_zero_analyze` with the target path (or current directory).\n2. Wait for the result.\n3. Summarize the findings based on the generated spec.\n\nDO NOT attempt to read files manually unless the swarm fails."
}
```

### 3. Implement Audit Logging (`orchestrator.agent.ts`)
Modify `RepoSpecZeroOrchestrator` to track execution details:
-   Maintain an `executionLog` array: `[{ agent: 'overview', status: 'success', time: '...', error?: '...' }]`
-   At the end of `process`, write this log to `{specDir}/_meta/analysis_audit.md`.

**Audit File Format**:
```markdown
# Analysis Audit Log
Date: 2024-01-15T...
Repo: ...

## Execution Summary
- Total Agents: 17
- Success: 15
- Failed: 2

## Details
| Agent | Status | Duration | Message |
|-------|--------|----------|---------|
| overview | ✅ Success | 2.1s | ... |
| db | ❌ Failed | 5.4s | Error: ... |
```

### 4. Bump Version
Update `package.json` to `0.1.1`.

## 📋 Checklist
- [ ] **Fix**: Update `src/index.ts` tool wrapper.
- [ ] **Update Installer**: Add Agent to `src/bin/install.ts`.
- [ ] **Verify**: Run `verify-swarm` and `verify-installer`.
- [ ] **Release**: Bump version.
