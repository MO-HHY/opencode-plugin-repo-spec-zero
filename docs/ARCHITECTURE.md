# Architecture & Design

**RepoSpecZero** acts as a bridge between raw code repositories and the **SPEC-OS** knowledge graph. It employs an agentic swarm pattern to decompose the complex task of "understanding a codebase" into granular, expert-level analysis tasks.

## 🧩 Agent Swarm Topology

The system is coordinated by a central **Orchestrator** which manages 17 specialized agents organized by domain. Dependencies (arrows) dictate the execution order.

```mermaid
graph TD
    User((User)) -->|Analyze| Orch[Orchestrator]
    
    subgraph "Phase 1: Foundation"
        Orch --> Detect[DetectionSkill]
        Orch --> Git[GitSkill]
    end

    subgraph "Phase 2: Core Analysis"
        Overview[Overview Agent]
        Module[Module Agent]
        Entity[Entity Agent]
    end

    subgraph "Phase 3: Integration & Data"
        Dep[Dependency Agent]
        API[API Agent]
        DB[Database Agent]
        Event[Event Agent]
    end
    
    subgraph "Phase 4: Security & Ops"
        Sec[Security Agent]
        Auth[Auth Agent]
        Deploy[Deployment Agent]
        Prompt[PromptSec Agent]
    end

    %% Dependencies
    Orch --> Overview
    Overview --> Module
    Overview --> Dep
    Overview --> Deploy
    Overview --> Prompt
    
    Dep --> Deploy
    
    Event --> Service[ServiceDep Agent]
    API --> Service
```

## ⚡ Execution Flow

The analysis process follows a strict pipeline to ensure context is built progressively.

```mermaid
sequenceDiagram
    participant U as User
    participant O as Orchestrator
    participant G as GitSkill
    participant S as Swarm (Agents)
    participant W as WriterSkill
    
    U->>O: "Analyze Repo X"
    O->>G: Clone Repository
    G-->>O: Local Path
    
    O->>O: Detect Repo Type (Frontend/Backend/etc)
    
    O->>S: Topological Sort Agents
    loop For Each Agent
        O->>S: Execute Agent (Context + Prev Results)
        S->>O: Analysis Markdown
    end
    
    O->>W: Structure Output ({project}-spec/)
    W-->>O: Done
    
    O->>U: "Analysis Complete. Spec ready."
```

## 📂 Implementation Details

### 1. The Orchestrator (`RepoSpecZeroOrchestrator`)
*   **Role**: The primary intelligence.
*   **Method**: `process(context)`
*   **Logic**:
    1.  Receives `repoUrl` or `taskId`.
    2.  Clones the repo to a temporary workspace.
    3.  Runs `SpecZeroDetectionSkill` to identify the tech stack (e.g., "Next.js + Tailwind").
    4.  Builds a dependency graph of all 17 agents.
    5.  Executes them in topological order (e.g., `Overview` runs first, so `Deployment` can read the overview).
    6.  Aggregates outputs and writes files.

### 2. Specialized Agents
Each agent extends `RepoSpecZeroAgent` and focuses on one specific aspect.
*   **Prompts**: Loaded dynamically from `prompts/{type}/{agent}.md`.
*   **Context**: Can request outputs from previous agents (defined via `contextDeps`).
    *   *Example*: `DeploymentAgent` requests the output of `DependencyAgent` to understand what infrastructure libraries are used.

### 3. Skills
*   **`AnalyzeContextSkill`**: Wraps the LLM (Anthropic) calls with massive context window handling.
*   **`OutputWriterSkill`**: Enforces the rigid SPEC-OS directory structure.
*   **`BuildRepoTreeSkill`**: Generates a token-optimized representation of the file tree.

## 💾 Data Flow

1.  **Input**: Raw Code (`.git`)
2.  **Processing**: LLM Context Window (Code Tree + previous agent outputs)
3.  **Output**: Structured Markdown (`spec_zero.md`) -> SPEC-OS Graph
