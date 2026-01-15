# Plan: NPM Installer for RepoSpecZero

## 🎯 Goal
Enable `opencode-plugin-repo-spec-zero` to be installed into any OpenCode workspace via a simple `npx` command, eliminating the need to `git clone` the plugin repository manually.

**Command**:
```bash
npx @mo-hhy/opencode-plugin-repo-spec-zero install
```

**Result**:
Automatically configures the target workspace's `.opencode/` folder, adding the plugin as a dependency and setting up the loader, matching the pattern used by `spec-os-opencode-installer`.

## 📦 Reference Architecture
Based on `spec-os-opencode-installer` and `HANDHY_SPEC_OS/.opencode`:
1.  **Target Directory**: `.opencode/`
2.  **Dependencies**: `package.json` with `@mo-hhy/opencode-plugin-repo-spec-zero`.
3.  **Loader**: `plugin/repo-spec-zero.ts` dynamically importing the package.
4.  **Config**: `.npmrc` for GitHub Packages authentication.

## 🛠 Implementation Steps

### Phase 1: Create Installer CLI
Implement the installer logic directly within the plugin repository (Monorepo-style or integrated).
*Location*: `src/bin/install.ts` (compiled to `dist/bin/install.js`)

**Logic**:
1.  **Check/Create `.opencode/`**: Ensure directory exists.
2.  **Create `.npmrc`**: Ensure auth tokens are passed to the inner scope.
3.  **Update `.opencode/package.json`**: Add `@mo-hhy/opencode-plugin-repo-spec-zero` dependency.
4.  **Create Loader**: Write `.opencode/plugin/repo-spec-zero.ts`.
    ```typescript
    // Loader Template
    let pluginModule: any;
    try {
        pluginModule = await import('@mo-hhy/opencode-plugin-repo-spec-zero');
    } catch {
        // Fallback for local dev if needed
    }
    export default plugin;
    ```
5.  **Run `npm install`**: Execute dependencies installation in `.opencode/`.
6.  **Ensure `opencode.json`**:
    - Check if `opencode.json` exists in the project root.
    - If missing, create a configuration based on `HANDHY_SPEC_OS/opencode.json`:
      ```json
      {
        "$schema": "https://raw.githubusercontent.com/opencode-ai/opencode/main/schemas/opencode.schema.json",
        "name": "HANDHY SPEC-OS",
        "description": "Knowledge Graph OS for Technical Documentation",
        "plugin": []
      }
      ```
      *(Note: The `plugin` array is empty here because the installer manages plugins via `.opencode/package.json` logic using the loader pattern)*.
    - This ensures OpenCode recognizes the workspace and loads the plugins from `.opencode/plugin/`.

### Phase 2: Package Configuration
Update `package.json` to expose the binary.

```json
{
  "bin": {
    "repo-spec-zero": "./dist/bin/install.js"
  },
  "files": [
    "dist/bin",
    "dist/index.js",
    ...
  ]
}
```

### Phase 3: Validation
1.  Build the package.
2.  Test the installer in a clean temporary directory.
3.  Verify `.opencode` structure matches the reference.

## 📝 CLI Script Structure (`src/bin/install.ts`)

```typescript
#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// ... implementation mimicking spec-os-opencode-installer ...
```

## 📋 Checklist
- [ ] **Create Script**: `src/bin/install.ts`.
- [ ] **Update Package**: `package.json` bin entry.
- [ ] **Build**: Ensure `dist/bin` is generated.
- [ ] **Verify**: Run `npm link` and test `npx repo-spec-zero install`.
