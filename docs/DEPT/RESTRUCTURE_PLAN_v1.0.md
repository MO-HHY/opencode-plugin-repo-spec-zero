# Repo-Spec-Zero Plugin Restructure Plan v1.0

**Data:** 2026-01-16
**Versione Target:** v1.0.0
**Autore:** Analisi collaborativa

---

## Executive Summary

Ristrutturazione completa del plugin per trasformarlo da sistema sequenziale "cieco" a sistema intelligente a grafo con:

1. **Context Condiviso** - Accumula conoscenza progressivamente
2. **Esecuzione a Grafo (DAG)** - Agenti si passano risultati
3. **Prompt Versionati** - Tracciabilità completa
4. **Token Economy** - Passa solo ciò che serve
5. **Output SPEC-OS Compliant** - Formato strutturato validato

---

## Architettura Attuale (Problemi)

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Agent 1  │→ │ Agent 2  │→ │ Agent 3  │→ │ Agent N  │     │
│  │ (cieco)  │  │ (cieco)  │  │ (cieco)  │  │ (cieco)  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│       ↓             ↓             ↓             ↓           │
│   [file.md]     [file.md]     [file.md]     [file.md]       │
└─────────────────────────────────────────────────────────────┘

Problemi:
- Ogni agente riceve solo repoStructure (albero directory)
- Nessun accesso ai file reali della repo
- Nessun accesso ai risultati degli agenti precedenti
- Output non strutturato
- Prompt generici senza versioning
```

---

## Architettura Target (DAG + Context)

```
                         ┌─────────────────────┐
                         │   SHARED CONTEXT    │
                         │  ┌───────────────┐  │
                         │  │ keyFiles{}    │  │
                         │  │ agentResults{}│  │
                         │  │ metadata{}    │  │
                         │  │ promptVersions│  │
                         │  └───────────────┘  │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     │                     │
     ┌─────────────┐                │                     │
     │  BOOTSTRAP  │ ← Legge key files, crea context base │
     │   Agent     │                │                     │
     └──────┬──────┘                │                     │
            │                       │                     │
            ▼                       │                     │
     ┌─────────────┐                │                     │
     │  OVERVIEW   │ ← Scrive overview.md → Context       │
     │   Agent     │                │                     │
     └──────┬──────┘                │                     │
            │                       │                     │
    ┌───────┴───────┐               │                     │
    ▼               ▼               │                     │
┌───────┐     ┌───────┐             │                     │
│MODULE │     │ENTITY │  ← Leggono overview da Context    │
│Agent  │     │Agent  │             │                     │
└───┬───┘     └───┬───┘             │                     │
    │             │                 │                     │
    ▼             ▼                 │                     │
┌───────┐     ┌───────┐             │                     │
│  DB   │     │  API  │  ← Leggono module + entity        │
│Agent  │     │Agent  │             │                     │
└───┬───┘     └───┬───┘             │                     │
    │             │                 │                     │
    └──────┬──────┘                 │                     │
           ▼                        │                     │
     ┌───────────┐                  │                     │
     │ SECURITY  │ ← Legge API + DB │                     │
     │  Agents   │                  │                     │
     └─────┬─────┘                  │                     │
           │                        │                     │
           ▼                        │                     │
     ┌───────────┐                  │                     │
     │ FINALIZER │ ← Consolida tutto + genera summary     │
     │   Agent   │                  │                     │
     └───────────┘                  │                     │
```

---

## Struttura Directory Target

```
opencode-plugin-repo-spec-zero/
├── src/
│   ├── index.ts                    # Plugin entry point
│   ├── types.ts                    # Types (ESTESO)
│   │
│   ├── core/
│   │   ├── config.ts               # Configurazione
│   │   ├── context.ts              # NEW: SharedContext class
│   │   ├── dag-executor.ts         # NEW: DAG execution engine
│   │   ├── prompt-loader.ts        # NEW: Versioned prompt loader
│   │   ├── file-reader.ts          # NEW: Repository file reader
│   │   └── output-validator.ts     # NEW: SPEC-OS format validator
│   │
│   ├── agents/
│   │   ├── base.ts                 # Base agent (REFACTORED)
│   │   ├── registry.ts             # NEW: Agent registry with DAG
│   │   │
│   │   ├── core/
│   │   │   ├── orchestrator.ts     # REFACTORED: Uses DAG executor
│   │   │   └── bootstrap.ts        # NEW: Reads key files into context
│   │   │
│   │   └── spec-zero/
│   │       ├── base.ts             # REFACTORED: Context-aware
│   │       ├── core/
│   │       │   ├── overview.ts     # REFACTORED
│   │       │   ├── module.ts
│   │       │   └── entity.ts
│   │       ├── data/
│   │       │   ├── db.ts
│   │       │   ├── data-map.ts
│   │       │   └── event.ts
│   │       ├── integration/
│   │       │   ├── api.ts
│   │       │   ├── dependency.ts
│   │       │   └── service-dep.ts
│   │       ├── security/
│   │       │   ├── auth.ts
│   │       │   ├── authz.ts
│   │       │   ├── security.ts
│   │       │   └── prompt-sec.ts
│   │       ├── ops/
│   │       │   ├── deployment.ts
│   │       │   ├── monitor.ts
│   │       │   ├── ml.ts
│   │       │   └── flag.ts
│   │       └── finalizer/
│   │           └── summary.ts      # NEW: Final consolidation
│   │
│   ├── prompts/
│   │   ├── index.ts                # NEW: Prompt composition
│   │   ├── system-context.ts       # NEW: Shared context prompt
│   │   ├── output-schema.ts        # NEW: SPEC-OS output format
│   │   └── versions.json           # NEW: Prompt version registry
│   │
│   └── skills/
│       ├── native-llm.skill.ts     # EXISTING
│       ├── build-repo-tree.skill.ts# EXISTING
│       ├── read-repo-file.skill.ts # NEW: Read specific file
│       ├── search-repo.skill.ts    # NEW: Grep/search in repo
│       └── output-writer.skill.ts  # REFACTORED: SPEC-OS format
│
├── prompts/                        # Markdown prompts (REFACTORED)
│   ├── _meta/
│   │   └── versions.json           # Prompt version tracking
│   ├── shared/
│   │   ├── system-context.md       # NEW
│   │   ├── output-schema.md        # NEW
│   │   ├── hl_overview.md          # v3 REFACTORED
│   │   ├── module_deep_dive.md     # v2 REFACTORED
│   │   └── ... (altri prompt)
│   └── templates/
│       ├── spec-frontmatter.md     # NEW: YAML template
│       └── section-template.md     # NEW: Section template
│
└── docs/
    ├── RESTRUCTURE_PLAN_v1.0.md    # This file
    └── DAG_DEFINITION.md           # Agent dependency graph
```

---

## Componenti Chiave

### 1. SharedContext (NUOVO)

```typescript
// src/core/context.ts

export interface PromptVersion {
  id: string;
  version: string;
  hash: string;
}

export interface AgentOutput {
  agentId: string;
  filePath: string;
  summary: string;      // Max 500 chars for token economy
  fullContent: string;  // Full content if needed
  promptVersion: PromptVersion;
  timestamp: Date;
}

export interface KeyFile {
  relativePath: string;
  content: string;
  truncated: boolean;
}

export class SharedContext {
  // Metadata
  readonly projectSlug: string;
  readonly repoType: string;
  readonly baseDir: string;
  readonly startTime: Date;

  // Repository data
  readonly repoStructure: string;
  readonly keyFiles: Map<string, KeyFile>;
  
  // Agent outputs (accumulates during execution)
  private agentOutputs: Map<string, AgentOutput> = new Map();
  
  // Prompt versions used
  private promptVersions: PromptVersion[] = [];

  constructor(params: ContextParams) {
    this.projectSlug = params.projectSlug;
    this.repoType = params.repoType;
    this.baseDir = params.baseDir;
    this.startTime = new Date();
    this.repoStructure = params.repoStructure;
    this.keyFiles = new Map();
  }

  // Add key file content
  addKeyFile(relativePath: string, content: string, maxChars = 5000): void {
    this.keyFiles.set(relativePath, {
      relativePath,
      content: content.slice(0, maxChars),
      truncated: content.length > maxChars
    });
  }

  // Register agent output
  registerOutput(output: AgentOutput): void {
    this.agentOutputs.set(output.agentId, output);
    this.promptVersions.push(output.promptVersion);
  }

  // Get outputs from specific agents (for dependency resolution)
  getOutputs(agentIds: string[]): AgentOutput[] {
    return agentIds
      .map(id => this.agentOutputs.get(id))
      .filter((o): o is AgentOutput => o !== undefined);
  }

  // Get summary-only view (token economy)
  getSummaries(agentIds: string[]): string {
    return this.getOutputs(agentIds)
      .map(o => `## ${o.agentId}\n${o.summary}`)
      .join('\n\n');
  }

  // Get full content for specific agent
  getFullContent(agentId: string): string | undefined {
    return this.agentOutputs.get(agentId)?.fullContent;
  }

  // Build context for an agent based on its dependencies
  buildAgentContext(dependencies: string[]): string {
    const parts: string[] = [];
    
    // Add key files (always available)
    parts.push('## Key Files\n');
    for (const [path, file] of this.keyFiles) {
      parts.push(`### ${path}\n\`\`\`\n${file.content}\n\`\`\``);
    }
    
    // Add dependency outputs (summaries only for token economy)
    if (dependencies.length > 0) {
      parts.push('\n## Previous Analysis Results\n');
      parts.push(this.getSummaries(dependencies));
    }
    
    return parts.join('\n');
  }

  // Generate final metadata
  generateMetadata(): object {
    return {
      projectSlug: this.projectSlug,
      repoType: this.repoType,
      analysisDate: this.startTime.toISOString(),
      durationMs: Date.now() - this.startTime.getTime(),
      agentsExecuted: Array.from(this.agentOutputs.keys()),
      promptVersions: this.promptVersions
    };
  }
}
```

### 2. DAG Executor (NUOVO)

```typescript
// src/core/dag-executor.ts

export interface DAGNode {
  agentId: string;
  dependencies: string[];  // IDs of agents that must run before
  parallel?: boolean;      // Can run in parallel with siblings
}

export interface DAGDefinition {
  nodes: DAGNode[];
}

// Default DAG for Repo-Spec-Zero
export const DEFAULT_DAG: DAGDefinition = {
  nodes: [
    // Layer 0: Bootstrap (no deps)
    { agentId: 'bootstrap', dependencies: [] },
    
    // Layer 1: Overview (depends on bootstrap)
    { agentId: 'overview', dependencies: ['bootstrap'] },
    
    // Layer 2: Core analysis (parallel, depend on overview)
    { agentId: 'module', dependencies: ['overview'], parallel: true },
    { agentId: 'entity', dependencies: ['overview'], parallel: true },
    
    // Layer 3: Data layer (depend on module + entity)
    { agentId: 'db', dependencies: ['module', 'entity'], parallel: true },
    { agentId: 'data_map', dependencies: ['module', 'entity'], parallel: true },
    { agentId: 'event', dependencies: ['module', 'entity'], parallel: true },
    
    // Layer 4: Integration (depend on data layer)
    { agentId: 'api', dependencies: ['db', 'entity'], parallel: true },
    { agentId: 'dependency', dependencies: ['module'], parallel: true },
    { agentId: 'service_dep', dependencies: ['api'], parallel: true },
    
    // Layer 5: Security (depend on api)
    { agentId: 'auth', dependencies: ['api'], parallel: true },
    { agentId: 'authz', dependencies: ['auth'], parallel: true },
    { agentId: 'security', dependencies: ['api', 'db'], parallel: true },
    { agentId: 'prompt_sec', dependencies: ['api'], parallel: true },
    
    // Layer 6: Ops (depend on various)
    { agentId: 'deployment', dependencies: ['module', 'dependency'], parallel: true },
    { agentId: 'monitor', dependencies: ['api', 'db'], parallel: true },
    { agentId: 'ml', dependencies: ['api', 'data_map'], parallel: true },
    { agentId: 'flag', dependencies: ['module'], parallel: true },
    
    // Layer 7: Finalizer (depends on all)
    { agentId: 'summary', dependencies: ['*'] }  // * = all previous
  ]
};

export class DAGExecutor {
  private dag: DAGDefinition;
  private context: SharedContext;
  private agents: Map<string, BaseAgent>;
  
  constructor(dag: DAGDefinition, context: SharedContext, agents: Map<string, BaseAgent>) {
    this.dag = dag;
    this.context = context;
    this.agents = agents;
  }

  // Get execution layers (topologically sorted)
  private getLayers(): string[][] {
    const layers: string[][] = [];
    const executed = new Set<string>();
    const remaining = new Set(this.dag.nodes.map(n => n.agentId));
    
    while (remaining.size > 0) {
      const layer: string[] = [];
      
      for (const node of this.dag.nodes) {
        if (executed.has(node.agentId)) continue;
        
        // Check if all dependencies are satisfied
        const deps = node.dependencies.filter(d => d !== '*');
        const allDepsExecuted = deps.every(d => executed.has(d));
        
        // Handle '*' (all previous)
        if (node.dependencies.includes('*')) {
          if (remaining.size === 1) { // Only this node left
            layer.push(node.agentId);
          }
        } else if (allDepsExecuted) {
          layer.push(node.agentId);
        }
      }
      
      if (layer.length === 0 && remaining.size > 0) {
        throw new Error('Circular dependency detected in DAG');
      }
      
      layers.push(layer);
      layer.forEach(id => {
        executed.add(id);
        remaining.delete(id);
      });
    }
    
    return layers;
  }

  // Execute the DAG
  async execute(client: any): Promise<void> {
    const layers = this.getLayers();
    
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      console.log(`[DAG] Executing layer ${i + 1}/${layers.length}: ${layer.join(', ')}`);
      
      // Execute agents in parallel within layer
      await Promise.all(
        layer.map(async agentId => {
          const agent = this.agents.get(agentId);
          if (!agent) {
            console.warn(`[DAG] Agent ${agentId} not found, skipping`);
            return;
          }
          
          const node = this.dag.nodes.find(n => n.agentId === agentId)!;
          const deps = node.dependencies.filter(d => d !== '*');
          
          // Build context for this agent
          const agentContext = this.context.buildAgentContext(deps);
          
          // Execute agent
          const result = await agent.process({
            client,
            context: this.context,
            previousResults: agentContext,
            params: {}
          });
          
          // Register output in context
          if (result.success && result.data) {
            this.context.registerOutput({
              agentId,
              filePath: result.data.path,
              summary: result.data.summary || result.data.output?.slice(0, 500),
              fullContent: result.data.output,
              promptVersion: result.data.promptVersion,
              timestamp: new Date()
            });
          }
        })
      );
    }
  }
}
```

### 3. Versioned Prompt Loader (NUOVO)

```typescript
// src/core/prompt-loader.ts

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface PromptMetadata {
  id: string;
  version: string;
  hash: string;
  lastModified: string;
}

export class PromptLoader {
  private promptsDir: string;
  private cache: Map<string, { content: string; metadata: PromptMetadata }> = new Map();
  
  constructor(promptsDir: string) {
    this.promptsDir = promptsDir;
  }

  // Load prompt with version tracking
  load(promptId: string, repoType: string = 'generic'): { content: string; metadata: PromptMetadata } {
    const cacheKey = `${repoType}/${promptId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Try type-specific, then generic, then shared
    const paths = [
      path.join(this.promptsDir, repoType, `${promptId}.md`),
      path.join(this.promptsDir, 'generic', `${promptId}.md`),
      path.join(this.promptsDir, 'shared', `${promptId}.md`)
    ];

    for (const p of paths) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        const version = this.extractVersion(content);
        const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
        
        const result = {
          content: this.stripVersionLine(content),
          metadata: {
            id: promptId,
            version,
            hash,
            lastModified: fs.statSync(p).mtime.toISOString()
          }
        };
        
        this.cache.set(cacheKey, result);
        return result;
      }
    }

    throw new Error(`Prompt ${promptId} not found in ${this.promptsDir}`);
  }

  // Extract version from first line (format: version=X)
  private extractVersion(content: string): string {
    const match = content.match(/^version=(\d+)/);
    return match ? match[1] : '1';
  }

  // Remove version line from content
  private stripVersionLine(content: string): string {
    return content.replace(/^version=\d+\n/, '');
  }

  // Compose full prompt with system context
  compose(
    promptId: string,
    repoType: string,
    variables: Record<string, string>,
    systemContext: string
  ): { prompt: string; metadata: PromptMetadata } {
    const { content, metadata } = this.load(promptId, repoType);
    
    // Replace variables
    let prompt = content;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    
    // Compose with system context
    const fullPrompt = `${systemContext}\n\n---\n\n${prompt}`;
    
    return { prompt: fullPrompt, metadata };
  }
}
```

### 4. Output Schema (NUOVO)

```typescript
// src/prompts/output-schema.ts

export const SPEC_OS_OUTPUT_SCHEMA = `## Output Format (MANDATORY)

Every output MUST follow this exact structure:

### YAML Frontmatter (Required)
\`\`\`yaml
---
uid: {project-slug}:spec:{section-name}
title: "{Section Title}"
status: draft
version: 1.0.0
created: {analysis-date}
prompt_version: {prompt-id}@v{version}
edges:
  - [[{project-slug}:spec:{related-section}|depends_on]]
---
\`\`\`

### Sections Structure
- Use H2 (##) for main sections
- Use H3 (###) for subsections
- Include code blocks with language tags
- Use tables for structured data

### Required Sections Per Agent Type

#### Overview Agent
- ## Executive Summary (3-5 sentences)
- ## Technology Stack (table)
- ## Architecture Pattern
- ## Entry Points
- ## Build & Run Commands

#### Module Agent
- ## Module: {name} (repeat for each)
  - Purpose
  - Key Files
  - Dependencies
  - Public API

#### API Agent
- ## Endpoints (table: Method | Path | Description)
- ## Authentication
- ## Request/Response Examples

### Edge Syntax
Use Obsidian-safe format:
\`[[{project-slug}:spec:{target}|{edge_type}]]\`

Edge types: depends_on, implements, extends, uses, contains

### Citation Rules
- ALWAYS cite file paths: \`backend/src/server.ts:42\`
- NEVER invent information
- Write "NOT_FOUND" if data is unavailable
`;

export const OUTPUT_VALIDATORS = {
  hasFrontmatter: (content: string): boolean => {
    return /^---\n[\s\S]*?\n---/.test(content);
  },
  
  hasUID: (content: string): boolean => {
    return /uid:\s*[\w-]+:[\w-]+:[\w-]+/.test(content);
  },
  
  hasPromptVersion: (content: string): boolean => {
    return /prompt_version:\s*[\w-]+@v\d+/.test(content);
  },
  
  validate: (content: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!OUTPUT_VALIDATORS.hasFrontmatter(content)) {
      errors.push('Missing YAML frontmatter');
    }
    if (!OUTPUT_VALIDATORS.hasUID(content)) {
      errors.push('Missing or invalid UID');
    }
    if (!OUTPUT_VALIDATORS.hasPromptVersion(content)) {
      errors.push('Missing prompt_version');
    }
    
    return { valid: errors.length === 0, errors };
  }
};
```

---

## Fasi di Implementazione

### Fase 1: Core Infrastructure (2-3 ore)
- [ ] Creare `src/core/context.ts` - SharedContext class
- [ ] Creare `src/core/prompt-loader.ts` - Versioned prompt loading
- [ ] Estendere `src/types.ts` - Nuove interfacce
- [ ] Creare `prompts/_meta/versions.json`

### Fase 2: DAG System (2-3 ore)
- [ ] Creare `src/core/dag-executor.ts` - DAG execution
- [ ] Creare `docs/DAG_DEFINITION.md` - Visual dependency graph
- [ ] Refactorare `src/agents/core/orchestrator.ts` - Use DAG

### Fase 3: Bootstrap Agent (1-2 ore)
- [ ] Creare `src/agents/core/bootstrap.ts` - Key file reader
- [ ] Creare `src/skills/read-repo-file.skill.ts`
- [ ] Definire lista file chiave per tipo repo

### Fase 4: Prompt Refactoring (3-4 ore)
- [ ] Creare `src/prompts/system-context.ts`
- [ ] Creare `src/prompts/output-schema.ts`
- [ ] Refactorare tutti i prompt in `prompts/shared/`
- [ ] Aggiungere version tag a ogni prompt

### Fase 5: Agent Refactoring (4-5 ore)
- [ ] Refactorare `src/agents/spec-zero/base.ts` - Context-aware
- [ ] Aggiornare tutti i 17 agent per usare context
- [ ] Creare `src/agents/spec-zero/finalizer/summary.ts`

### Fase 6: Output Validation (1-2 ore)
- [ ] Creare `src/core/output-validator.ts`
- [ ] Integrare validazione in agent base
- [ ] Aggiungere auto-fix per problemi comuni

### Fase 7: Testing & Release (2 ore)
- [ ] Test su repo palantir
- [ ] Confronto con analisi manuale
- [ ] Release v1.0.0

---

## Timeline Stimata

| Fase | Ore Stimate | Priorità |
|------|-------------|----------|
| 1. Core Infrastructure | 2-3 | Critical |
| 2. DAG System | 2-3 | Critical |
| 3. Bootstrap Agent | 1-2 | High |
| 4. Prompt Refactoring | 3-4 | High |
| 5. Agent Refactoring | 4-5 | High |
| 6. Output Validation | 1-2 | Medium |
| 7. Testing & Release | 2 | Critical |

**Totale: 15-21 ore di lavoro**

---

## Metriche di Successo

1. **Output Quality**: Output deve contenere dati reali (nomi file, versioni, etc.)
2. **SPEC-OS Compliance**: 100% output con frontmatter valido
3. **Prompt Traceability**: Ogni output ha prompt_version
4. **Token Economy**: Riduzione 50% token usage tramite summaries
5. **Execution Speed**: Parallel execution dove possibile

---

## Prossimi Passi

1. Approvazione piano
2. Iniziare da Fase 1 (Core Infrastructure)
3. Commit incrementali per ogni fase
4. Test continuo su repo palantir

---

*Piano creato: 2026-01-16*
*Versione: 1.0*
