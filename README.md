# RepoSpecZero Plugin 🕵️‍♂️

**RepoSpecZero** (`@mo-hhy/opencode-plugin-repo-spec-zero`) is a powerful **Agentic Swarm** plugin for OpenCode that autonomously analyzes codebases and generates **SPEC-OS** compatible specifications ("Spec Zero").

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
*   **No API Keys Required**: Uses the native OpenCode LLM configuration.

### Option 1: Install from GitHub Packages (Recommended)

Add the plugin to your `opencode.json` configuration. You may need to configure your `.npmrc` to authenticate with GitHub Packages if the package is private.

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

3.  **Link**:
    Update your `opencode.json` to point to the local directory or use `npm link`.

## ⚙️ Configuration

No additional configuration is required. The plugin inherits the LLM settings from your OpenCode environment.

## 🛠 Usage

### Analyze a Public Repository
Ask OpenCode to analyze a GitHub repository directly:

> "Analyze repo https://github.com/username/project"

### Analyze a ClickUp Task
If you use the `activity-register` plugin, you can process a task directly. The orchestrator will extract the repository URL from the task description:

> "Analyze task CLK-1234"

## 🏗 Architecture

This plugin uses a **Hierarchical Swarm** architecture.

*   **Orchestrator**: The "Brain". Manages lifecycle, git operations, and agent coordination.
*   **Specialized Agents**: 17 domain experts (e.g., `DbAgent`, `SecurityAgent`, `ReactComponentAgent`) that execute in parallel or sequence based on dependencies.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed diagrams and internal logic.

## 📦 Output Structure

The plugin generates a `spec-zero` compatible folder structure:

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
