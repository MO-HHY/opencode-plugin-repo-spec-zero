# DAG Definition - Agent Dependency Graph

**Versione:** 1.0
**Data:** 2026-01-16

---

## Visual Representation

```
                                    ┌───────────────┐
                                    │   BOOTSTRAP   │ Layer 0
                                    │  (key files)  │
                                    └───────┬───────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │   OVERVIEW    │ Layer 1
                                    │  (structure)  │
                                    └───────┬───────┘
                                            │
                        ┌───────────────────┼───────────────────┐
                        │                   │                   │
                        ▼                   ▼                   ▼
                ┌───────────┐       ┌───────────┐       ┌───────────┐
                │  MODULE   │       │  ENTITY   │       │ (parallel)│ Layer 2
                └─────┬─────┘       └─────┬─────┘       └───────────┘
                      │                   │
        ┌─────────────┼───────────────────┼─────────────┐
        │             │                   │             │
        ▼             ▼                   ▼             ▼
┌───────────┐ ┌───────────┐       ┌───────────┐ ┌───────────┐
│    DB     │ │ DATA_MAP  │       │   EVENT   │ │ DEPENDENCY│ Layer 3
└─────┬─────┘ └─────┬─────┘       └─────┬─────┘ └─────┬─────┘
      │             │                   │             │
      └──────┬──────┴───────────────────┘             │
             │                                        │
             ▼                                        │
     ┌───────────────┐                               │
     │      API      │◄──────────────────────────────┘ Layer 4
     └───────┬───────┘
             │
    ┌────────┼────────┬────────────┐
    │        │        │            │
    ▼        ▼        ▼            ▼
┌──────┐ ┌──────┐ ┌────────┐ ┌───────────┐
│ AUTH │ │AUTHZ │ │SECURITY│ │PROMPT_SEC │ Layer 5
└──┬───┘ └──┬───┘ └────┬───┘ └─────┬─────┘
   │        │          │           │
   │        │          │           │
   ▼        ▼          ▼           ▼
┌──────┐ ┌──────┐ ┌────────┐ ┌───────────┐
│DEPLOY│ │MONITOR│ │  ML   │ │   FLAG    │ Layer 6
└──┬───┘ └──┬───┘ └────┬───┘ └─────┬─────┘
   │        │          │           │
   └────────┴──────────┴───────────┘
                    │
                    ▼
            ┌───────────────┐
            │   SUMMARY     │ Layer 7
            │  (finalizer)  │
            └───────────────┘
```

---

## Layer Definitions

### Layer 0: Bootstrap
| Agent | Dependencies | Output | Description |
|-------|-------------|--------|-------------|
| `bootstrap` | none | `context.keyFiles` | Reads package.json, README, config files |

**Key Files to Read:**
- `package.json` / `pyproject.toml` / `requirements.txt`
- `README.md`
- `docker-compose.yml` / `Dockerfile`
- `lerna.json` / `pnpm-workspace.yaml`
- `.env.example`
- Entry points (`src/index.*`, `src/main.*`, `server.*`)

---

### Layer 1: Overview
| Agent | Dependencies | Output | Description |
|-------|-------------|--------|-------------|
| `overview` | `bootstrap` | `overview.md` | High-level architecture, tech stack |

**Receives from Context:**
- All key file contents
- Repository structure

**Produces:**
- Executive summary
- Technology stack table
- Architecture pattern identification
- Build/run commands

---

### Layer 2: Core Analysis (Parallel)
| Agent | Dependencies | Output | Description |
|-------|-------------|--------|-------------|
| `module` | `overview` | `module.md` | Module breakdown |
| `entity` | `overview` | `entity.md` | Domain entities |

**Receives from Context:**
- `overview` summary
- Key files

---

### Layer 3: Data Layer (Parallel)
| Agent | Dependencies | Output | Description |
|-------|-------------|--------|-------------|
| `db` | `module`, `entity` | `db.md` | Database schema |
| `data_map` | `module`, `entity` | `data_map.md` | Data flow |
| `event` | `module`, `entity` | `event.md` | Events/messaging |
| `dependency` | `module` | `dependency.md` | Package deps |

**Receives from Context:**
- `module` summary
- `entity` summary

---

### Layer 4: Integration
| Agent | Dependencies | Output | Description |
|-------|-------------|--------|-------------|
| `api` | `db`, `entity` | `api.md` | API endpoints |
| `service_dep` | `api` | `service_dep.md` | External services |

---

### Layer 5: Security (Parallel)
| Agent | Dependencies | Output | Description |
|-------|-------------|--------|-------------|
| `auth` | `api` | `auth.md` | Authentication |
| `authz` | `auth` | `authz.md` | Authorization |
| `security` | `api`, `db` | `security.md` | General security |
| `prompt_sec` | `api` | `prompt_sec.md` | LLM security |

---

### Layer 6: Ops (Parallel)
| Agent | Dependencies | Output | Description |
|-------|-------------|--------|-------------|
| `deployment` | `module`, `dependency` | `deployment.md` | CI/CD, infra |
| `monitor` | `api`, `db` | `monitor.md` | Observability |
| `ml` | `api`, `data_map` | `ml.md` | ML/AI services |
| `flag` | `module` | `flag.md` | Feature flags |

---

### Layer 7: Finalizer
| Agent | Dependencies | Output | Description |
|-------|-------------|--------|-------------|
| `summary` | `*` (all) | `SUMMARY.md` | Executive report |

**Receives from Context:**
- All agent summaries
- Metadata (execution time, prompt versions)

---

## Context Flow

```typescript
// What each layer adds to context

Layer 0 (Bootstrap):
  context.keyFiles = {
    'package.json': '{ "name": "palantir", ... }',
    'backend/package.json': '...',
    'webapp/package.json': '...'
  }

Layer 1 (Overview):
  context.agentOutputs['overview'] = {
    summary: 'Monorepo with backend (Apollo GraphQL) and webapp (React 19)...',
    techStack: ['Node.js', 'React 19', 'MongoDB', 'GraphQL'],
    archPattern: 'monorepo'
  }

Layer 2 (Module/Entity):
  context.agentOutputs['module'] = {
    summary: 'Backend: server, graphql modules. Webapp: pages, components...',
    modules: ['backend/graphql', 'webapp/components', ...]
  }
  context.agentOutputs['entity'] = {
    summary: 'Core entities: TagLog, Device, Workspace, Project...',
    entities: ['TagLog', 'Device', 'Workspace', ...]
  }

// ... and so on
```

---

## Token Economy

### Strategy: Summaries First
- Each agent produces a `summary` (max 500 chars)
- Downstream agents receive summaries by default
- Full content available via `context.getFullContent(agentId)`

### Example Token Usage

| Content Type | Tokens (approx) |
|--------------|-----------------|
| Full overview.md | ~2000 |
| Overview summary | ~200 |
| All 17 agent summaries | ~3400 |
| All 17 full outputs | ~34000 |

**Savings: 90% token reduction** by using summaries

---

## Parallel Execution

Agents in the same layer with no inter-dependencies execute in parallel:

```typescript
// Layer 2 execution
await Promise.all([
  moduleAgent.process(context),
  entityAgent.process(context)
]);

// Layer 3 execution (after layer 2 completes)
await Promise.all([
  dbAgent.process(context),
  dataMapAgent.process(context),
  eventAgent.process(context),
  dependencyAgent.process(context)
]);
```

**Estimated speedup: 3-4x** vs sequential execution

---

## Edge Cases

### Missing Dependencies
If an agent's dependency failed:
- Agent still executes with available context
- Warning logged in audit
- Summary marked as "partial"

### Circular Dependencies
- Detected at DAG validation time
- Throws error before execution

### Optional Agents
Some agents can be skipped based on repo type:
- `ml`: Skip if no ML indicators
- `prompt_sec`: Skip if no LLM usage
- `flag`: Skip if no feature flag lib

---

*DAG Definition v1.0*
