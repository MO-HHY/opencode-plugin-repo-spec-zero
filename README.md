# RepoSpecZero Plugin 🕵️‍♂️ v2.1.0

**RepoSpecZero** (`@mo-hhy/opencode-plugin-repo-spec-zero`) is a powerful **Agentic Swarm** plugin for OpenCode that autonomously analyzes codebases and generates **SPEC-OS** compatible specifications ("Spec Zero").

> **Part of the [HANDHY SPEC-OS](https://github.com/MO-HHY/HANDHY-SPEC-OS) Ecosystem.**

## ✨ Features

*   **🧠 Smart DAG Execution (New v2.1.0)**: Uses a dynamic Directed Acyclic Graph planner to select only the relevant agents based on repository features.
*   **📊 Diagram Generation**: Automatically generates Mermaid.js diagrams (ERD, Sequence, Flowchart, C4) both inline and as standalone `.mmd` files.
*   **📂 Hierarchical Output**: Organizes specifications into 8 logical layers (Foundation, Domain, API, Data, etc.) for better navigability.
*   **📝 Template System**: Uses Handlebars-like templates to ensure consistent, high-quality markdown output.
*   **🛡️ Manifest Validation**: Built-in validation and repair for specs manifests to ensure long-term consistency.
*   **🕵️‍♂️ Analysis Swarm**: Orchestrates specialized agents to deeply analyze every aspect of a repository.

## 🚀 Installation

### Option 1: Install from GitHub Packages (Recommended)

Add the plugin to your `opencode.json` configuration.

```json
{
  "plugin": [
    "@mo-hhy/opencode-plugin-repo-spec-zero"
  ]
}
```

### Option 2: Local Development

1.  **Clone** the repository:
    ```bash
    git clone https://github.com/MO-HHY/opencode-plugin-repo-spec-zero.git
    cd opencode-plugin-repo-spec-zero
    ```

2.  **Install & Build**:
    ```bash
    npm install
    npm run build
    ```

## 🛠 Usage

### Analyze a Repository
Ask OpenCode to analyze a repository:

> "Analyze repo https://github.com/username/project"

### Advanced CLI Flags
The `repo_spec_zero_analyze` tool supports several advanced flags:

*   `--smart-dag`: (boolean) Enable/disable dynamic agent selection (default: true).
*   `--diagrams`: (`inline` | `standalone` | `both` | `none`) Control diagram output mode (default: `both`).
*   `--template`: (string) Override the default template for an agent.
*   `--skipAgents`: (string[]) List of agent IDs to explicitly skip.

## 🏗 Architecture

v2.1.0 introduces a **Modular Smart Swarm** architecture:

1.  **Feature Detector**: Scans the repo for frameworks, languages, and patterns.
2.  **Smart DAG Planner**: Builds a custom execution plan based on detected features.
3.  **Generic Analysis Agents**: High-performance agents guided by external prompts and templates.
4.  **Diagram Generator**: Extracts logic from analysis to create visual representations.

## 📦 Output Structure (v2.1.0)

Specifications are now organized hierarchically:

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
└── _diagrams/        # Standalone .mmd files
```

## 🤝 Contributing

1.  Fork the repo.
2.  Create a branch (`feat/new-agent`).
3.  Run tests (`npm test`).
4.  Submit a PR.

---
*Built with ❤️ by the MO-HHY Team.*

