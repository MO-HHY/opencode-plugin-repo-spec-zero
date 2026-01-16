# SPEC-OS Plugin v2.1.0 - Piano di Upgrade

> **Data:** 2026-01-16
> **Versione Corrente:** 2.0.5
> **Versione Target:** 2.1.0
> **Obiettivo:** Strumento perfetto e completo per generare spec utilizzabili nello sviluppo

---

## Analisi Stato Attuale

| Aspetto | v2.0.5 | Obiettivo v2.1.0 |
|---------|--------|------------------|
| Struttura output | Flat (10 file) | Gerarchica modulare |
| Template | Nessuno | Template per tipo spec |
| Prompt | Hardcoded in agents | Libreria prompt esterna |
| Validazione | Basica | Schema JSON validation |
| Riutilizzabilita | Bassa | Alta (template replicabili) |
| Contesto sviluppo | Solo descrittivo | Actionable specs |

---

## 1. NUOVA STRUTTURA CARTELLE MODULARE

```
specs/
├── .meta/
│   ├── manifest.json           # Versioning, history
│   ├── config.json             # Plugin config
│   └── prompts.lock            # Hash prompt usati
│
├── _generated/                 # AUTO-GENERATED (plugin-managed)
│   ├── index.md                # Entry point con navigation
│   │
│   ├── 00-foundation/          # Layer 0: Base project info
│   │   ├── overview.md         # Executive summary
│   │   ├── architecture.md     # System design
│   │   └── stack.md            # Technology stack
│   │
│   ├── 01-domain/              # Layer 1: Domain model
│   │   ├── entities.md         # Core entities
│   │   ├── events.md           # Domain events
│   │   └── aggregates.md       # Aggregate roots
│   │
│   ├── 02-modules/             # Layer 2: Code modules
│   │   ├── index.md            # Module overview
│   │   ├── backend/
│   │   │   ├── handlers.md
│   │   │   └── services.md
│   │   ├── frontend/
│   │   │   ├── components.md
│   │   │   ├── state.md
│   │   │   └── hooks.md
│   │   └── shared/
│   │       └── types.md
│   │
│   ├── 03-api/                 # Layer 3: Contracts
│   │   ├── rest.md             # REST endpoints
│   │   ├── graphql.md          # GraphQL schema (if any)
│   │   ├── websocket.md        # Real-time (if any)
│   │   └── schemas/
│   │       ├── openapi.yaml    # Machine-readable
│   │       └── types.d.ts      # TypeScript types
│   │
│   ├── 04-data/                # Layer 4: Data layer
│   │   ├── database.md         # Schema & models
│   │   ├── storage.md          # File storage
│   │   ├── cache.md            # Caching strategy
│   │   └── schemas/
│   │       └── *.json.schema   # JSON Schemas
│   │
│   ├── 05-auth/                # Layer 5: Security
│   │   ├── authentication.md   # Auth flows
│   │   ├── authorization.md    # RBAC/policies
│   │   └── security.md         # Security analysis
│   │
│   ├── 06-integration/         # Layer 6: External
│   │   ├── services.md         # Third-party services
│   │   ├── dependencies.md     # Package deps
│   │   └── protocols.md        # Communication patterns
│   │
│   ├── 07-ops/                 # Layer 7: Operations
│   │   ├── deployment.md       # Infrastructure
│   │   ├── monitoring.md       # Observability
│   │   └── ci-cd.md            # Pipeline
│   │
│   └── _diagrams/              # Visual assets
│       ├── architecture.mmd    # Mermaid source
│       ├── data-flow.mmd
│       └── erd.mmd
│
├── _templates/                  # TEMPLATE LIBRARY
│   ├── README.md               # Come usare i template
│   ├── api/
│   │   ├── endpoint.md         # Template singolo endpoint
│   │   ├── resource.md         # Template CRUD resource
│   │   └── prompts.md          # Prompt per generare API spec
│   ├── ui/
│   │   ├── component.md        # Template componente UI
│   │   ├── page.md             # Template pagina
│   │   └── prompts.md
│   ├── auth/
│   │   ├── flow.md             # Template auth flow
│   │   └── prompts.md
│   ├── entity/
│   │   ├── model.md            # Template entity
│   │   └── prompts.md
│   ├── service/
│   │   ├── integration.md      # Template service integration
│   │   └── prompts.md
│   └── feature/
│       ├── spec.md             # Template feature spec
│       └── prompts.md
│
├── _audits/                    # Archived audits
│   └── YYYY-MM-DD_vX.X.X_audit.md
│
├── domains/                    # MANUAL SPECS (user-managed)
│   ├── README.md               # Guida creazione domain spec
│   └── .gitkeep
│
└── contracts/                  # CROSS-DOMAIN CONTRACTS
    ├── README.md
    └── .gitkeep
```

---

## 2. SISTEMA TEMPLATE

### 2.1 Template API Endpoint

**File:** `_templates/api/endpoint.md`

```markdown
---
uid: {{project}}:api:{{resource}}:{{action}}
title: "{{ACTION}} /{{path}}"
type: api-endpoint
version: 1.0.0
status: draft
created: {{date}}
edges:
  - [[{{project}}:entity:{{entity}}|operates_on]]
  - [[{{project}}:auth:{{auth_flow}}|requires]]
tags: [api, {{method}}, {{domain}}]
---

# {{ACTION}} /api/v1/{{path}}

## Overview
{{description}}

## Request

### Method & Path
\`\`\`http
{{METHOD}} /api/v1/{{path}}
\`\`\`

### Headers
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer {{auth_type}} token |
| Content-Type | {{has_body}} | application/json |

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
{{#each path_params}}
| {{name}} | {{type}} | {{required}} | {{description}} |
{{/each}}

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
{{#each query_params}}
| {{name}} | {{type}} | {{default}} | {{description}} |
{{/each}}

### Request Body
\`\`\`typescript
interface {{RequestType}} {
{{#each body_fields}}
  {{name}}: {{type}}; // {{description}}
{{/each}}
}
\`\`\`

**Example:**
\`\`\`json
{{request_example}}
\`\`\`

## Response

### Success ({{success_code}})
\`\`\`typescript
interface {{ResponseType}} {
{{#each response_fields}}
  {{name}}: {{type}}; // {{description}}
{{/each}}
}
\`\`\`

**Example:**
\`\`\`json
{{response_example}}
\`\`\`

### Error Responses
| Code | Description | When |
|------|-------------|------|
{{#each errors}}
| {{code}} | {{message}} | {{when}} |
{{/each}}

## Business Logic
{{#each logic_steps}}
1. {{step}}
{{/each}}

## Side Effects
{{#each side_effects}}
- {{effect}}
{{/each}}

## Authorization
- **Required Role:** {{required_role}}
- **Resource Check:** {{resource_check}}

## Usage Context (per sviluppo)

### Implementazione Backend
\`\`\`{{backend_lang}}
{{backend_snippet}}
\`\`\`

### Chiamata Frontend
\`\`\`typescript
{{frontend_snippet}}
\`\`\`

### Test Case
\`\`\`typescript
{{test_snippet}}
\`\`\`

## Related Specs
{{#each related}}
- [[{{link}}|{{relation}}]]
{{/each}}
```

---

### 2.2 Template UI Component

**File:** `_templates/ui/component.md`

```markdown
---
uid: {{project}}:ui:{{component_name}}
title: "{{ComponentName}} Component"
type: ui-component
version: 1.0.0
status: draft
created: {{date}}
edges:
  - [[{{project}}:api:{{api_used}}|calls]]
  - [[{{project}}:entity:{{entity}}|displays]]
tags: [ui, component, {{domain}}]
---

# {{ComponentName}}

## Overview
{{description}}

## Props Interface
\`\`\`typescript
interface {{ComponentName}}Props {
{{#each props}}
  /** {{description}} */
  {{name}}{{#if optional}}?{{/if}}: {{type}};
{{/each}}
}
\`\`\`

## State
\`\`\`typescript
interface {{ComponentName}}State {
{{#each state}}
  {{name}}: {{type}}; // {{description}}
{{/each}}
}
\`\`\`

## Hooks Used
{{#each hooks}}
- \`{{name}}\`: {{purpose}}
{{/each}}

## API Dependencies
| Endpoint | Method | Purpose |
|----------|--------|---------|
{{#each api_deps}}
| {{endpoint}} | {{method}} | {{purpose}} |
{{/each}}

## Visual Structure
\`\`\`
┌─────────────────────────────────────┐
│ {{ComponentName}}                    │
├─────────────────────────────────────┤
│ ┌─────────┐ ┌─────────────────────┐ │
│ │ {{child1}} │ │ {{child2}}           │ │
│ └─────────┘ └─────────────────────┘ │
└─────────────────────────────────────┘
\`\`\`

## Behavior
{{#each behaviors}}
### {{trigger}}
{{description}}
{{/each}}

## Implementation Context

### Component Skeleton
\`\`\`tsx
{{component_skeleton}}
\`\`\`

### Styling
\`\`\`css
{{styling_approach}}
\`\`\`

### Unit Test
\`\`\`typescript
{{test_skeleton}}
\`\`\`

## Accessibility
- **ARIA Role:** {{aria_role}}
- **Keyboard:** {{keyboard_support}}
- **Screen Reader:** {{sr_support}}

## Related
{{#each related}}
- [[{{link}}|{{relation}}]]
{{/each}}
```

---

### 2.3 Template Auth Flow

**File:** `_templates/auth/flow.md`

```markdown
---
uid: {{project}}:auth:{{flow_name}}
title: "{{FlowName}} Authentication"
type: auth-flow
version: 1.0.0
status: draft
created: {{date}}
edges:
  - [[{{project}}:api:auth|implemented_by]]
tags: [auth, security, {{flow_type}}]
---

# {{FlowName}} Authentication Flow

## Overview
{{description}}

## Flow Diagram
\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant A as Auth Server
    participant R as Resource Server
    
    {{mermaid_steps}}
\`\`\`

## Steps
{{#each steps}}
### Step {{index}}: {{name}}
- **Actor:** {{actor}}
- **Action:** {{action}}
- **Endpoint:** \`{{endpoint}}\`
- **Data:** {{data}}
{{/each}}

## Token Structure
\`\`\`typescript
interface {{TokenType}} {
  sub: string;           // User ID
  exp: number;           // Expiration
  iat: number;           // Issued at
{{#each claims}}
  {{name}}: {{type}};    // {{description}}
{{/each}}
}
\`\`\`

## Security Considerations
{{#each security}}
- **{{category}}:** {{measure}}
{{/each}}

## Error Scenarios
| Scenario | Response | Action |
|----------|----------|--------|
{{#each errors}}
| {{scenario}} | {{response}} | {{action}} |
{{/each}}

## Implementation Context

### Backend Handler
\`\`\`{{backend_lang}}
{{auth_handler}}
\`\`\`

### Frontend Auth Hook
\`\`\`typescript
{{auth_hook}}
\`\`\`

### Middleware
\`\`\`{{backend_lang}}
{{middleware}}
\`\`\`

## Configuration
\`\`\`yaml
{{config}}
\`\`\`
```

---

### 2.4 Template Entity/Model

**File:** `_templates/entity/model.md`

```markdown
---
uid: {{project}}:entity:{{entity_name}}
title: "{{EntityName}} Entity"
type: entity
version: 1.0.0
status: draft
created: {{date}}
edges:
  - [[{{project}}:data:{{table}}|stored_in]]
{{#each relations}}
  - [[{{project}}:entity:{{entity}}|{{type}}]]
{{/each}}
tags: [entity, domain, {{aggregate}}]
---

# {{EntityName}}

## Overview
{{description}}

## Domain Context
- **Aggregate:** {{aggregate_root}}
- **Bounded Context:** {{bounded_context}}
- **Invariants:** {{invariants}}

## Schema
\`\`\`typescript
interface {{EntityName}} {
  // Identity
  id: {{id_type}};
  
{{#each fields}}
  /** {{description}} */
  {{name}}: {{type}};
{{/each}}

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

## Database Mapping
\`\`\`sql
CREATE TABLE {{table_name}} (
  id {{db_id_type}} PRIMARY KEY,
{{#each db_fields}}
  {{column}} {{db_type}}{{#if nullable}}{{else}} NOT NULL{{/if}},
{{/each}}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

## Validation Rules
| Field | Rule | Message |
|-------|------|---------|
{{#each validations}}
| {{field}} | {{rule}} | {{message}} |
{{/each}}

## State Transitions
\`\`\`mermaid
stateDiagram-v2
{{state_diagram}}
\`\`\`

## Operations
### Create
- **Required:** {{create_required}}
- **Defaults:** {{create_defaults}}
- **Side Effects:** {{create_effects}}

### Update
- **Allowed Fields:** {{update_fields}}
- **Side Effects:** {{update_effects}}

### Delete
- **Soft Delete:** {{soft_delete}}
- **Cascade:** {{cascade}}

## Implementation Context

### Repository Interface
\`\`\`typescript
interface {{EntityName}}Repository {
  findById(id: string): Promise<{{EntityName}} | null>;
  findMany(filter: {{EntityName}}Filter): Promise<{{EntityName}}[]>;
  create(data: Create{{EntityName}}): Promise<{{EntityName}}>;
  update(id: string, data: Update{{EntityName}}): Promise<{{EntityName}}>;
  delete(id: string): Promise<void>;
}
\`\`\`

### Factory
\`\`\`typescript
{{factory_code}}
\`\`\`

## Related
{{#each related}}
- [[{{link}}|{{relation}}]]
{{/each}}
```

---

### 2.5 Template Feature Spec

**File:** `_templates/feature/spec.md`

```markdown
---
uid: {{project}}:feature:{{feature_slug}}
title: "{{FeatureName}}"
type: feature-spec
version: 1.0.0
status: draft
created: {{date}}
edges:
  - [[{{project}}:entity:{{entity}}|modifies]]
  - [[{{project}}:api:{{api}}|uses]]
  - [[{{project}}:ui:{{component}}|renders]]
tags: [feature, {{domain}}, {{priority}}]
---

# {{FeatureName}}

## Overview
{{description}}

## User Story
> As a **{{persona}}**
> I want to **{{action}}**
> So that **{{benefit}}**

## Acceptance Criteria
{{#each criteria}}
- [ ] {{criterion}}
{{/each}}

## Technical Scope

### Entities Involved
| Entity | Changes |
|--------|---------|
{{#each entities}}
| [[{{link}}]] | {{changes}} |
{{/each}}

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
{{#each endpoints}}
| {{method}} | {{path}} | {{purpose}} |
{{/each}}

### UI Components
| Component | Purpose |
|-----------|---------|
{{#each components}}
| [[{{link}}]] | {{purpose}} |
{{/each}}

## Data Flow
\`\`\`mermaid
flowchart LR
{{data_flow}}
\`\`\`

## Implementation Tasks

### Backend
{{#each backend_tasks}}
- [ ] {{task}}
{{/each}}

### Frontend
{{#each frontend_tasks}}
- [ ] {{task}}
{{/each}}

### Testing
{{#each test_tasks}}
- [ ] {{task}}
{{/each}}

## Edge Cases
{{#each edge_cases}}
### {{case}}
- **Input:** {{input}}
- **Expected:** {{expected}}
{{/each}}

## Dependencies
- **Blocks:** {{blocks}}
- **Blocked By:** {{blocked_by}}

## Rollout
- **Feature Flag:** \`{{flag_name}}\`
- **Gradual Rollout:** {{rollout_plan}}
```

---

## 3. LIBRERIA PROMPT RIUTILIZZABILI

### 3.1 Struttura Prompt Library

```
prompts/
├── README.md                   # Documentazione
├── _base/
│   ├── system.md              # System prompt base
│   ├── output-format.md       # Formato output standard
│   └── context-building.md    # Come costruire contesto
│
├── analysis/                   # Prompt per analisi
│   ├── overview.md            # Analisi overview progetto
│   ├── architecture.md        # Analisi architettura
│   ├── modules.md             # Analisi moduli
│   └── entities.md            # Analisi entita
│
├── api/
│   ├── detect-endpoints.md    # Rileva endpoints
│   ├── document-endpoint.md   # Documenta singolo endpoint
│   ├── generate-openapi.md    # Genera OpenAPI
│   └── audit-api.md           # Audit API esistente
│
├── ui/
│   ├── detect-components.md   # Rileva componenti
│   ├── document-component.md  # Documenta componente
│   ├── analyze-state.md       # Analizza state management
│   └── audit-ui.md            # Audit UI
│
├── auth/
│   ├── detect-auth.md         # Rileva pattern auth
│   ├── document-flow.md       # Documenta flow
│   ├── analyze-security.md    # Analisi sicurezza
│   └── audit-auth.md          # Audit auth
│
├── data/
│   ├── detect-schema.md       # Rileva schema DB
│   ├── document-model.md      # Documenta modello
│   ├── generate-erd.md        # Genera ERD
│   └── audit-data.md          # Audit data layer
│
├── feature/
│   ├── spec-from-task.md      # Spec da task description
│   ├── spec-from-code.md      # Spec da codice esistente
│   └── audit-feature.md       # Audit feature
│
└── integration/
    ├── detect-services.md     # Rileva servizi esterni
    ├── document-service.md    # Documenta integrazione
    └── audit-integration.md   # Audit integrazioni
```

---

### 3.2 Prompt: Analisi API Endpoints

**File:** `prompts/api/detect-endpoints.md`

```markdown
# API Endpoints Detection Prompt

## System Context
Sei un analista API esperto. Il tuo compito e identificare e documentare 
tutti gli endpoint API in un repository.

## Input Expected
- Struttura repository (tree)
- File di routing/handlers
- Middleware configuration

## Analysis Instructions

1. **Identifica i pattern di routing:**
   - Express.js: `app.get()`, `router.post()`, etc.
   - FastAPI: `@app.get()`, `@router.post()`, etc.
   - Serverless: handlers in serverless.yml/CDK
   - Next.js: files in `pages/api/` o `app/api/`

2. **Per ogni endpoint documenta:**
   - HTTP Method
   - Path (con parametri)
   - Handler function
   - Middleware applicati
   - Request schema (body, query, params)
   - Response schema
   - Status codes
   - Authentication required

3. **Identifica pattern comuni:**
   - CRUD operations
   - Nested resources
   - Query filtering
   - Pagination
   - Rate limiting

## Output Format
\`\`\`yaml
endpoints:
  - method: GET
    path: /api/v1/users/:id
    handler: getUser
    file: src/handlers/users.ts:45
    auth: required
    request:
      params:
        id: string (UUID)
    response:
      200:
        type: User
      404:
        type: Error
    middleware:
      - authMiddleware
      - rateLimiter
\`\`\`

## Quality Checks
- [ ] Tutti gli endpoint trovati
- [ ] Request/Response types identificati
- [ ] Auth requirements documentati
- [ ] Error responses inclusi
```

---

### 3.3 Prompt: Documenta Componente UI

**File:** `prompts/ui/document-component.md`

```markdown
# UI Component Documentation Prompt

## System Context
Sei un esperto React/Vue/Angular. Il tuo compito e creare documentazione
completa per un componente UI.

## Input Expected
- Codice sorgente del componente
- Stili associati
- Test esistenti (se presenti)
- Contesto di utilizzo

## Analysis Instructions

1. **Props Analysis:**
   - Identifica tutte le props
   - Documenta tipi e valori default
   - Identifica props required vs optional
   - Documenta callback props

2. **State Analysis:**
   - Identifica useState/state interno
   - Identifica state derivato
   - Identifica side effects (useEffect)

3. **Behavior Analysis:**
   - User interactions
   - Event handlers
   - Conditional rendering
   - Loading/error states

4. **Dependencies:**
   - Hooks esterni usati
   - API calls
   - Context consumed
   - Other components imported

5. **Accessibility:**
   - ARIA attributes
   - Keyboard navigation
   - Focus management
   - Screen reader support

## Output Template
[Usa template _templates/ui/component.md]

## Quality Checks
- [ ] Props completamente documentate
- [ ] State e effects documentati
- [ ] Comportamenti user-facing descritti
- [ ] Accessibility considerata
- [ ] Esempi d'uso inclusi
```

---

### 3.4 Prompt: Feature Spec da Task

**File:** `prompts/feature/spec-from-task.md`

```markdown
# Feature Spec from Task Description

## System Context
Sei un product engineer esperto. Converti una descrizione task in una 
spec tecnica completa e actionable.

## Input Expected
- Task description (testo o ClickUp task)
- Contesto codebase esistente
- Spec correlate esistenti

## Analysis Process

### Phase 1: Understanding
1. Estrai la user story implicita
2. Identifica acceptance criteria
3. Determina scope (cosa e IN e OUT)

### Phase 2: Technical Breakdown
1. Quali entities sono coinvolte?
2. Quali API endpoints servono?
3. Quali componenti UI servono?
4. Quale business logic serve?

### Phase 3: Implementation Planning
1. Identifica task backend
2. Identifica task frontend
3. Identifica dipendenze
4. Stima effort per task

### Phase 4: Edge Cases
1. Error scenarios
2. Empty states
3. Permission edge cases
4. Concurrent access

## Output Template
[Usa template _templates/feature/spec.md]

## Development Context Additions
Per ogni sezione, aggiungi:
- **Code pointers:** Link a file/funzioni esistenti rilevanti
- **Patterns da seguire:** Pattern gia usati nel codebase
- **Snippets starter:** Codice iniziale per implementazione

## Quality Checks
- [ ] User story chiara e completa
- [ ] Acceptance criteria testabili
- [ ] Scope ben definito
- [ ] Task breakdown granulare
- [ ] Edge cases considerati
- [ ] Development context incluso
```

---

## 4. AGGIORNAMENTI PLUGIN v2.1.0

### 4.1 Nuovi Agent Specializzati

```typescript
// agents/spec-zero/templates/
├── template-selector.agent.ts   // Seleziona template appropriato
├── template-filler.agent.ts     // Riempie template con dati
└── context-enricher.agent.ts    // Arricchisce spec con contesto dev

// agents/spec-zero/output/
├── structure-builder.agent.ts   // Costruisce struttura cartelle
├── diagram-generator.agent.ts   // Genera diagrammi Mermaid
└── schema-extractor.agent.ts    // Estrae JSON/OpenAPI schemas
```

### 4.2 Nuovo DAG con Layers

```typescript
const GENERATION_DAG_V2: DAGDefinition = {
    version: '2.1.0',
    layers: [
        {
            name: 'foundation',
            agents: ['submodule_check', 'bootstrap', 'overview'],
            output_dir: '_generated/00-foundation/'
        },
        {
            name: 'domain',
            agents: ['entity', 'event', 'aggregate'],
            output_dir: '_generated/01-domain/',
            parallel: true
        },
        {
            name: 'modules',
            agents: ['module_backend', 'module_frontend', 'module_shared'],
            output_dir: '_generated/02-modules/',
            parallel: true
        },
        {
            name: 'contracts',
            agents: ['api_rest', 'api_graphql', 'api_websocket'],
            output_dir: '_generated/03-api/',
            parallel: true
        },
        {
            name: 'data',
            agents: ['database', 'storage', 'cache'],
            output_dir: '_generated/04-data/',
            parallel: true
        },
        {
            name: 'security',
            agents: ['auth', 'authz', 'security_audit'],
            output_dir: '_generated/05-auth/',
            parallel: true
        },
        {
            name: 'integration',
            agents: ['services', 'dependencies', 'protocols'],
            output_dir: '_generated/06-integration/',
            parallel: true
        },
        {
            name: 'ops',
            agents: ['deployment', 'monitoring', 'cicd'],
            output_dir: '_generated/07-ops/',
            parallel: true
        },
        {
            name: 'finalize',
            agents: ['diagram_generator', 'schema_extractor', 'index_builder'],
            output_dir: '_generated/'
        },
        {
            name: 'commit',
            agents: ['write_specs', 'commit_push']
        }
    ]
};
```

### 4.3 Nuovi Comandi CLI

```bash
# Template management
spec-zero template list                    # Lista template disponibili
spec-zero template use <type> [--output]   # Genera spec da template
spec-zero template create <type>           # Crea nuovo template

# Single spec generation
spec-zero gen:api <endpoint-path>          # Documenta singolo endpoint
spec-zero gen:component <component-path>   # Documenta componente
spec-zero gen:entity <entity-path>         # Documenta entity
spec-zero gen:feature <description>        # Genera feature spec

# Validation
spec-zero validate                         # Valida tutte le spec
spec-zero validate <file>                  # Valida singola spec

# Context enrichment
spec-zero enrich <spec-file>               # Aggiunge contesto sviluppo
```

### 4.4 Configuration Estesa

```json
// .specrc.json
{
  "version": "2.1.0",
  "project": {
    "name": "my-project",
    "type": "backend"
  },
  "output": {
    "structure": "hierarchical",
    "diagrams": "mermaid",
    "schemas": true
  },
  "templates": {
    "customPath": "./my-templates",
    "overrides": {
      "api/endpoint": "./custom-api-template.md"
    }
  },
  "prompts": {
    "customPath": "./my-prompts"
  },
  "development": {
    "includeSnippets": true,
    "includePointers": true,
    "testExamples": true
  },
  "agents": {
    "skip": ["ml", "prompt_security"],
    "custom": [
      {
        "id": "my_custom_agent",
        "prompt": "./prompts/custom.md",
        "outputFile": "custom-analysis.md",
        "dependencies": ["overview"]
      }
    ]
  }
}
```

---

## 5. ROADMAP IMPLEMENTAZIONE

### Fase 1: Struttura (1-2 giorni)
- [ ] Implementare nuovo output structure builder
- [ ] Creare cartelle gerarchiche per output
- [ ] Aggiornare write_specs.agent.ts

### Fase 2: Template System (2-3 giorni)
- [ ] Creare tutti i template base (API, UI, Auth, Entity, Feature)
- [ ] Implementare template loader
- [ ] Implementare template filler con variabili

### Fase 3: Prompt Library (2-3 giorni)
- [ ] Creare tutti i prompt markdown
- [ ] Implementare prompt versioning
- [ ] Collegare prompt agli agent

### Fase 4: Development Context (1-2 giorni)
- [ ] Implementare context enricher
- [ ] Aggiungere code snippets ai template
- [ ] Aggiungere file pointers

### Fase 5: CLI & Validation (1-2 giorni)
- [ ] Nuovi comandi CLI
- [ ] Schema validation
- [ ] Dry-run mode

### Fase 6: Testing & Docs (1 giorno)
- [ ] Test su repository campione
- [ ] Documentazione utente
- [ ] Release v2.1.0

---

## 6. BENEFICI ATTESI

| Area | Prima (v2.0.5) | Dopo (v2.1.0) |
|------|----------------|---------------|
| **Navigazione** | File flat, ricerca manuale | Struttura gerarchica logica |
| **Riuso** | Copia/incolla manuale | Template parametrizzati |
| **Sviluppo** | Solo descrittivo | Code snippets + pointers |
| **Validazione** | Nessuna | JSON Schema validation |
| **Estensibilita** | Modifica codice | Config + custom templates |
| **Manutenzione** | Aggiornamento manuale | Audit automatico |

---

## 7. NEXT STEPS

1. **Approvazione piano** - Review e feedback
2. **Prioritizzazione** - Decidere ordine fasi
3. **Implementazione** - Sviluppo iterativo
4. **Testing** - Validazione su progetti reali
5. **Release** - Pubblicazione v2.1.0
