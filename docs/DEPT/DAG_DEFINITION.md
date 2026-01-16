# DAG Definition - Agent Dependency Graph

**Versione:** 1.0.0
**Data:** 2026-01-16
**Updated:** With SharedContext integration

---

## Visual Representation

```
                                ┌─────────────────────────────────────┐
                                │         SHARED CONTEXT              │
                                │  ┌─────────────────────────────┐    │
                                │  │ keyFiles: Map<path, content>│    │
                                │  │ agentOutputs: Map<id, out>  │    │
                                │  │ promptVersions: []          │    │
                                │  └─────────────────────────────┘    │
                                └──────────────────┬──────────────────┘
                                                   │
                              ┌────────────────────┴────────────────────┐
                              │            LAYER 0: BOOTSTRAP           │
                              │                                         │
                              │  ┌──────────────┐                       │
                              │  │  BOOTSTRAP   │ ← Reads key files     │
                              │  │  (no deps)   │   into SharedContext  │
                              │  └──────┬───────┘                       │
                              └─────────┼───────────────────────────────┘
                                        │
                              ┌─────────┴───────────────────────────────┐
                              │            LAYER 1: OVERVIEW            │
                              │                                         │
                              │  ┌──────────────┐                       │
                              │  │   OVERVIEW   │ ← High-level analysis │
                              │  │              │   Writes to context   │
                              │  └──────┬───────┘                       │
                              └─────────┼───────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
          ┌─────────┴─────────────────────────────┐  ┌──────┴──────┐
          │          LAYER 2: CORE               │  │             │
          │                                       │  │             │
          │  ┌──────────┐      ┌──────────┐      │  │             │
          │  │  MODULE  │      │  ENTITY  │      │  │             │
          │  │          │      │          │      │  │             │
          │  └────┬─────┘      └────┬─────┘      │  │             │
          └───────┼────────────────┼─────────────┘  │             │
                  │                │                │             │
      ┌───────────┴────────────────┴───────────────┐│             │
      │           LAYER 3: DATA                    ││             │
      │                                            ││             │
      │  ┌────────┐   ┌──────────┐   ┌────────┐   ││             │
      │  │   DB   │   │ DATA_MAP │   │ EVENT  │   ││             │
      │  └───┬────┘   └────┬─────┘   └───┬────┘   ││             │
      └──────┼─────────────┼─────────────┼────────┘│             │
             │             │             │         │             │
   ┌─────────┴─────────────┴─────────────┴────────┐│             │
   │           LAYER 4: INTEGRATION              ││             │
   │                                              ││             │
   │  ┌────────┐   ┌────────────┐   ┌───────────┐││             │
   │  │  API   │   │ DEPENDENCY │   │SERVICE_DEP│││             │
   │  └───┬────┘   └─────┬──────┘   └─────┬─────┘││             │
   └──────┼──────────────┼────────────────┼──────┘│             │
          │              │                │       │             │
  ┌───────┴──────────────┴────────────────┴──────┐│             │
  │           LAYER 5: SECURITY                  ││             │
  │                                              ││             │
  │  ┌──────┐  ┌───────┐  ┌──────────┐  ┌──────┐ ││             │
  │  │ AUTH │  │ AUTHZ │  │ SECURITY │  │PROMPT││ │             │
  │  │      │→ │       │  │          │  │ SEC  ││ │             │
  │  └──┬───┘  └───┬───┘  └────┬─────┘  └──┬───┘ ││             │
  └─────┼──────────┼───────────┼───────────┼─────┘│             │
        │          │           │           │      │             │
  ┌─────┴──────────┴───────────┴───────────┴─────┐│             │
  │           LAYER 6: OPS                       ││             │
  │                                              ││             │
  │  ┌──────────┐  ┌─────────┐  ┌────┐  ┌──────┐ ││             │
  │  │DEPLOYMENT│  │ MONITOR │  │ ML │  │ FLAG │ ││             │
  │  └────┬─────┘  └────┬────┘  └──┬─┘  └──┬───┘ ││             │
  └───────┼─────────────┼──────────┼───────┼─────┘│             │
          │             │          │       │      │             │
          └─────────────┴──────────┴───────┴──────┘             │
                               │                                │
                    ┌──────────┴────────────────────────────────┘
                    │
          ┌─────────┴─────────────────────────────┐
          │          LAYER 7: FINALIZER           │
          │                                       │
          │  ┌──────────────────────────────┐     │
          │  │          SUMMARY             │     │
          │  │  (depends on ALL previous)   │     │
          │  └──────────────────────────────┘     │
          └───────────────────────────────────────┘
```

---

## Agent Definitions

| Agent ID | Layer | Dependencies | Parallel | Optional | Output File |
|----------|-------|--------------|----------|----------|-------------|
| bootstrap | 0 | - | No | No | (context only) |
| overview | 1 | bootstrap | No | No | overview.md |
| module | 2 | overview | Yes | No | modules.md |
| entity | 2 | overview | Yes | No | entities.md |
| db | 3 | module, entity | Yes | No | database.md |
| data_map | 3 | module, entity | Yes | No | data-mapping.md |
| event | 3 | module, entity | Yes | No | events.md |
| api | 4 | db, entity | Yes | No | apis.md |
| dependency | 4 | module | Yes | No | dependencies.md |
| service_dep | 4 | api | Yes | No | service-dependencies.md |
| auth | 5 | api | Yes | No | authentication.md |
| authz | 5 | auth | Yes | No | authorization.md |
| security | 5 | api, db | Yes | No | security.md |
| prompt_sec | 5 | api | Yes | Yes | prompt-security.md |
| deployment | 6 | module, dependency | Yes | No | deployment.md |
| monitor | 6 | api, db | Yes | No | monitoring.md |
| ml | 6 | api, data_map | Yes | Yes | ml-services.md |
| flag | 6 | module | Yes | Yes | feature-flags.md |
| summary | 7 | * (all) | No | No | SUMMARY.md |

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

## Customization

### Adding a New Agent

1. Create agent in `src/agents/spec-zero/{category}/{name}.agent.ts`
2. Add node to `DEFAULT_DAG` in `dag-executor.ts`
3. Register agent in `index.ts`

### Skipping Agents

Use `createCustomDAG()` to create a subset:

```typescript
import { createCustomDAG, DEFAULT_DAG } from './core/dag-executor.js';

// Only run core analysis
const coreOnlyDAG = createCustomDAG([
    'bootstrap', 'overview', 'module', 'entity', 'summary'
], DEFAULT_DAG);
```

### Conditional Execution

Set `optional: true` on agents that can be skipped:

```typescript
{ agentId: 'ml', dependencies: ['api'], parallel: true, optional: true }
```

---

*DAG Definition v1.0.0 - Updated 2026-01-16*
