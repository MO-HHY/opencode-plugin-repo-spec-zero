# RepoSpecZero Plugin 🕵️‍♂️

**RepoSpecZero** (`opencode-plugin-repo-spec-zero`) is a powerful **Agentic Swarm** plugin for OpenCode that autonomously analyzes codebases and generates **SPEC-OS** compatible specifications ("Spec Zero").

> **Part of the [HANDHY SPEC-OS](https://github.com/MO-HHY/HANDHY-SPEC-OS) Ecosystem.**

## ✨ Features

*   **🕵️‍♂️ Analysis Swarm**: Orchestrates **17 specialized agents** (Overview, Database, Security, API, etc.) to deeply analyze every aspect of a repository.
*   **🧠 Intelligent Detection**: Automatically detects repository type (Frontend, Backend, IaC, Library, Mobile) and selects the optimal analysis strategy.
*   **📂 SPEC-OS Output**: Generates a standardized `{project}-spec/` directory structure compatible with the SPEC-OS Knowledge Graph.
*   **🔗 ClickUp Integration**: Fetches tasks from ClickUp (via `activity-register`) and updates them with analysis progress and results.
*   **🛡️ Secure & Local**: Runs within your OpenCode environment, leveraging your configured LLM (Claude/Anthropic).

## 🚀 Installation

### Prerequisites
*   **OpenCode** installed.
*   **Anthropic API Key** configured in your environment.

### 1. Install via `opencode.json`

Add the plugin to your OpenCode workspace configuration:

```json
{
  "plugin": [
    "opencode-plugin-repo-spec-zero"
  ]
}
```

### 2. Manual Installation (Development)

Build the plugin locally and link it:

```bash
git clone https://github.com/MO-HHY/opencode-plugin-repo-spec-zero.git
cd opencode-plugin-repo-spec-zero
npm install
npm run build
```

Then reference the local path in your `opencode.json` or use `npm link`.

## 🛠 Usage

### 1. Analyze a Repository (URL)
Ask OpenCode to analyze a public GitHub repository:

> "Analyze repo https://github.com/username/project"

### 2. Analyze a ClickUp Task
If you use the `activity-register` plugin, you can process a task directly:

> "Analyze task CLK-1234"

The Orchestrator will:
1.  Fetch the repo URL from the task description.
2.  Clone the repo to a temp workspace.
3.  Run the 17-agent swarm.
4.  Generate the spec.
5.  Update the ClickUp task with the result.

## 🏗 Architecture

This plugin uses a **Hierarchical Swarm** architecture.

*   **Orchestrator**: The "Brain". Manages lifecycle, git operations, and agent coordination.
*   **Specialized Agents**: 17 domain experts (e.g., `DbAgent`, `SecurityAgent`, `ReactComponentAgent`) that execute in parallel or sequence based on dependencies.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed diagrams and internal logic.

## 📦 Output Structure

The plugin generates a `spec-zero` compatible folder:

```
{project}-spec/
├── analysis/
│   ├── core/           # Overview, Modules, Entities
│   ├── data/           # Database, Events, Data Map
│   ├── integration/    # APIs, Dependencies
│   ├── security/       # Auth, Authz, Vulnerabilities
│   └── ops/            # Deployment, Monitoring
├── architecture/       # High-level architecture docs
└── spec_zero.md        # Master entry point
```

## 🤝 Contributing

1.  Fork the repo.
2.  Create a branch (`feat/new-agent`).
3.  Run tests (`npm test`).
4.  Submit a PR.

---
*Built with ❤️ by the MO-HHY Team.*
