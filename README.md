# RepoSpecZero Plugin v2.1.0

**RepoSpecZero** (`@mo-hhy/opencode-plugin-repo-spec-zero`) is a powerful **Agentic Swarm** plugin for OpenCode that autonomously analyzes codebases and generates **SPEC-OS** compatible specifications ("Spec Zero").

> **Part of the [HANDHY SPEC-OS](https://github.com/MO-HHY/HANDHY-SPEC-OS) Ecosystem.**

---

## What's New in v2.1.0

### Major Features
| Feature | Description |
|---------|-------------|
| **Smart DAG Planner** | Dynamic agent execution based on detected repository features (frameworks, languages, patterns) |
| **Diagram Generator** | Automatic Mermaid.js diagrams (ERD, Sequence, Flowchart, Class, State, C4) - inline and standalone |
| **Hierarchical Output** | 8-layer organization (00-foundation to 07-ops) for optimal Knowledge Graph navigation |
| **Template System** | Handlebars-like templates (`{{variable}}`, `{{#each}}`, `{{#if}}`) for consistent output |
| **Prompt Registry** | External versioned prompts in markdown for easy customization |
| **Manifest Validation** | Auto-validation and repair of specs manifest with Zod schema |

### New CLI Flags
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--smart-dag` | boolean | `true` | Enable dynamic agent selection based on features |
| `--diagrams` | enum | `both` | `inline` / `standalone` / `both` / `none` |
| `--template` | string | - | Override template ID for agents |
| `--skipAgents` | string[] | - | Agent IDs to explicitly skip |

### New Output Structure
```
specs/_generated/
├── 00-foundation/    # Project Overview & Architecture
├── 01-domain/        # Entities & Domain Logic
├── 02-modules/       # Codebase Modules (Frontend/Backend)
├── 03-api/           # REST/GraphQL Endpoints
├── 04-data/          # Database Schema & Data Mapping
├── 05-auth/          # Authentication & Security
├── 06-integration/   # Dependencies & Services
├── 07-ops/           # Deployment & Monitoring
└── _diagrams/        # Standalone .mmd Mermaid files
```

---

## Installation

### Option 1: Install from GitHub (Recommended)

**Global Installation:**
```bash
npm install -g git+https://github.com/MO-HHY/opencode-plugin-repo-spec-zero.git#v2.1.0
```

**Local Installation (in a project directory):**
```bash
cd /path/to/your/project
npm init -y  # if no package.json exists
npm install git+https://github.com/MO-HHY/opencode-plugin-repo-spec-zero.git#v2.1.0
```

### Option 2: OpenCode Configuration
Add the plugin to your `opencode.json`:
```json
{
  "plugin": [
    "@mo-hhy/opencode-plugin-repo-spec-zero"
  ]
}
```

### Option 3: Local Development
```bash
git clone https://github.com/MO-HHY/opencode-plugin-repo-spec-zero.git
cd opencode-plugin-repo-spec-zero
npm install
npm run build
npm link  # Makes the command available globally
```

### Verify Installation
```bash
# Global
repo-spec-zero --version

# Local (in project directory)
npx repo-spec-zero --version
```
Expected output: `2.1.0`

---

## Troubleshooting Installation

### Permission Errors (EACCES)
If you see `EACCES: permission denied`, fix npm cache ownership:
```bash
sudo chown -R $(whoami) ~/.npm
```

### ENOTDIR Errors
If you see `ENOTDIR` errors, clean up corrupted global modules:
```bash
sudo rm -rf /opt/homebrew/lib/node_modules/@mo-hhy
npm cache clean --force
```

Then retry installation.

---

## Usage

### Analyze a Repository
Ask OpenCode to analyze a repository:
> "Analyze repo https://github.com/username/project"

### CLI Examples
```bash
# Full analysis with Smart DAG and all diagrams
npx repo-spec-zero analyze . --smart-dag --diagrams both

# Analysis without diagrams
npx repo-spec-zero analyze ./my-project --diagrams none

# Skip specific agents
npx repo-spec-zero analyze . --skipAgents overview,architecture
```

---

## Architecture v2.1.0

The plugin uses a **Modular Smart Swarm** architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Feature         │───>│ Smart DAG        │───>│ Generic         │
│ Detector        │    │ Planner          │    │ Analysis Agent  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                      │                       │
        v                      v                       v
  Detects:               Builds:                 Uses:
  - Frameworks           - Execution layers      - Prompt Registry
  - Languages            - Agent dependencies    - Template Loader
  - Features (24+)       - Skip conditions       - Diagram Generator
```

### Core Components
| Component | File | Description |
|-----------|------|-------------|
| Feature Detector | `src/core/feature-detector.ts` | Detects 10+ frameworks, 24 feature flags |
| Smart DAG Planner | `src/core/smart-dag-planner.ts` | Builds dynamic execution plan |
| Generic Agent | `src/agents/generic-analysis.agent.ts` | Single configurable agent |
| Diagram Generator | `src/core/diagram-generator.ts` | ERD, Sequence, Flowchart, C4 |
| Template Loader | `src/core/template-loader.ts` | Handlebars-like template engine |
| Prompt Router | `src/core/prompt-router.ts` | Intelligent prompt composition |

---

## Agent Installation Prompt

Use this prompt to have an AI agent install the plugin automatically:

```
Install the SPEC-OS RepoSpecZero plugin v2.1.0 in my project.

Steps to execute:
1. Navigate to the target directory
2. Initialize package.json if it doesn't exist: npm init -y
3. Clean any existing installation: rm -rf node_modules/@mo-hhy
4. Fix npm permissions if needed: sudo chown -R $(whoami) ~/.npm
5. Install the plugin: npm install git+https://github.com/MO-HHY/opencode-plugin-repo-spec-zero.git#v2.1.0
6. Verify installation: npx repo-spec-zero --version (should return 2.1.0)

Target directory: [INSERT YOUR PATH HERE]
```

### One-Liner for Agents
```bash
cd [TARGET_DIR] && npm init -y 2>/dev/null; rm -rf node_modules/@mo-hhy; npm install git+https://github.com/MO-HHY/opencode-plugin-repo-spec-zero.git#v2.1.0 && npx repo-spec-zero --version
```

---

## Testing

Run the test suite:
```bash
npm test
```

Current coverage: **65 tests** (Unit + E2E)

---

## Contributing

1. Fork the repo
2. Create a branch (`feat/new-feature`)
3. Run tests (`npm test`)
4. Submit a PR

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for full version history.

---

*Built with care by the MO-HHY Team.*
