# SPEC-OS Plugin v2.1.0 - Sprint Tracker

> **Creato:** 2026-01-16
> **Versione Target:** 2.1.0
> **Stato:** 🟢 SPRINT 1-6 COMPLETATI | 🟢 UPGRADE v2.1.0 READY
> **Architect:** AI Dev Swarm

---

## 📊 Overview Progetto

| Metrica | Valore |
|---------|--------|
| Sprint Totali | 6 |
| Effort Stimato | ~127h |
| Durata Stimata | 12-15 giorni |
| Priorità Corrente | Sprint 6 |
| Task Atomiche S1+S2+S3 | 44 subtask |
| Task Atomiche S4 | 17 subtask |
| Task Atomiche S5 | 17 subtask |
| Task Atomiche S6 | 17 subtask |

---

## 🎯 Obiettivo v2.1.0

Trasformare il plugin SPEC-OS da **output flat/descrittivo** a **sistema modulare con spec actionable per lo sviluppo**.

### Cambiamenti Architetturali

| Componente | v2.0.5 (Attuale) | v2.1.0 (Target) |
|------------|------------------|-----------------|
| Output | 10 file flat | Struttura gerarchica 8 layer |
| Agenti | Hardcoded/specializzati | Generici guidati da prompt |
| Prompt | Embedded nel codice | Libreria esterna versionata |
| Template | Nessuno | Sistema Handlebars-like |
| DAG | Statico | Smart Planner dinamico |
| Diagrammi | Solo inline | Inline + standalone `.mmd` |

---

## 📋 SPRINT 1: Foundation (DETTAGLIO ATOMICO)

**Status:** 🟡 IN PROGRESS
**Goal:** Struttura output gerarchica + meta management
**Effort Totale:** ~16h
**Dipendenze:** Nessuna

### Grafo Dipendenze Sprint 1

```
S1-T1.1 ──┬──► S1-T1.2 ──► S1-T1.3 ──┐
          │                          │
S1-T2.1 ──┼──► S1-T2.2 ──► S1-T2.3   │
          │                          │
S1-T4.1 ──┼──────────────────────────┼──► S1-T4.2 ──► S1-T4.3
          │                          │         │
          └──────────────────────────┼─────────┤
                                     │         │
                                     ▼         ▼
                              S1-T3.1 ──► S1-T3.2 ──► S1-T3.3 ──► S1-T3.4
                                                            │
                                                            ▼
                                                      S1-T4.4 (test)
```

---

### S1-T1: Struttura Cartelle `specs/_generated/00-07`

#### S1-T1.1: Definire costanti struttura cartelle

| Campo | Valore |
|-------|--------|
| **ID** | S1-T1.1 |
| **Titolo** | Aggiungere costanti GENERATED_SUBDIRS in types.ts |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | - |
| **Status** | ✅ completed |

**File:** `src/types.ts`

**Descrizione:**
Aggiungere le costanti per la nuova struttura gerarchica delle cartelle:
```typescript
export const GENERATED_SUBDIRS = {
  FOUNDATION: '00-foundation',
  DOMAIN: '01-domain',
  MODULES: '02-modules',
  API: '03-api',
  DATA: '04-data',
  AUTH: '05-auth',
  INTEGRATION: '06-integration',
  OPS: '07-ops',
  DIAGRAMS: '_diagrams',
} as const;

export const AGENT_TO_SUBDIR_MAP: Record<string, keyof typeof GENERATED_SUBDIRS> = {
  'overview': 'FOUNDATION',
  'module': 'MODULES',
  'entity': 'DOMAIN',
  // ...mapping completo per tutti i 17 agent
};
```

**Acceptance Criteria:**
- [ ] `GENERATED_SUBDIRS` esportato da `types.ts`
- [ ] `AGENT_TO_SUBDIR_MAP` mappa tutti i 17 agent esistenti
- [ ] TypeScript compila senza errori
- [ ] Test esistenti passano

---

#### S1-T1.2: Estendere SubmoduleManager per creare subdirectory

| Campo | Valore |
|-------|--------|
| **ID** | S1-T1.2 |
| **Titolo** | Aggiungere metodo `initializeGeneratedStructure()` |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S1-T1.1 |
| **Status** | ✅ completed |

**File:** `src/skills/submodule-manager.skill.ts`

**Descrizione:**
Nuovo metodo che crea la struttura completa delle sottocartelle in `_generated/`:
```typescript
async initializeGeneratedStructure(specsPath: string): Promise<void> {
    const generatedPath = path.join(specsPath, SPECS_FOLDER_STRUCTURE.GENERATED);
    
    for (const subdir of Object.values(GENERATED_SUBDIRS)) {
        const fullPath = path.join(generatedPath, subdir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            fs.writeFileSync(path.join(fullPath, '.gitkeep'), '');
        }
    }
}
```

**Acceptance Criteria:**
- [ ] Metodo `initializeGeneratedStructure()` crea tutte le 9 sottocartelle
- [ ] Ogni sottocartella contiene `.gitkeep`
- [ ] Idempotente (può essere chiamato più volte senza errori)

---

#### S1-T1.3: Creare struttura `02-modules/backend|frontend`

| Campo | Valore |
|-------|--------|
| **ID** | S1-T1.3 |
| **Titolo** | Supporto sotto-struttura dinamica per modules |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S1-T1.2 |
| **Status** | ✅ completed |

**File:** `src/skills/submodule-manager.skill.ts`

**Descrizione:**
Estendere `initializeGeneratedStructure()` per creare sottocartelle condizionali basate su `repoType`.

**Acceptance Criteria:**
- [ ] Per `repoType: 'fullstack'` → crea `backend/` e `frontend/`
- [ ] Per `repoType: 'backend'` → nessuna sottocartella extra
- [ ] Per `repoType: 'monorepo'` → crea entrambe

---

### S1-T2: Manifest Schema v2.1

#### S1-T2.1: Estendere interfaccia `SpecsManifest`

| Campo | Valore |
|-------|--------|
| **ID** | S1-T2.1 |
| **Titolo** | Aggiungere campi folder_version e structure_hash |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | - |
| **Status** | ✅ completed |

**File:** `src/types.ts`

**Descrizione:**
Estendere `SpecsManifest` con:
```typescript
export interface SpecsManifest {
    schema_version: '2.0' | '2.1';
    // ... campi esistenti ...
    folder_structure_version?: '1.0' | '2.0';
    structure_hash?: string;
    file_locations?: Record<string, string>;
}
```

**Acceptance Criteria:**
- [ ] Tipo `SpecsManifest` accetta schema_version '2.0' e '2.1'
- [ ] Nuovi campi sono opzionali (backward compatible)
- [ ] JSDoc presente per ogni campo

---

#### S1-T2.2: Implementare funzione di migrazione manifest

| Campo | Valore |
|-------|--------|
| **ID** | S1-T2.2 |
| **Titolo** | Creare `migrateManifest()` utility function |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S1-T2.1 |
| **Status** | ✅ completed |

**File da creare:** `src/core/manifest-migrator.ts`

**Descrizione:**
Funzione che migra manifest v2.0 → v2.1, popolando i nuovi campi.

**Acceptance Criteria:**
- [ ] `migrateManifest()` trasforma v2.0 → v2.1
- [ ] Funzione è idempotente
- [ ] `needsMigration()` rileva correttamente manifest v2.0
- [ ] Structure hash è deterministico

---

#### S1-T2.3: Integrare migrazione in SubmoduleManager.readManifest()

| Campo | Valore |
|-------|--------|
| **ID** | S1-T2.3 |
| **Titolo** | Auto-migrate manifest on read |
| **Tipo** | enhancement |
| **Effort** | 45min |
| **Agent** | coder-backend |
| **Dipendenze** | S1-T2.2 |
| **Status** | ✅ completed |

**File:** `src/skills/submodule-manager.skill.ts`

**Acceptance Criteria:**
- [ ] Manifest v2.0 viene migrato automaticamente alla lettura
- [ ] Log indica quando avviene migrazione
- [ ] Manifest migrato viene persistito su disco

---

### S1-T3: Aggiornare `write-specs.agent.ts`

#### S1-T3.1: Refactoring AGENT_TO_FILE_MAP con paths gerarchici

| Campo | Valore |
|-------|--------|
| **ID** | S1-T3.1 |
| **Titolo** | Aggiornare mapping agent → file con path completi |
| **Tipo** | refactor |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S1-T1.1 |
| **Status** | ✅ completed |

**File:** `src/agents/spec-zero/finalizer/write-specs.agent.ts`

**Descrizione:**
Aggiornare `AGENT_TO_FILE_MAP` per usare path completi:
```typescript
const AGENT_TO_FILE_MAP: Record<string, string> = {
    'overview': `${GENERATED_SUBDIRS.FOUNDATION}/overview.md`,
    'entity': `${GENERATED_SUBDIRS.DOMAIN}/entities.md`,
    'module': `${GENERATED_SUBDIRS.MODULES}/index.md`,
    'api': `${GENERATED_SUBDIRS.API}/endpoints.md`,
    // ...tutti mappati
};
```

**Acceptance Criteria:**
- [ ] Tutti i 17 agent mappati a path gerarchici
- [ ] Usa costanti da `GENERATED_SUBDIRS`
- [ ] TypeScript compila senza errori

---

#### S1-T3.2: Aggiornare writeSpec() per supportare subdirectory

| Campo | Valore |
|-------|--------|
| **ID** | S1-T3.2 |
| **Titolo** | Modificare logica di scrittura file con mkdir ricorsivo |
| **Tipo** | enhancement |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S1-T3.1 |
| **Status** | ✅ completed |

**File:** `src/skills/submodule-manager.skill.ts`

**Acceptance Criteria:**
- [ ] `writeSpec('00-foundation/overview.md', content)` crea directory se non esiste
- [ ] Path annidati funzionano
- [ ] Nessuna regressione per path flat

---

#### S1-T3.3: Aggiornare generateIndex() per nuova struttura

| Campo | Valore |
|-------|--------|
| **ID** | S1-T3.3 |
| **Titolo** | Riorganizzare tabella index.md con sezioni gerarchiche |
| **Tipo** | enhancement |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S1-T3.1 |
| **Status** | ✅ completed |

**File:** `src/agents/spec-zero/finalizer/write-specs.agent.ts`

**Acceptance Criteria:**
- [ ] index.md generato mostra sezioni raggruppate per cartella
- [ ] Link relativi puntano a `_generated/00-foundation/overview.md`
- [ ] Sezioni vuote non appaiono

---

#### S1-T3.4: Aggiornare filesWritten tracking

| Campo | Valore |
|-------|--------|
| **ID** | S1-T3.4 |
| **Titolo** | Tracking file path completi nel result |
| **Tipo** | enhancement |
| **Effort** | 30min |
| **Agent** | coder-backend |
| **Dipendenze** | S1-T3.2 |
| **Status** | ✅ completed |

**File:** `src/agents/spec-zero/finalizer/write-specs.agent.ts`

**Acceptance Criteria:**
- [ ] `filesWritten` contiene path come `00-foundation/overview.md`
- [ ] Summary mostra path gerarchici

---

### S1-T4: Implementare `structure-builder.agent.ts`

#### S1-T4.1: Creare file agent scaffolding

| Campo | Valore |
|-------|--------|
| **ID** | S1-T4.1 |
| **Titolo** | Creare structure-builder.agent.ts base |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | - |
| **Status** | ✅ completed |

**File da creare:** `src/agents/spec-zero/finalizer/structure-builder.agent.ts`

**Acceptance Criteria:**
- [ ] File compila senza errori TypeScript
- [ ] Estende `SubAgent` correttamente
- [ ] ID univoco `structure_builder`

---

#### S1-T4.2: Implementare process() logic

| Campo | Valore |
|-------|--------|
| **ID** | S1-T4.2 |
| **Titolo** | Implementare logica process() per creazione cartelle |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S1-T4.1, S1-T1.2 |
| **Status** | ✅ completed |

**File:** `src/agents/spec-zero/finalizer/structure-builder.agent.ts`

**Acceptance Criteria:**
- [ ] Crea struttura completa `_generated/00-07`
- [ ] Crea `_templates/` con `.gitkeep`
- [ ] Rispetta `repoType` per sottocartelle modules
- [ ] Skip silenzioso in audit mode

---

#### S1-T4.3: Registrare agent nel DAG

| Campo | Valore |
|-------|--------|
| **ID** | S1-T4.3 |
| **Titolo** | Aggiungere StructureBuilder al DAG tra summary e write_specs |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S1-T4.2 |
| **Status** | ✅ completed |

**File:** `src/core/dag-executor.ts`, `src/agents/core/orchestrator.agent.ts`

**Acceptance Criteria:**
- [ ] `structure_builder` eseguito dopo `summary`
- [ ] `write_specs` dipende da `structure_builder`
- [ ] DAG validation passa

---

#### S1-T4.4: Scrivere unit test per StructureBuilderAgent

| Campo | Valore |
|-------|--------|
| **ID** | S1-T4.4 |
| **Titolo** | Unit test per structure-builder.agent |
| **Tipo** | test |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S1-T4.2 |
| **Status** | ✅ completed |

**File da creare:** `src/agents/spec-zero/finalizer/structure-builder.agent.test.ts`

**Acceptance Criteria:**
- [ ] Almeno 6 test cases
- [ ] Coverage > 80% per il file agent
- [ ] Test passano in CI

---

### Riepilogo Sprint 1

| Task ID | Titolo | Effort | Parallelizzabile |
|---------|--------|--------|------------------|
| S1-T1.1 | Costanti GENERATED_SUBDIRS | 1h | ✅ |
| S1-T1.2 | initializeGeneratedStructure() | 1.5h | - |
| S1-T1.3 | Sotto-struttura modules dinamica | 1h | - |
| S1-T2.1 | Estensione SpecsManifest v2.1 | 1h | ✅ |
| S1-T2.2 | migrateManifest() utility | 2h | - |
| S1-T2.3 | Auto-migrate on read | 45min | - |
| S1-T3.1 | AGENT_TO_FILE_MAP gerarchico | 1h | - |
| S1-T3.2 | writeSpec() con subdirectory | 1h | - |
| S1-T3.3 | generateIndex() aggiornato | 1.5h | - |
| S1-T3.4 | filesWritten tracking | 30min | - |
| S1-T4.1 | StructureBuilder scaffolding | 1h | ✅ |
| S1-T4.2 | process() implementation | 1.5h | - |
| S1-T4.3 | DAG registration | 1h | - |
| S1-T4.4 | Unit tests | 1.5h | ✅ (dopo S1-T4.2) |

**Effort Totale Sprint 1:** ~16.25h
**Path Critico:** S1-T1.1 → S1-T1.2 → S1-T4.2 → S1-T4.3 → S1-T3.3

---

## 📋 SPRINT 2: Prompt Registry & Router (DETTAGLIO ATOMICO)

**Status:** 🟡 IN PROGRESS
**Goal:** Sistema prompt esterno con routing intelligente
**Effort Totale:** ~18h
**Dipendenze:** Nessuna (parallelo a Sprint 1)

### Grafo Dipendenze Sprint 2

```
S2-T1.1 (tipi) ──────────────────┬──────────────────────────────────────────────┐
                                 │                                              │
                                 ▼                                              │
S2-T1.2 (PromptRegistry) ────────┼──────────────────────────────────────────────┤
                                 │                                              │
S2-T2.1 (_registry.json) ◄───────┘                                              │
                                                                                │
S2-T3.1 (tipi Router) ◄─────────────────────────────────────────────────────────┘
         │
         ▼
S2-T3.2 (PromptRouter core) ◄── S2-T1.2
         │
         ▼
S2-T3.3 (composizione)

S2-T4.1 (_base/system.md) ────────┬─────────────────────┐
                                  │                     │
S2-T4.2 (_base/output-format.md) ─┼─────────────────────┤
                                  │                     │
                                  ▼                     ▼
                          S2-T5.1 (overview)    S2-T5.2 (architecture)
                                  │                     │
                                  ▼                     ▼
                          S2-T5.3 (modules)     S2-T5.4 (entities)
```

---

### S2-T1: PromptRegistry Class

#### S2-T1.1: Definire Tipi PromptRegistry

| Campo | Valore |
|-------|--------|
| **ID** | S2-T1.1 |
| **Titolo** | Aggiungere tipi PromptDefinition e LoadedPrompt a types.ts |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | - |
| **Status** | ✅ completed |

**File:** `src/types.ts`

**Descrizione:**
Aggiungere le interfacce necessarie per il sistema PromptRegistry v2.1.0:
```typescript
export type PromptCategory = 'analysis' | 'document' | 'audit' | 'diagram' | 'template';

export type DiagramType = 'sequence' | 'flowchart' | 'erd' | 'classDiagram' | 
                          'stateDiagram' | 'c4' | 'gantt' | 'pie';

export interface PromptDefinition {
    id: string;                    // "category/name"
    category: PromptCategory;
    applicableTo: RepoType[];
    requiredFeatures?: string[];
    dependsOn: string[];
    produces: string[];
    templateId?: string;
    diagrams: DiagramType[];
    outputFile: string;
    priority: number;
    optional: boolean;
}
```

**Acceptance Criteria:**
- [ ] `PromptCategory` definito con 5 valori
- [ ] `DiagramType` definito con 8 valori
- [ ] `RepoType` esteso con 'cli' e 'unknown'
- [ ] `PromptDefinition` con tutti i campi da ARCHITECTURE_v2.1.0
- [ ] Export corretto di tutti i nuovi tipi

---

#### S2-T1.2: Implementare PromptRegistry Class

| Campo | Valore |
|-------|--------|
| **ID** | S2-T1.2 |
| **Titolo** | Creare src/core/prompt-registry.ts con classe PromptRegistry |
| **Tipo** | feature |
| **Effort** | 2.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S2-T1.1 |
| **Status** | ✅ completed |

**File da creare:** `src/core/prompt-registry.ts`

**Descrizione:**
Classe `PromptRegistry` che:
1. Carica definizioni da `prompts/_registry.json`
2. Implementa `findApplicable(repoType, features, completed)`
3. Implementa `load(promptId)` con versioning e hash
4. Gestisce cache in memoria

**Acceptance Criteria:**
- [ ] Constructor carica da `prompts/_registry.json` se esiste
- [ ] `findApplicable()` filtra per repoType, features, dipendenze completate
- [ ] `findApplicable()` ordina per priority decrescente
- [ ] `load()` estrae versione da `<!-- version=X -->`
- [ ] `load()` calcola hash MD5 (8 char)
- [ ] Cache evita riletture filesystem

---

### S2-T2: Registry JSON

#### S2-T2.1: Creare prompts/_registry.json

| Campo | Valore |
|-------|--------|
| **ID** | S2-T2.1 |
| **Titolo** | Creare file _registry.json con definizioni prompt v2.1.0 |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S2-T1.1 |
| **Status** | ✅ completed |

**File da creare:** `prompts/_registry.json`

**Acceptance Criteria:**
- [ ] Schema valido JSON
- [ ] Almeno 18 definizioni prompt
- [ ] Tutti i prompt hanno id nel formato "category/name"
- [ ] Dipendenze formano grafo aciclico (DAG valido)
- [ ] Ogni prompt ha priority numerica

---

### S2-T3: PromptRouter Class

#### S2-T3.1: Definire Interfacce PromptRouter

| Campo | Valore |
|-------|--------|
| **ID** | S2-T3.1 |
| **Titolo** | Aggiungere tipi RoutingContext, RoutedPrompt, DiagramInstruction |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S2-T1.1 |
| **Status** | ✅ completed |

**File:** `src/types.ts`

**Acceptance Criteria:**
- [ ] `RoutingContext` con: repoType, detectedFeatures, completedAgents, previousOutputs, currentAgentId
- [ ] `RoutedPrompt` con: systemPrompt, analysisPrompt, outputSchema, diagramInstructions, templateId, metadata
- [ ] `DiagramInstruction` con: type, description, outputFile, inline

---

#### S2-T3.2: Implementare PromptRouter Core

| Campo | Valore |
|-------|--------|
| **ID** | S2-T3.2 |
| **Titolo** | Creare src/core/prompt-router.ts con logica di routing |
| **Tipo** | feature |
| **Effort** | 3h |
| **Agent** | coder-backend |
| **Dipendenze** | S2-T1.2, S2-T3.1 |
| **Status** | ✅ completed |

**File da creare:** `src/core/prompt-router.ts`

**Acceptance Criteria:**
- [ ] `route()` ritorna RoutedPrompt completo
- [ ] `selectPrompt()` filtra per currentAgentId match su produces
- [ ] System prompt caricato da `_base/system.md` con fallback
- [ ] Output schema caricato da `_base/output-format.md` con fallback
- [ ] Metadata include promptId, version, hash

---

#### S2-T3.3: Implementare Composizione Prompt

| Campo | Valore |
|-------|--------|
| **ID** | S2-T3.3 |
| **Titolo** | Aggiungere metodi di composizione prompt con template diagrammi |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S2-T3.2 |
| **Status** | ✅ completed |

**File:** `src/core/prompt-router.ts`

**Acceptance Criteria:**
- [ ] System prompt include repo type e ruolo analista
- [ ] Analysis prompt combina contesto + specifico + istruzioni diagrammi
- [ ] Template Mermaid per tutti gli 8 DiagramType

---

### S2-T4: Prompt Base

#### S2-T4.1: Creare prompts/_base/system.md

| Campo | Valore |
|-------|--------|
| **ID** | S2-T4.1 |
| **Titolo** | Creare prompt system base per v2.1.0 |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | - |
| **Status** | ✅ completed |

**File da creare:** `prompts/_base/system.md`

**Acceptance Criteria:**
- [ ] File creato in `prompts/_base/system.md`
- [ ] Header `<!-- version=1 -->` presente
- [ ] Sezione ruolo analista
- [ ] Sezione evidence requirements con formato citazioni
- [ ] Almeno 50 righe di contenuto

---

#### S2-T4.2: Creare prompts/_base/output-format.md

| Campo | Valore |
|-------|--------|
| **ID** | S2-T4.2 |
| **Titolo** | Creare prompt output format SPEC-OS |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | - |
| **Status** | ✅ completed |

**File da creare:** `prompts/_base/output-format.md`

**Acceptance Criteria:**
- [ ] File creato in `prompts/_base/output-format.md`
- [ ] Header `<!-- version=1 -->` presente
- [ ] Esempio YAML frontmatter completo
- [ ] Esempio edge syntax `[[uid|edge_type]]`
- [ ] Almeno 60 righe di contenuto

---

### S2-T5: Prompt Analysis

#### S2-T5.1: Creare prompts/analysis/overview.md

| Campo | Valore |
|-------|--------|
| **ID** | S2-T5.1 |
| **Titolo** | Migrare e migliorare prompt overview per v2.1.0 |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S2-T4.1, S2-T4.2 |
| **Status** | ✅ completed |

**File da creare:** `prompts/analysis/overview.md`

**Acceptance Criteria:**
- [ ] File creato con header `<!-- version=1 -->`
- [ ] Sezioni: Executive Summary, Repository ID, Tech Stack, Architecture Pattern
- [ ] Istruzioni per diagrammi C4 e flowchart
- [ ] Almeno 80 righe

---

#### S2-T5.2: Creare prompts/analysis/architecture.md

| Campo | Valore |
|-------|--------|
| **ID** | S2-T5.2 |
| **Titolo** | Creare prompt architecture analysis |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S2-T4.1, S2-T4.2 |
| **Status** | ✅ completed |

**File da creare:** `prompts/analysis/architecture.md`

**Acceptance Criteria:**
- [ ] File creato con header `<!-- version=1 -->`
- [ ] Pattern identification con evidence
- [ ] Layer analysis
- [ ] Istruzioni per C4 diagrams
- [ ] Almeno 70 righe

---

#### S2-T5.3: Creare prompts/analysis/modules.md

| Campo | Valore |
|-------|--------|
| **ID** | S2-T5.3 |
| **Titolo** | Creare prompt module deep dive |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S2-T4.1, S2-T4.2 |
| **Status** | ✅ completed |

**File da creare:** `prompts/analysis/modules.md`

**Acceptance Criteria:**
- [ ] File creato con header `<!-- version=1 -->`
- [ ] Template tabella moduli
- [ ] Istruzioni dependency graph Mermaid
- [ ] Almeno 70 righe

---

#### S2-T5.4: Creare prompts/analysis/entities.md

| Campo | Valore |
|-------|--------|
| **ID** | S2-T5.4 |
| **Titolo** | Creare prompt core entities analysis |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S2-T4.1, S2-T4.2 |
| **Status** | ✅ completed |

**File da creare:** `prompts/analysis/entities.md`

**Acceptance Criteria:**
- [ ] File creato con header `<!-- version=1 -->`
- [ ] Template tabella entità
- [ ] Istruzioni ER diagram
- [ ] Istruzioni class diagram
- [ ] Almeno 80 righe

---

### Riepilogo Sprint 2

| Task ID | Titolo | Effort | Parallelizzabile |
|---------|--------|--------|------------------|
| S2-T1.1 | Tipi PromptRegistry | 1.5h | ✅ |
| S2-T1.2 | PromptRegistry class | 2.5h | - |
| S2-T2.1 | _registry.json | 2h | - |
| S2-T3.1 | Tipi Router | 1h | ✅ |
| S2-T3.2 | PromptRouter core | 3h | - |
| S2-T3.3 | Composizione prompt | 2h | - |
| S2-T4.1 | _base/system.md | 1h | ✅ |
| S2-T4.2 | _base/output-format.md | 1h | ✅ |
| S2-T5.1 | analysis/overview.md | 1h | - |
| S2-T5.2 | analysis/architecture.md | 1h | ✅ |
| S2-T5.3 | analysis/modules.md | 1h | ✅ |
| S2-T5.4 | analysis/entities.md | 1h | ✅ |

**Effort Totale Sprint 2:** ~18h
**Con Parallelizzazione:** ~8h

### Waves di Esecuzione Parallela (Sprint 2)

| Wave | Tasks | Effort |
|------|-------|--------|
| 1 | S2-T1.1, S2-T4.1, S2-T4.2 | 1.5h |
| 2 | S2-T1.2, S2-T3.1, S2-T2.1 | 3h |
| 3 | S2-T3.2, S2-T5.1, S2-T5.2 | 3h |
| 4 | S2-T3.3, S2-T5.3, S2-T5.4 | 2h |

---

## 📋 SPRINT 3: Feature Detector + Smart DAG (DETTAGLIO ATOMICO)

**Status:** 🟢 COMPLETATO
**Goal:** Sistema di rilevamento feature + pianificazione DAG dinamica
**Effort Totale:** ~23h (effettivo ~12h con parallelizzazione)
**Dipendenze:** Sprint 2 (PromptRegistry)

### Grafo Dipendenze Sprint 3

```
S3-T1.1 (tipi Feature) ────────────────────────────────────────────────────┐
         │                                                                  │
         ▼                                                                  │
S3-T1.2 (FeatureDetector scaffolding)                                      │
         │                                                                  │
         ├──► S3-T1.3 (detectFromPackageFiles) ──┐                         │
         │                                        │                         │
         ├──► S3-T1.4 (detectStructure) ─────────┼──► S3-T1.7 (detect)     │
         │                                        │         │               │
         ├──► S3-T1.5 (detectLanguages) ─────────┤         │               │
         │                                        │         │               │
         └──► S3-T1.6 (detectPatterns) ──────────┘         │               │
                                                            │               │
S3-T2.1 (tipi DAG) ◄────────────────────────────────────────┼───────────────┘
         │                                                  │
         ▼                                                  │
S3-T2.2 (SmartDAGPlanner scaffolding) ◄─────────────────────┘
         │
         ├──► S3-T2.3 (selectAgents L0-L4) ──┐
         │                                    │
         ├──► S3-T2.4 (selectAgents L5-L8) ──┼──► S3-T2.6 (buildLayers)
         │                                    │         │
         └──► S3-T2.5 (selectAgents L9-L12) ─┘         │
                                                        │
                                                        ▼
                                              S3-T2.7 (assignPrompts)
                                                        │
                                                        ▼
S3-T3.1 (skip logic) ◄──────────────────────────────────┤
         │                                               │
         ▼                                               │
S3-T3.2 (DAG Executor integration) ◄─────────────────────┘
                   │
                   ▼
S3-T4.1 (test FeatureDetector) ──┬──► S3-T4.2 (test SmartDAGPlanner)
```

---

### S3-T1: FeatureDetector Class

#### S3-T1.1: Definire tipi DetectedFeatures e FEATURE_FLAGS

| Campo | Valore |
|-------|--------|
| **ID** | S3-T1.1 |
| **Titolo** | Aggiungere DetectedFeatures, FEATURE_FLAGS a types.ts |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | - |
| **Status** | ✅ completed |

**File:** `src/types.ts`

**Acceptance Criteria:**
- [ ] `DetectedFeatures` interface con tutti i campi da ARCHITECTURE_v2.1.0
- [ ] `FEATURE_FLAGS` object con ~25 flag costanti
- [ ] `FeatureFlag` type derivato da FEATURE_FLAGS
- [ ] TypeScript compila senza errori

---

#### S3-T1.2: Creare scaffolding FeatureDetector class

| Campo | Valore |
|-------|--------|
| **ID** | S3-T1.2 |
| **Titolo** | Creare src/core/feature-detector.ts con classe base |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T1.1 |
| **Status** | ✅ completed |

**File da creare:** `src/core/feature-detector.ts`

**Acceptance Criteria:**
- [ ] File `src/core/feature-detector.ts` creato
- [ ] Classe `FeatureDetector` esportata
- [ ] Tutti i metodi stub presenti
- [ ] TypeScript compila senza errori

---

#### S3-T1.3: Implementare detectFromPackageFiles()

| Campo | Valore |
|-------|--------|
| **ID** | S3-T1.3 |
| **Titolo** | Implementare rilevamento da package.json/requirements.txt |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T1.2 |
| **Status** | ✅ completed |

**File:** `src/core/feature-detector.ts`

**Acceptance Criteria:**
- [ ] Rileva almeno 10 framework
- [ ] Rileva almeno 15 feature flags
- [ ] Supporto base per Python requirements.txt
- [ ] Gestione errori per JSON malformati

---

#### S3-T1.4: Implementare detectStructure()

| Campo | Valore |
|-------|--------|
| **ID** | S3-T1.4 |
| **Titolo** | Implementare analisi struttura directory |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T1.2 |
| **Status** | ✅ completed |

**File:** `src/core/feature-detector.ts`

**Acceptance Criteria:**
- [ ] Rileva hasBackend/hasFrontend
- [ ] Rileva hasTests, hasDocs
- [ ] Rileva hasDocker, hasCICD
- [ ] Rileva isMonorepo

---

#### S3-T1.5: Implementare detectLanguages()

| Campo | Valore |
|-------|--------|
| **ID** | S3-T1.5 |
| **Titolo** | Implementare rilevamento linguaggi da estensioni |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T1.2 |
| **Status** | ✅ completed |

**File:** `src/core/feature-detector.ts`

**Acceptance Criteria:**
- [x] Rileva almeno 10 linguaggi
- [x] Ignora node_modules, .git
- [x] Limite depth 3 per performance

---

#### S3-T1.6: Implementare detectPatterns()

| Campo | Valore |
|-------|--------|
| **ID** | S3-T1.6 |
| **Titolo** | Implementare pattern matching su file chiave |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T1.2 |
| **Status** | ✅ completed |

**File:** `src/core/feature-detector.ts`

**Acceptance Criteria:**
- [x] Rileva pattern API REST
- [x] Rileva pattern GraphQL
- [x] Rileva pattern Auth

---

#### S3-T1.7: Implementare detect() e helper methods

| Campo | Valore |
|-------|--------|
| **ID** | S3-T1.7 |
| **Titolo** | Integrare detect(), determineRepoType() |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T1.3, S3-T1.4, S3-T1.5, S3-T1.6 |
| **Status** | ✅ completed |

**File:** `src/core/feature-detector.ts`

**Acceptance Criteria:**
- [ ] `detect()` ritorna DetectedFeatures completo
- [ ] `determineRepoType()` distingue 7 tipi
- [ ] `detectPackageManager()` rileva npm/yarn/pnpm/pip/cargo
- [ ] `findEntryPoints()` trova entry point

---

### S3-T2: SmartDAGPlanner Class

#### S3-T2.1: Definire interfacce PlannedAgent e PlannedDAG

| Campo | Valore |
|-------|--------|
| **ID** | S3-T2.1 |
| **Titolo** | Aggiungere tipi PlannedAgent, PlannedDAG a types.ts |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T1.1 |
| **Status** | ✅ completed |

**File:** `src/types.ts`

**Acceptance Criteria:**
- [ ] `PlannedAgent` con tutti i 9 campi
- [ ] `PlannedDAG` con agents, layers e metadata
- [ ] JSDoc per ogni campo

---

#### S3-T2.2: Creare scaffolding SmartDAGPlanner class

| Campo | Valore |
|-------|--------|
| **ID** | S3-T2.2 |
| **Titolo** | Creare src/core/smart-dag-planner.ts |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T2.1, S3-T1.7 |
| **Status** | ✅ completed |

**File da creare:** `src/core/smart-dag-planner.ts`

**Acceptance Criteria:**
- [ ] File creato ed esportato
- [ ] Constructor con PromptRegistry e FeatureDetector
- [ ] Metodo `plan()` implementato

---

#### S3-T2.3: Implementare selectAgents() Layer 0-4

| Campo | Valore |
|-------|--------|
| **ID** | S3-T2.3 |
| **Titolo** | Selezione agenti Layer 0-4 |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T2.2 |
| **Status** | ✅ completed |

**File:** `src/core/smart-dag-planner.ts`

**Acceptance Criteria:**
- [ ] Layer 0-4 implementati
- [ ] Condizionali per backend/frontend

---

#### S3-T2.4: Implementare selectAgents() Layer 5-8

| Campo | Valore |
|-------|--------|
| **ID** | S3-T2.4 |
| **Titolo** | Selezione agenti Layer 5-8 |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T2.3 |
| **Status** | ✅ completed |

**File:** `src/core/smart-dag-planner.ts`

**Acceptance Criteria:**
- [ ] Layer 5-8 implementati
- [ ] Condizionali per API, DB, Auth, UI

---

#### S3-T2.5: Implementare selectAgents() Layer 9-12

| Campo | Valore |
|-------|--------|
| **ID** | S3-T2.5 |
| **Titolo** | Selezione agenti Layer 9-12 |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T2.4 |
| **Status** | ✅ completed |

**File:** `src/core/smart-dag-planner.ts`

**Acceptance Criteria:**
- [ ] Layer 9-12 implementati
- [ ] Summary con dependency '*'

---

#### S3-T2.6: Implementare buildLayers() e estimateDuration()

| Campo | Valore |
|-------|--------|
| **ID** | S3-T2.6 |
| **Titolo** | Ordinamento layer e stima durata |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T2.5 |
| **Status** | ✅ completed |

**File:** `src/core/smart-dag-planner.ts`

**Acceptance Criteria:**
- [ ] `buildLayers()` raggruppa per layer
- [ ] `estimateDuration()` stima realistica

---

#### S3-T2.7: Implementare assignPrompts()

| Campo | Valore |
|-------|--------|
| **ID** | S3-T2.7 |
| **Titolo** | Override prompt per framework |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T2.6 |
| **Status** | ✅ completed |

**File:** `src/core/smart-dag-planner.ts`

**Acceptance Criteria:**
- [ ] Override per Next.js, Nuxt, NestJS
- [ ] `validateDAG()` implementato

---

### S3-T3: Conditional Agent Skip

#### S3-T3.1: Implementare skip logic

| Campo | Valore |
|-------|--------|
| **ID** | S3-T3.1 |
| **Titolo** | Aggiungere shouldSkipAgent() |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T2.7 |
| **Status** | ✅ completed |

**File:** `src/core/smart-dag-planner.ts`

**Acceptance Criteria:**
- [ ] Skip per dipendenze fallite
- [ ] Skip per feature mancanti
- [ ] Log per ogni skip

---

#### S3-T3.2: Integrare skip in DAGExecutor

| Campo | Valore |
|-------|--------|
| **ID** | S3-T3.2 |
| **Titolo** | Modificare DAGExecutor per skip |
| **Tipo** | enhancement |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T3.1 |
| **Status** | ✅ completed |

**File:** `src/core/dag-executor.ts`

**Acceptance Criteria:**
- [ ] DAGExecutor usa shouldSkipAgent()
- [ ] Agenti skippati marcati nel risultato

---

### S3-T4: Unit Tests

#### S3-T4.1: Test FeatureDetector

| Campo | Valore |
|-------|--------|
| **ID** | S3-T4.1 |
| **Titolo** | Test suite FeatureDetector |
| **Tipo** | test |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T1.7 |
| **Status** | ✅ completed |

**File da creare:** `src/core/feature-detector.test.ts`

**Acceptance Criteria:**
- [ ] Almeno 10 test cases
- [ ] Coverage > 80%

---

#### S3-T4.2: Test SmartDAGPlanner

| Campo | Valore |
|-------|--------|
| **ID** | S3-T4.2 |
| **Titolo** | Test suite SmartDAGPlanner |
| **Tipo** | test |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S3-T2.7, S3-T3.1 |
| **Status** | ✅ completed |

**File da creare:** `src/core/smart-dag-planner.test.ts`

**Acceptance Criteria:**
- [ ] Almeno 10 test cases
- [ ] Coverage > 80%

---

### Riepilogo Sprint 3

| Task ID | Titolo | Effort | Parallelizzabile |
|---------|--------|--------|------------------|
| S3-T1.1 | Tipi DetectedFeatures + FEATURE_FLAGS | 1.5h | ✅ |
| S3-T1.2 | FeatureDetector scaffolding | 1h | - |
| S3-T1.3 | detectFromPackageFiles() | 2h | ✅ (dopo S3-T1.2) |
| S3-T1.4 | detectStructure() | 1h | ✅ (dopo S3-T1.2) |
| S3-T1.5 | detectLanguages() | 1h | ✅ (dopo S3-T1.2) |
| S3-T1.6 | detectPatterns() | 1.5h | ✅ (dopo S3-T1.2) |
| S3-T1.7 | detect() complete | 1.5h | - |
| S3-T2.1 | Tipi PlannedAgent/PlannedDAG | 1h | ✅ |
| S3-T2.2 | SmartDAGPlanner scaffolding | 1h | - |
| S3-T2.3 | selectAgents L0-L4 | 2h | - |
| S3-T2.4 | selectAgents L5-L8 | 2h | - |
| S3-T2.5 | selectAgents L9-L12 | 1.5h | - |
| S3-T2.6 | buildLayers() + estimateDuration() | 1h | - |
| S3-T2.7 | assignPrompts() | 1h | - |
| S3-T3.1 | shouldSkipAgent() | 1h | - |
| S3-T3.2 | DAGExecutor integration | 1.5h | - |
| S3-T4.1 | Test FeatureDetector | 1.5h | ✅ (dopo S3-T1.7) |
| S3-T4.2 | Test SmartDAGPlanner | 1.5h | ✅ (dopo S3-T2.7) |

**Effort Totale Sprint 3:** ~23h
**Con Parallelizzazione:** ~12h

### Waves di Esecuzione Parallela (Sprint 3)

| Wave | Tasks | Effort |
|------|-------|--------|
| 1 | S3-T1.1, S3-T2.1 | 1.5h |
| 2 | S3-T1.2 | 1h |
| 3 | S3-T1.3, S3-T1.4, S3-T1.5, S3-T1.6 | 2h |
| 4 | S3-T1.7, S3-T2.2 | 1.5h |
| 5 | S3-T2.3 | 2h |
| 6 | S3-T2.4 | 2h |
| 7 | S3-T2.5 | 1.5h |
| 8 | S3-T2.6, S3-T4.1 | 1.5h |
| 9 | S3-T2.7, S3-T3.1 | 1h |
| 10 | S3-T3.2, S3-T4.2 | 1.5h |

---

## 📋 SPRINT 4: Generic Agent + Template System (DETTAGLIO ATOMICO)

**Status:** 🟢 COMPLETATO
**Goal:** Agente generico guidato da prompt + sistema template Handlebars-like
**Effort Totale:** ~22h
**Dipendenze:** Sprint 2 (PromptRegistry), Sprint 3 (SmartDAGPlanner) ✅

### Grafo Dipendenze Sprint 4

```
S4-T1.1 (tipi Template) ─────────────────────────────────────────────────────┐
          │                                                                   │
          ▼                                                                   │
S4-T1.2 (TemplateLoader scaffolding)                                         │
          │                                                                   │
          ├──► S4-T1.3 (load/fill) ──┐                                       │
          │                          │                                        │
          └──► S4-T1.4 (helpers) ────┴──► S4-T1.5 (test TemplateLoader)      │
                                                        │                     │
S4-T2.1 (tipi GenericAgent) ◄───────────────────────────┼─────────────────────┘
          │                                              │
          ▼                                              │
S4-T2.2 (GenericAnalysisAgent scaffolding) ◄────────────┘
          │
          ├──► S4-T2.3 (buildLLMMessages) ──┐
          │                                  │
          ├──► S4-T2.4 (applyTemplate) ──────┼──► S4-T2.6 (process)
          │                                  │         │
          └──► S4-T2.5 (processDiagrams) ────┘         │
                                                        │
S4-T2.7 (test GenericAgent) ◄───────────────────────────┘
          │
          ▼
S4-T3.1 (api/endpoint.md) ─────┬──► S4-T3.2 (ui/component.md)
                               │
S4-T3.3 (auth/flow.md) ────────┼──► S4-T3.4 (entity/model.md)
                               │
S4-T3.5 (feature/spec.md) ─────┘
```

---

### S4-T1: TemplateLoader Class

#### S4-T1.1: Definire tipi Template

| Campo | Valore |
|-------|--------|
| **ID** | S4-T1.1 |
| **Titolo** | Aggiungere tipi Template, TemplateDefinition, LoadedTemplate a types.ts |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | - |
| **Status** | ✅ completed |

**File:** `src/types.ts`

**Descrizione:**
Aggiungere le interfacce per il sistema template:
```typescript
export interface TemplateDefinition {
    id: string;                // "api/endpoint", "ui/component", etc.
    name: string;              // Human-readable name
    description: string;       // What this template is for
    category: string;          // "api", "ui", "entity", etc.
    requiredVariables: string[]; // Variables that must be provided
    optionalVariables?: string[]; // Optional variables with defaults
    version: string;           // Template version
}

export interface LoadedTemplate {
    definition: TemplateDefinition;
    content: string;           // Template markdown content
    variables: string[];       // Extracted {{variable}} names
    hash: string;              // MD5 hash for caching
}

export interface TemplateVariables {
    [key: string]: string | number | boolean | object | any[];
}
```

**Acceptance Criteria:**
- [ ] `TemplateDefinition` interface con tutti i campi
- [ ] `LoadedTemplate` interface con content e metadata
- [ ] `TemplateVariables` tipo flessibile per valori
- [ ] Export corretto di tutti i nuovi tipi

---

#### S4-T1.2: Creare scaffolding TemplateLoader class

| Campo | Valore |
|-------|--------|
| **ID** | S4-T1.2 |
| **Titolo** | Creare src/core/template-loader.ts con classe base |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T1.1 |
| **Status** | ✅ completed |

**File da creare:** `src/core/template-loader.ts`

**Descrizione:**
```typescript
export class TemplateLoader {
    private templatesDir: string;
    private cache: Map<string, LoadedTemplate> = new Map();
    
    constructor(pluginRoot: string) {
        this.templatesDir = path.join(pluginRoot, 'templates');
    }
    
    load(templateId: string): LoadedTemplate { /* stub */ }
    fill(template: LoadedTemplate, variables: TemplateVariables): string { /* stub */ }
    list(): TemplateDefinition[] { /* stub */ }
    getVariables(templateId: string): string[] { /* stub */ }
}
```

**Acceptance Criteria:**
- [x] File `src/core/template-loader.ts` creato
- [x] Classe `TemplateLoader` esportata
- [x] Tutti i metodi stub presenti
- [x] TypeScript compila senza errori

---

#### S4-T1.3: Implementare load() e fill() methods

| Campo | Valore |
|-------|--------|
| **ID** | S4-T1.3 |
| **Titolo** | Implementare logica caricamento e riempimento template |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T1.2 |
| **Status** | ✅ completed |

**File:** `src/core/template-loader.ts`

**Descrizione:**
```typescript
load(templateId: string): LoadedTemplate {
    // 1. Check cache
    // 2. Load from templates/{category}/{name}.md
    // 3. Extract variables with regex {{variable}}
    // 4. Calculate hash
    // 5. Cache and return
}

fill(template: LoadedTemplate, variables: TemplateVariables): string {
    // 1. Replace {{variable}} with values
    // 2. Handle {{#each items}} loops
    // 3. Handle {{#if condition}} conditionals
    // 4. Return filled content
}
```

**Acceptance Criteria:**
- [x] `load()` carica template da filesystem
- [x] `load()` estrae tutte le variabili {{name}}
- [x] `fill()` sostituisce variabili con valori
- [x] `fill()` supporta sintassi base Handlebars (each, if)
- [x] Cache evita riletture filesystem

---

#### S4-T1.4: Implementare Handlebars helpers

| Campo | Valore |
|-------|--------|
| **ID** | S4-T1.4 |
| **Titolo** | Aggiungere supporto per {{#each}}, {{#if}}, {{#unless}} |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T1.3 |
| **Status** | ✅ completed |

**File:** `src/core/template-loader.ts`

**Acceptance Criteria:**
- [x] `{{#each items}}...{{/each}}` iterates array
- [x] `{{#if condition}}...{{/if}}` conditional
- [x] `{{#unless condition}}...{{/unless}}` inverse conditional
- [x] Nested helpers work correctly
- [x] Empty arrays/falsy values handled gracefully

---

#### S4-T1.5: Test suite TemplateLoader

| Campo | Valore |
|-------|--------|
| **ID** | S4-T1.5 |
| **Titolo** | Unit test per TemplateLoader |
| **Tipo** | test |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T1.4 |
| **Status** | ✅ completed |

**File da creare:** `src/core/template-loader.test.ts`

**Acceptance Criteria:**
- [ ] Almeno 10 test cases
- [ ] Test load() con file esistente
- [ ] Test load() con file mancante (error)
- [ ] Test fill() con variabili semplici
- [ ] Test fill() con {{#each}}
- [ ] Test fill() con {{#if}}
- [ ] Coverage > 80%

---

### S4-T2: GenericAnalysisAgent Class

#### S4-T2.1: Definire tipi GenericAgent

| Campo | Valore |
|-------|--------|
| **ID** | S4-T2.1 |
| **Titolo** | Aggiungere tipi LLMMessage, GeneratedDiagram, StandaloneDiagram a types.ts |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T1.1 |
| **Status** | ✅ completed |

**File:** `src/types.ts`

**Descrizione:**
```typescript
export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface GeneratedDiagram {
    type: DiagramType;
    content: string;          // Mermaid code
    outputFile: string;       // e.g. "api-sequence.mmd"
    inline: boolean;          // Include inline in doc
}

export interface StandaloneDiagram {
    path: string;             // e.g. "_diagrams/api-sequence.mmd"
    content: string;          // With frontmatter
}

export interface GenericAgentOutput {
    output: string;           // Markdown content
    path: string;             // Output file path
    diagrams: StandaloneDiagram[];
    promptVersion: PromptVersion;
}
```

**Acceptance Criteria:**
- [ ] `LLMMessage` con role union type
- [ ] `GeneratedDiagram` con type, content, outputFile
- [ ] `StandaloneDiagram` con path e frontmatter content
- [ ] `GenericAgentOutput` con tutti i campi necessari

---

#### S4-T2.2: Creare scaffolding GenericAnalysisAgent

| Campo | Valore |
|-------|--------|
| **ID** | S4-T2.2 |
| **Titolo** | Creare src/agents/generic-analysis.agent.ts con classe base |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T2.1, S4-T1.2 |
| **Status** | ✅ completed |

**File da creare:** `src/agents/generic-analysis.agent.ts`

**Descrizione:**
```typescript
export class GenericAnalysisAgent extends SubAgent {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly systemPrompt: string = '';
    readonly triggers: RegExp[] = [];
    
    private config: PlannedAgent;
    private router: PromptRouter;
    private templateLoader: TemplateLoader;
    
    constructor(
        config: PlannedAgent,
        router: PromptRouter,
        templateLoader: TemplateLoader
    ) {
        super();
        this.config = config;
        this.router = router;
        this.templateLoader = templateLoader;
        this.id = config.id;
        this.name = `${config.id} Analysis`;
        this.description = `Analyzes ${config.id} using prompt ${config.promptId}`;
    }
    
    async process(context: AgentContext): Promise<AgentResult> { /* stub */ }
}
```

**Acceptance Criteria:**
- [ ] File creato ed esportato
- [ ] Constructor accetta PlannedAgent, PromptRouter, TemplateLoader
- [ ] Estende SubAgent correttamente
- [ ] ID dinamico da config

---

#### S4-T2.3: Implementare buildLLMMessages()

| Campo | Valore |
|-------|--------|
| **ID** | S4-T2.3 |
| **Titolo** | Implementare costruzione messaggi per LLM |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T2.2 |
| **Status** | ✅ completed |

**File:** `src/agents/generic-analysis.agent.ts`

**Acceptance Criteria:**
- [ ] `buildLLMMessages()` ritorna array di LLMMessage
- [ ] System message include systemPrompt + outputSchema
- [ ] User message include repo structure + key files + analysis prompt
- [ ] Previous context incluso se presente

---

#### S4-T2.4: Implementare applyTemplate()

| Campo | Valore |
|-------|--------|
| **ID** | S4-T2.4 |
| **Titolo** | Implementare applicazione template a output LLM |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T2.2, S4-T1.3 |
| **Status** | ✅ completed |

**File:** `src/agents/generic-analysis.agent.ts`

**Acceptance Criteria:**
- [ ] `applyTemplate()` estrae variabili da LLM output
- [ ] Usa TemplateLoader.fill() per applicare template
- [ ] Fallback a output raw se no template
- [ ] Aggiunge project e date automaticamente

---

#### S4-T2.5: Implementare processDiagrams()

| Campo | Valore |
|-------|--------|
| **ID** | S4-T2.5 |
| **Titolo** | Implementare estrazione e wrapping diagrammi |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T2.2 |
| **Status** | ✅ completed |

**File:** `src/agents/generic-analysis.agent.ts`

**Acceptance Criteria:**
- [ ] `extractMermaidDiagram()` trova diagrammi nel content
- [ ] `wrapWithFrontmatter()` aggiunge YAML frontmatter
- [ ] `processDiagrams()` crea standalone files
- [ ] Inline diagrams aggiunti al content se mancanti

---

#### S4-T2.6: Implementare process() completo

| Campo | Valore |
|-------|--------|
| **ID** | S4-T2.6 |
| **Titolo** | Integrare tutti i metodi in process() |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T2.3, S4-T2.4, S4-T2.5 |
| **Status** | ✅ completed |

**File:** `src/agents/generic-analysis.agent.ts`

**Acceptance Criteria:**
- [ ] `process()` chiama router.route()
- [ ] `process()` chiama LLM con messaggi costruiti
- [ ] `process()` applica template se presente
- [ ] `process()` processa diagrammi
- [ ] `process()` ritorna AgentResult con output, path, diagrams
- [ ] Error handling robusto

---

#### S4-T2.7: Test suite GenericAnalysisAgent

| Campo | Valore |
|-------|--------|
| **ID** | S4-T2.7 |
| **Titolo** | Unit test per GenericAnalysisAgent |
| **Tipo** | test |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T2.6 |
| **Status** | ✅ completed |

**File da creare:** `src/agents/generic-analysis.agent.test.ts`

**Acceptance Criteria:**
- [ ] Almeno 10 test cases
- [ ] Mock di PromptRouter e TemplateLoader
- [ ] Test con/senza template
- [ ] Test con diagrammi
- [ ] Test error handling
- [ ] Coverage > 80%

---

### S4-T3: Template Files

#### S4-T3.1: Template api/endpoint.md

| Campo | Valore |
|-------|--------|
| **ID** | S4-T3.1 |
| **Titolo** | Creare template per documentazione endpoint API |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T1.4 |
| **Status** | ✅ completed |

**File da creare:** `templates/api/endpoint.md`

**Acceptance Criteria:**
- [ ] Template con variabili: method, path, description, parameters, responses
- [ ] Usa {{#each parameters}} per lista parametri
- [ ] Usa {{#if authentication}} per sezione auth
- [ ] Include esempio request/response
- [ ] YAML frontmatter template

---

#### S4-T3.2: Template ui/component.md

| Campo | Valore |
|-------|--------|
| **ID** | S4-T3.2 |
| **Titolo** | Creare template per documentazione componente UI |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T1.4 |
| **Status** | ✅ completed |

**File da creare:** `templates/ui/component.md`

**Acceptance Criteria:**
- [ ] Template con variabili: name, description, props, events, slots
- [ ] Usa {{#each props}} per lista proprietà
- [ ] Include sezione usage examples
- [ ] Include sezione styling
- [ ] YAML frontmatter template

---

#### S4-T3.3: Template auth/flow.md

| Campo | Valore |
|-------|--------|
| **ID** | S4-T3.3 |
| **Titolo** | Creare template per documentazione flusso autenticazione |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T1.4 |
| **Status** | ✅ completed |

**File da creare:** `templates/auth/flow.md`

**Acceptance Criteria:**
- [ ] Template con variabili: flow_name, steps, providers, tokens
- [ ] Usa {{#each steps}} per sequenza passi
- [ ] Include sezione security considerations
- [ ] Placeholder per sequence diagram
- [ ] YAML frontmatter template

---

#### S4-T3.4: Template entity/model.md

| Campo | Valore |
|-------|--------|
| **ID** | S4-T3.4 |
| **Titolo** | Creare template per documentazione entità/modello |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T1.4 |
| **Status** | ✅ completed |

**File da creare:** `templates/entity/model.md`

**Acceptance Criteria:**
- [ ] Template con variabili: name, description, fields, relations
- [ ] Usa {{#each fields}} per lista campi
- [ ] Usa {{#each relations}} per relazioni
- [ ] Placeholder per ERD diagram
- [ ] YAML frontmatter template

---

#### S4-T3.5: Template feature/spec.md

| Campo | Valore |
|-------|--------|
| **ID** | S4-T3.5 |
| **Titolo** | Creare template per specifica feature |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S4-T1.4 |
| **Status** | ✅ completed |

**File da creare:** `templates/feature/spec.md`

**Acceptance Criteria:**
- [ ] Template con variabili: feature_name, user_stories, acceptance_criteria, tech_requirements
- [ ] Usa {{#each user_stories}} per storie
- [ ] Usa {{#each acceptance_criteria}} per criteri
- [ ] Include sezione implementation notes
- [ ] YAML frontmatter template

---

### Riepilogo Sprint 4

| Task ID | Titolo | Effort | Parallelizzabile |
|---------|--------|--------|------------------|
| S4-T1.1 | Tipi Template | 1h | ✅ |
| S4-T1.2 | TemplateLoader scaffolding | 1h | - |
| S4-T1.3 | load() e fill() | 2h | - |
| S4-T1.4 | Handlebars helpers | 1.5h | - |
| S4-T1.5 | Test TemplateLoader | 1.5h | - |
| S4-T2.1 | Tipi GenericAgent | 1h | ✅ |
| S4-T2.2 | GenericAgent scaffolding | 1.5h | - |
| S4-T2.3 | buildLLMMessages() | 1.5h | ✅ (dopo S4-T2.2) |
| S4-T2.4 | applyTemplate() | 1.5h | ✅ (dopo S4-T2.2) |
| S4-T2.5 | processDiagrams() | 1.5h | ✅ (dopo S4-T2.2) |
| S4-T2.6 | process() complete | 2h | - |
| S4-T2.7 | Test GenericAgent | 2h | ✅ (dopo S4-T2.6) |
| S4-T3.1 | api/endpoint.md | 1h | ✅ |
| S4-T3.2 | ui/component.md | 1h | ✅ |
| S4-T3.3 | auth/flow.md | 1h | ✅ |
| S4-T3.4 | entity/model.md | 1h | ✅ |
| S4-T3.5 | feature/spec.md | 1h | ✅ |

**Effort Totale Sprint 4:** ~22h
**Con Parallelizzazione:** ~10h

### Waves di Esecuzione Parallela (Sprint 4)

| Wave | Tasks | Effort |
|------|-------|--------|
| 1 | S4-T1.1, S4-T2.1 | 1h |
| 2 | S4-T1.2, S4-T2.2 | 1.5h |
| 3 | S4-T1.3, S4-T2.3, S4-T2.4, S4-T2.5 | 2h |
| 4 | S4-T1.4, S4-T2.6 | 2h |
| 5 | S4-T1.5, S4-T2.7, S4-T3.1-3.5 | 3h |

---

## 📋 SPRINT 5: Diagram Generator + Prompt Library (DETTAGLIO ATOMICO)

**Status:** 🟡 IN PROGRESS
**Goal:** DiagramGenerator completo + prompt specializzati per analisi domini
**Effort Totale:** ~24h (effettivo ~12h con parallelizzazione)
**Dipendenze:** Sprint 4 (GenericAnalysisAgent, TemplateLoader) ✅

### Grafo Dipendenze Sprint 5

```
S5-T1.1 (tipi Diagram) ──────────────────────────────────────────────────────┐
          │                                                                   │
          ▼                                                                   │
S5-T1.2 (DiagramGenerator scaffolding)                                       │
          │                                                                   │
          ├──► S5-T1.3 (generateERD) ──────────┐                             │
          │                                     │                             │
          ├──► S5-T1.4 (generateSequence) ─────┤                             │
          │                                     │                             │
          ├──► S5-T1.5 (generateFlowchart) ────┼──► S5-T1.7 (generate main)  │
          │                                     │         │                   │
          ├──► S5-T1.6 (generateClass+State) ──┘         │                   │
          │                                               │                   │
          └──► S5-T1.8 (generateC4) ─────────────────────┘                   │
                                                          │                   │
S5-T2.1 (inline integration) ◄────────────────────────────┤                   │
          │                                               │                   │
          ▼                                               │                   │
S5-T2.2 (standalone files) ◄──────────────────────────────┘                   │
          │                                                                   │
          ▼                                                                   │
S5-T2.3 (test DiagramGenerator) ◄─────────────────────────────────────────────┘

                    ▼ ▼ ▼ ▼ (tutti parallelizzabili dopo S5-T2.3)

S5-T3.1 (api/detect-endpoints.md) ─────┬───────────────────────────────────────┐
                                       │                                        │
S5-T4.1 (ui/detect-components.md) ─────┼───────────────────────────────────────┤
                                       │                                        │
S5-T5.1 (auth/detect-auth.md) ─────────┼───────────────────────────────────────┤
                                       │                                        │
S5-T6.1 (data/detect-schema.md) ───────┼───────────────────────────────────────┤
                                       │                                        │
S5-T7.1 (feature/spec-from-task.md) ───┴───► _registry.json update (S5-T7.2) ──┘
```

---

### S5-T1: DiagramGenerator Class

#### S5-T1.1: Definire tipi Diagram

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.1 |
| **Titolo** | Aggiungere tipi Entity, Flow, Step, ClassDef, State, Component a types.ts |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | - |
| **Status** | ✅ completed |

**File:** `src/types.ts`

**Descrizione:**
Aggiungere le interfacce per il parsing e generazione diagrammi:
```typescript
// Entity per ERD
export interface DiagramEntity {
    name: string;
    fields: { name: string; type: string; isPK?: boolean; isFK?: boolean }[];
    relations?: { target: string; cardinality: string; label: string }[];
}

// Flow per Sequence
export interface DiagramFlow {
    from: string;
    to: string;
    message: string;
    isResponse?: boolean;
}

// Step per Flowchart
export interface DiagramStep {
    id: string;
    label: string;
    type: 'decision' | 'process' | 'terminal';
    next?: { target: string; condition?: string }[];
}

// ClassDef per Class Diagram
export interface DiagramClass {
    name: string;
    properties?: { name: string; type: string; isPublic: boolean }[];
    methods?: { name: string; params?: string; returnType: string; isPublic: boolean }[];
    extends?: string;
    implements?: string[];
}

// State per State Diagram
export interface DiagramState {
    name: string;
    isInitial?: boolean;
    isFinal?: boolean;
    transitions?: { target: string; event?: string }[];
}

// Component per C4
export interface DiagramComponent {
    id: string;
    name: string;
    type: 'person' | 'system' | 'external' | 'container';
    description?: string;
    relations?: { target: string; label: string }[];
}
```

**Acceptance Criteria:**
- [ ] `DiagramEntity` per ERD con fields e relations
- [ ] `DiagramFlow` per sequence con from/to/message
- [ ] `DiagramStep` per flowchart con decision/process/terminal
- [ ] `DiagramClass` per class diagram con properties/methods
- [ ] `DiagramState` per state diagram con transitions
- [ ] `DiagramComponent` per C4 con person/system/external
- [ ] Export corretto di tutti i nuovi tipi

---

#### S5-T1.2: Creare scaffolding DiagramGenerator class

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.2 |
| **Titolo** | Creare src/core/diagram-generator.ts con classe base |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.1 |
| **Status** | ✅ completed |

**File da creare:** `src/core/diagram-generator.ts`

**Descrizione:**
```typescript
export class DiagramGenerator {
    /**
     * Genera diagramma da contenuto analisi
     */
    async generate(
        type: DiagramType,
        analysisContent: string,
        context: AgentContext
    ): Promise<GeneratedDiagram | null> { /* stub */ }
    
    // Generatori specifici
    private async generateERD(...): Promise<GeneratedDiagram | null> { /* stub */ }
    private async generateSequence(...): Promise<GeneratedDiagram | null> { /* stub */ }
    private async generateFlowchart(...): Promise<GeneratedDiagram | null> { /* stub */ }
    private async generateClassDiagram(...): Promise<GeneratedDiagram | null> { /* stub */ }
    private async generateStateDiagram(...): Promise<GeneratedDiagram | null> { /* stub */ }
    private async generateC4(...): Promise<GeneratedDiagram | null> { /* stub */ }
    
    // Extractors
    private extractEntities(content: string): DiagramEntity[] { /* stub */ }
    private extractFlows(content: string): DiagramFlow[] { /* stub */ }
    private extractSteps(content: string): DiagramStep[] { /* stub */ }
    private extractClasses(content: string): DiagramClass[] { /* stub */ }
    private extractStates(content: string): DiagramState[] { /* stub */ }
    private extractComponents(content: string): DiagramComponent[] { /* stub */ }
    
    // Utilities
    private sanitizeId(str: string): string { /* stub */ }
    validateMermaid(content: string): boolean { /* stub */ }
}
```

**Acceptance Criteria:**
- [ ] File `src/core/diagram-generator.ts` creato
- [ ] Classe `DiagramGenerator` esportata
- [ ] Tutti i metodi stub presenti (6 generatori + 6 extractors + 2 utilities)
- [ ] TypeScript compila senza errori

---

#### S5-T1.3: Implementare generateERD() ed extractEntities()

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.3 |
| **Titolo** | Implementare generazione Entity Relationship Diagram |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.2 |
| **Status** | ✅ completed |

---

#### S5-T1.4: Implementare generateSequence() ed extractFlows()

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.4 |
| **Titolo** | Implementare generazione Sequence Diagram |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.2 |
| **Status** | ✅ completed |

---

#### S5-T1.5: Implementare generateFlowchart() ed extractSteps()

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.5 |
| **Titolo** | Implementare generazione Flowchart Diagram |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.2 |
| **Status** | ✅ completed |

---

#### S5-T1.6: Implementare generateClassDiagram() e generateStateDiagram()

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.6 |
| **Titolo** | Implementare Class Diagram e State Diagram |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.2 |
| **Status** | ✅ completed |

---

#### S5-T1.7: Implementare generate() main method

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.7 |
| **Titolo** | Implementare metodo generate() con switch e validazione |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.3, S5-T1.4, S5-T1.5, S5-T1.6 |
| **Status** | ✅ completed |

---

#### S5-T1.8: Implementare generateC4()

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.8 |
| **Titolo** | Implementare generazione C4 Context Diagram |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.2 |
| **Status** | ✅ completed |


**File:** `src/core/diagram-generator.ts`

**Descrizione:**
Implementare estrazione entità da markdown e generazione ERD Mermaid.

**Acceptance Criteria:**
- [ ] `extractEntities()` estrae da tabelle markdown (## Entities, ## Models)
- [ ] `extractEntities()` riconosce PK/FK da annotazioni
- [ ] `generateERD()` genera sintassi Mermaid valida
- [ ] `generateERD()` include relazioni tra entità
- [ ] Return null se nessuna entità trovata

---

#### S5-T1.4: Implementare generateSequence() ed extractFlows()

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.4 |
| **Titolo** | Implementare generazione Sequence Diagram |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.2 |
| **Status** | ✅ completed |

**File:** `src/core/diagram-generator.ts`

**Descrizione:**
Implementare estrazione flussi API/auth e generazione Sequence Diagram.

**Acceptance Criteria:**
- [ ] `extractFlows()` estrae da sezioni ## Flow, ## Sequence, ## API Flow
- [ ] `extractFlows()` riconosce pattern "A -> B: message"
- [ ] `generateSequence()` genera partecipanti unici
- [ ] `generateSequence()` usa ->> per request, -->> per response
- [ ] Return null se nessun flusso trovato

---

#### S5-T1.5: Implementare generateFlowchart() ed extractSteps()

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.5 |
| **Titolo** | Implementare generazione Flowchart Diagram |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.2 |
| **Status** | ✅ completed |

**File:** `src/core/diagram-generator.ts`

**Descrizione:**
Implementare estrazione logica/decisioni e generazione Flowchart.

**Acceptance Criteria:**
- [ ] `extractSteps()` estrae da liste numerate/bullet
- [ ] `extractSteps()` riconosce "if/else" come decision
- [ ] `generateFlowchart()` usa TD (top-down) layout
- [ ] `generateFlowchart()` differenzia nodi: {} per decision, [] per process, ([]) per terminal
- [ ] Return null se nessuno step trovato

---

#### S5-T1.6: Implementare generateClassDiagram() e generateStateDiagram()

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.6 |
| **Titolo** | Implementare Class Diagram e State Diagram |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.2 |
| **Status** | ✅ completed |

**File:** `src/core/diagram-generator.ts`

**Descrizione:**
Implementare generazione Class Diagram (tipi/interfacce) e State Diagram (stati/transizioni).

**Acceptance Criteria:**
- [ ] `extractClasses()` estrae da sezioni ## Types, ## Interfaces
- [ ] `generateClassDiagram()` mostra properties con visibilità (+/-)
- [ ] `generateClassDiagram()` mostra ereditarietà con <|--
- [ ] `extractStates()` estrae da sezioni ## States, ## Lifecycle
- [ ] `generateStateDiagram()` usa stateDiagram-v2
- [ ] `generateStateDiagram()` mostra [*] per initial/final

---

#### S5-T1.7: Implementare generate() main method

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.7 |
| **Titolo** | Implementare metodo generate() con switch e validazione |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.3, S5-T1.4, S5-T1.5, S5-T1.6 |
| **Status** | ✅ completed |

**File:** `src/core/diagram-generator.ts`

**Descrizione:**
Implementare metodo principale che dispatch ai generatori specifici.

**Acceptance Criteria:**
- [ ] `generate()` dispatch corretto per tutti i 6 DiagramType
- [ ] `generate()` return null per tipi non supportati (gantt, pie)
- [ ] `validateMermaid()` controlla sintassi base
- [ ] Logging per errori di generazione

---

#### S5-T1.8: Implementare generateC4()

| Campo | Valore |
|-------|--------|
| **ID** | S5-T1.8 |
| **Titolo** | Implementare generazione C4 Context Diagram |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.2 |
| **Status** | ✅ completed |

**File:** `src/core/diagram-generator.ts`

**Descrizione:**
Implementare estrazione componenti architetturali e generazione C4 Diagram.

**Acceptance Criteria:**
- [ ] `extractComponents()` estrae da sezioni ## Architecture, ## System
- [ ] `extractComponents()` distingue Person, System, System_Ext
- [ ] `generateC4()` usa C4Context syntax
- [ ] `generateC4()` include relazioni con Rel()
- [ ] Return null se nessun componente trovato

---

### S5-T2: Integrazione Diagrammi

#### S5-T2.1: Integrare diagrammi inline in GenericAnalysisAgent

| Campo | Valore |
|-------|--------|
| **ID** | S5-T2.1 |
| **Titolo** | Modificare GenericAnalysisAgent per usare DiagramGenerator |
| **Tipo** | enhancement |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.7 |
| **Status** | ✅ completed |

**File:** `src/agents/generic-analysis.agent.ts`

**Descrizione:**
Integrare DiagramGenerator nel flusso process() dell'agente generico.

**Acceptance Criteria:**
- [ ] Constructor accetta DiagramGenerator opzionale
- [ ] `generateDiagrams()` usa DiagramGenerator.generate()
- [ ] Diagrammi inline aggiunti a content se non già presenti
- [ ] Fallback se generazione fallisce

---

#### S5-T2.2: Implementare creazione file standalone .mmd

| Campo | Valore |
|-------|--------|
| **ID** | S5-T2.2 |
| **Titolo** | Creare file .mmd standalone in _diagrams/ |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T2.1 |
| **Status** | ✅ completed |

**File:** `src/agents/spec-zero/finalizer/write-specs.agent.ts`

**Descrizione:**
Modificare WriteSpecsAgent per scrivere file .mmd standalone con frontmatter.

**Acceptance Criteria:**
- [x] `writeDiagrams()` scrive in `_generated/_diagrams/`
- [x] Ogni file ha YAML frontmatter con uid, type, source
- [x] Nome file segue pattern `{agent-id}-{diagram-type}.mmd`
- [x] Link nel documento spec punta a file standalone

---

#### S5-T2.3: Test suite DiagramGenerator

| Campo | Valore |
|-------|--------|
| **ID** | S5-T2.3 |
| **Titolo** | Unit test per DiagramGenerator |
| **Tipo** | test |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T1.7, S5-T1.8 |
| **Status** | ✅ completed |

**File da creare:** `src/core/diagram-generator.test.ts`

**Acceptance Criteria:**
- [ ] Almeno 12 test cases (2 per ogni generatore)
- [ ] Test estrazione entità da markdown
- [ ] Test generazione Mermaid valida
- [ ] Test con contenuto vuoto (return null)
- [ ] Test validateMermaid()
- [ ] Coverage > 80%

---

### S5-T3: Prompt API Detection

#### S5-T3.1: Creare prompts/api/detect-endpoints.md

| Campo | Valore |
|-------|--------|
| **ID** | S5-T3.1 |
| **Titolo** | Creare prompt per rilevamento endpoint REST/GraphQL |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T2.3 |
| **Status** | ✅ completed |

**File da creare:** `prompts/api/detect-endpoints.md`

**Descrizione:**
Prompt per analisi approfondita di endpoint API con:
- Rilevamento automatico route handlers
- Estrazione parametri e body schema
- Identificazione autenticazione richiesta
- Generazione documentazione OpenAPI-like

**Acceptance Criteria:**
- [x] Header `<!-- version=1 -->`
- [x] Sezione istruzioni rilevamento framework (Express, Fastify, etc.)
- [x] Tabella output con: method, path, params, body, response, auth
- [x] Istruzioni per sequence diagram dei flussi principali
- [x] Almeno 100 righe di contenuto
- [x] Evidence requirements con citazioni file:linea

---

### S5-T4: Prompt UI Detection

#### S5-T4.1: Creare prompts/ui/detect-components.md

| Campo | Valore |
|-------|--------|
| **ID** | S5-T4.1 |
| **Titolo** | Creare prompt per rilevamento componenti React/Vue |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T2.3 |
| **Status** | ✅ completed |

**File da creare:** `prompts/ui/detect-components.md`

**Descrizione:**
Prompt per analisi componenti UI con:
- Rilevamento pattern componenti (functional, class, hooks)
- Estrazione props e types
- Identificazione state management
- Generazione component tree

**Acceptance Criteria:**
- [x] Header `<!-- version=1 -->`
- [x] Sezione istruzioni per React, Vue, Angular
- [x] Tabella output con: name, props, state, events, children
- [x] Istruzioni per class diagram dei componenti
- [x] Almeno 100 righe di contenuto
- [x] Evidence requirements con citazioni file:linea

---

### S5-T5: Prompt Auth Detection

#### S5-T5.1: Creare prompts/auth/detect-auth.md

| Campo | Valore |
|-------|--------|
| **ID** | S5-T5.1 |
| **Titolo** | Creare prompt per rilevamento flussi autenticazione |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T2.3 |
| **Status** | ✅ completed |

**File da creare:** `prompts/auth/detect-auth.md`

**Descrizione:**
Prompt per analisi autenticazione con:
- Rilevamento provider (JWT, OAuth, Session)
- Estrazione middleware auth
- Identificazione protezione route
- Generazione security flow

**Acceptance Criteria:**
- [x] Header `<!-- version=1 -->`
- [x] Sezione istruzioni per JWT, Passport, NextAuth, Auth0
- [x] Tabella output con: provider, strategy, protected_routes, token_lifetime
- [x] Istruzioni per sequence diagram flusso login/logout
- [x] Sezione security considerations
- [x] Almeno 100 righe di contenuto

---

### S5-T6: Prompt Data Detection

#### S5-T6.1: Creare prompts/data/detect-schema.md

| Campo | Valore |
|-------|--------|
| **ID** | S5-T6.1 |
| **Titolo** | Creare prompt per rilevamento schema database |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T2.3 |
| **Status** | ✅ completed |

**File da creare:** `prompts/data/detect-schema.md`

**Descrizione:**
Prompt per analisi database/ORM con:
- Rilevamento modelli (Prisma, TypeORM, Mongoose)
- Estrazione relazioni tra entità
- Identificazione indici e constraints
- Generazione ERD

**Acceptance Criteria:**
- [x] Header `<!-- version=1 -->`
- [x] Sezione istruzioni per Prisma, TypeORM, Mongoose, Drizzle
- [x] Tabella output con: entity, fields, relations, indexes
- [x] Istruzioni per ERD diagram
- [x] Sezione migration analysis
- [x] Almeno 100 righe di contenuto

---

### S5-T7: Prompt Feature Spec

#### S5-T7.1: Creare prompts/feature/spec-from-task.md

| Campo | Valore |
|-------|--------|
| **ID** | S5-T7.1 |
| **Titolo** | Creare prompt per generazione spec da task/issue |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T2.3 |
| **Status** | ✅ completed |

**File da creare:** `prompts/feature/spec-from-task.md`

**Descrizione:**
Prompt per generazione specifica da descrizione task con:
- Analisi requisiti impliciti
- Identificazione componenti coinvolti
- Generazione acceptance criteria
- Link a spec esistenti

**Acceptance Criteria:**
- [x] Header `<!-- version=1 -->`
- [x] Input: task description, context from previous analysis
- [x] Output: user stories, acceptance criteria, tech requirements
- [x] Sezione affected components con link edges
- [x] Istruzioni per flowchart implementazione
- [x] Almeno 80 righe di contenuto

---

#### S5-T7.2: Aggiornare prompts/_registry.json con nuovi prompt

| Campo | Valore |
|-------|--------|
| **ID** | S5-T7.2 |
| **Titolo** | Aggiungere definizioni per 5 nuovi prompt in registry |
| **Tipo** | enhancement |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S5-T3.1, S5-T4.1, S5-T5.1, S5-T6.1, S5-T7.1 |
| **Status** | ✅ completed |

**File:** `prompts/_registry.json`

**Descrizione:**
Aggiungere le 5 nuove definizioni prompt con metadata completi.

**Acceptance Criteria:**
- [x] `api/detect-endpoints` con diagrams: ['sequence']
- [x] `ui/detect-components` con diagrams: ['classDiagram', 'flowchart']
- [x] `auth/detect-auth` con diagrams: ['sequence', 'stateDiagram']
- [x] `data/detect-schema` con diagrams: ['erd']
- [x] `feature/spec-from-task` con diagrams: ['flowchart']
- [x] Tutte le dipendenze correttamente definite
- [x] Priority e optional corretti

---

### Riepilogo Sprint 5

| Task ID | Titolo | Effort | Parallelizzabile |
|---------|--------|--------|------------------|
| S5-T1.1 | Tipi Diagram | 1h | ✅ |
| S5-T1.2 | DiagramGenerator scaffolding | 1h | ✅ |
| S5-T1.3 | generateERD() | 1.5h | ✅ (dopo S5-T1.2) |
| S5-T1.4 | generateSequence() | 1.5h | ✅ (dopo S5-T1.2) |
| S5-T1.5 | generateFlowchart() | 1.5h | ✅ (dopo S5-T1.2) |
| S5-T1.6 | generateClass + State | 2h | ✅ (dopo S5-T1.2) |
| S5-T1.7 | generate() main | 1h | - |
| S5-T1.8 | generateC4() | 1.5h | ✅ (dopo S5-T1.2) |
| S5-T2.1 | Inline integration | 1.5h | ✅ |
| S5-T2.2 | Standalone .mmd files | 1.5h | - |
| S5-T2.3 | Test DiagramGenerator | 2h | ✅ |
| S5-T3.1 | api/detect-endpoints.md | 2h | ✅ |
| S5-T4.1 | ui/detect-components.md | 2h | ✅ |
| S5-T5.1 | auth/detect-auth.md | 2h | ✅ |
| S5-T6.1 | data/detect-schema.md | 2h | ✅ |
| S5-T7.1 | feature/spec-from-task.md | 2h | ✅ |
| S5-T7.2 | Update _registry.json | 1h | - |

**Effort Totale Sprint 5:** ~27h
**Con Parallelizzazione:** ~12h

### Waves di Esecuzione Parallela (Sprint 5)

| Wave | Tasks | Effort |
|------|-------|--------|
| 1 | S5-T1.1 | 1h |
| 2 | S5-T1.2 | 1h |
| 3 | S5-T1.3, S5-T1.4, S5-T1.5, S5-T1.6, S5-T1.8 | 2h (parallelo) |
| 4 | S5-T1.7 | 1h |
| 5 | S5-T2.1, S5-T2.3 | 2h (parallelo) |
| 6 | S5-T2.2, S5-T3.1, S5-T4.1, S5-T5.1, S5-T6.1, S5-T7.1 | 2h (parallelo) |
| 7 | S5-T7.2 | 1h |

---

## 📋 SPRINT 6: CLI & Validation (DETTAGLIO ATOMICO)

**Status:** 🟡 IN PROGRESS
**Goal:** CLI v2.1.0, Test E2E, Validazione Manifest, Documentazione
**Effort Totale:** ~22h (effettivo ~11h con parallelizzazione)
**Dipendenze:** Sprint 5 (DiagramGenerator, Prompt Library) ✅

### Grafo Dipendenze Sprint 6

```
S6-T1.1 (CLI types) ──────────────────────────────────────────────────────────┐
          │                                                                    │
          ▼                                                                    │
S6-T1.2 (CLI module scaffolding)                                              │
          │                                                                    │
          ├──► S6-T1.3 (flag --smart-dag) ────────────┐                       │
          │                                            │                       │
          ├──► S6-T1.4 (flag --diagrams) ─────────────┼──► S6-T1.6 (index.ts) │
          │                                            │         │             │
          └──► S6-T1.5 (flag --template) ─────────────┘         │             │
                                                                 │             │
S6-T2.1 (test fixture repo) ◄────────────────────────────────────┤             │
          │                                                      │             │
          ├──► S6-T2.2 (E2E analyze) ────────┐                   │             │
          │                                   │                   │             │
          ├──► S6-T2.3 (E2E DAG + diagrams) ──┼──► S6-T2.5 (E2E validation)   │
          │                                   │         │         │             │
          └──► S6-T2.4 (E2E write) ──────────┘         │         │             │
                                                        │         │             │
S6-T3.1 (manifest-validator) ◄──────────────────────────┼─────────┘             │
          │                                             │                       │
          ▼                                             │                       │
S6-T3.2 (integrate in SubmoduleManager) ◄───────────────┘                       │
          │                                                                      │
          ▼                                                                      │
S6-T3.3 (test manifest validation) ◄────────────────────────────────────────────┘
          │
          ▼
S6-T4.1 (README update) ─────┬──► S6-T4.2 (CLI help text)
                             │
S6-T4.3 (CHANGELOG update) ──┘
```

---

### S6-T1: CLI Update per v2.1.0

#### S6-T1.1: Definire tipi CLI Options

| Campo | Valore |
|-------|--------|
| **ID** | S6-T1.1 |
| **Titolo** | Aggiungere tipi CLIOptions, AnalyzeOptions, GenerateOptions a types.ts |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | - |
| **Status** | ✅ completed |

**File:** `src/types.ts`

**Descrizione:**
Aggiungere le interfacce per le opzioni CLI v2.1.0:
```typescript
export interface CLIBaseOptions {
    verbose?: boolean;
    dryRun?: boolean;
    outputDir?: string;
}

export interface AnalyzeOptions extends CLIBaseOptions {
    smartDag?: boolean;         // Use SmartDAGPlanner
    diagrams?: 'inline' | 'standalone' | 'both' | 'none';
    template?: string;          // Template ID to use
    skipAgents?: string[];      // Agent IDs to skip
    features?: string[];        // Force feature flags
}

export interface GenerateOptions extends CLIBaseOptions {
    type: 'api' | 'component' | 'entity' | 'feature';
    name: string;
    template?: string;
}
```

**Acceptance Criteria:**
- [ ] `CLIBaseOptions` con verbose, dryRun, outputDir
- [ ] `AnalyzeOptions` con smartDag, diagrams, template, skipAgents, features
- [ ] `GenerateOptions` con type, name, template
- [ ] Export corretto di tutti i nuovi tipi

---

#### S6-T1.2: Creare modulo src/core/cli.ts

| Campo | Valore |
|-------|--------|
| **ID** | S6-T1.2 |
| **Titolo** | Creare modulo CLI separato con parsing argomenti |
| **Tipo** | feature |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T1.1 |
| **Status** | 🔵 pending |

**File da creare:** `src/core/cli.ts`

**Descrizione:**
```typescript
export interface ParsedArgs {
    command: 'analyze' | 'generate' | 'validate' | 'help';
    options: AnalyzeOptions | GenerateOptions | CLIBaseOptions;
}

export function parseArgs(args: Record<string, any>): ParsedArgs {
    // Parse and validate CLI arguments
}

export function validateOptions(options: any, schema: 'analyze' | 'generate'): boolean {
    // Validate options against expected schema
}

export function getDefaultOptions(command: string): CLIBaseOptions {
    // Return sensible defaults
}
```

**Acceptance Criteria:**
- [ ] File `src/core/cli.ts` creato ed esportato
- [ ] `parseArgs()` riconosce tutti i flag v2.1.0
- [ ] `validateOptions()` verifica tipi e valori
- [ ] `getDefaultOptions()` ritorna defaults ragionevoli
- [ ] TypeScript compila senza errori

---

#### S6-T1.3: Implementare flag --smart-dag

| Campo | Valore |
|-------|--------|
| **ID** | S6-T1.3 |
| **Titolo** | Aggiungere supporto per --smart-dag / --no-smart-dag |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T1.2 |
| **Status** | 🔵 pending |

**File:** `src/core/cli.ts`, `src/agents/core/orchestrator.agent.ts`

**Descrizione:**
Implementare flag per abilitare/disabilitare SmartDAGPlanner:
- `--smart-dag` (default true): Usa SmartDAGPlanner per selezione dinamica agenti
- `--no-smart-dag`: Usa DAG statico legacy

**Acceptance Criteria:**
- [ ] Flag `--smart-dag` parsato correttamente
- [ ] Orchestrator rispetta flag smartDag
- [ ] Default è `true` per v2.1.0
- [ ] Backward compatible con chiamate senza flag

---

#### S6-T1.4: Implementare flag --diagrams

| Campo | Valore |
|-------|--------|
| **ID** | S6-T1.4 |
| **Titolo** | Aggiungere supporto per --diagrams [inline|standalone|both|none] |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T1.2 |
| **Status** | 🔵 pending |

**File:** `src/core/cli.ts`, `src/agents/generic-analysis.agent.ts`

**Descrizione:**
Implementare flag per controllare output diagrammi:
- `--diagrams inline`: Solo diagrammi inline nel markdown
- `--diagrams standalone`: Solo file .mmd separati
- `--diagrams both` (default): Entrambi
- `--diagrams none`: Nessun diagramma

**Acceptance Criteria:**
- [ ] Flag `--diagrams` parsato con enum validation
- [ ] GenericAnalysisAgent rispetta opzione
- [ ] WriteSpecsAgent rispetta opzione per standalone
- [ ] Default è `both`

---

#### S6-T1.5: Implementare flag --template

| Campo | Valore |
|-------|--------|
| **ID** | S6-T1.5 |
| **Titolo** | Aggiungere supporto per --template [templateId] |
| **Tipo** | feature |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T1.2 |
| **Status** | 🔵 pending |

**File:** `src/core/cli.ts`, `src/agents/generic-analysis.agent.ts`

**Descrizione:**
Implementare flag per override template:
- `--template api/endpoint`: Forza uso di template specifico
- Validazione che template esista

**Acceptance Criteria:**
- [ ] Flag `--template` parsato correttamente
- [ ] Validazione esistenza template
- [ ] Override funziona in GenericAnalysisAgent
- [ ] Error message chiaro se template non esiste

---

#### S6-T1.6: Integrare CLI in index.ts

| Campo | Valore |
|-------|--------|
| **ID** | S6-T1.6 |
| **Titolo** | Integrare CLI in index.ts |
| **Tipo** | enhancement |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T1.3, S6-T1.4, S6-T1.5 |
| **Status** | 🔵 pending |


**File:** `src/index.ts`

**Descrizione:**
Aggiornare i tool definitions per supportare nuovi flag:
```typescript
'repo_spec_zero_analyze': {
    args: {
        // ... existing args ...
        smartDag: z.boolean().describe('Use SmartDAGPlanner for dynamic agent selection').optional(),
        diagrams: z.enum(['inline', 'standalone', 'both', 'none']).describe('Diagram output mode').optional(),
        template: z.string().describe('Template ID to use for output').optional(),
        skipAgents: z.array(z.string()).describe('Agent IDs to skip').optional(),
    },
    // ...
}
```

**Acceptance Criteria:**
- [ ] Tool `repo_spec_zero_analyze` espone nuovi args
- [ ] Args passati correttamente all'orchestrator
- [ ] Backward compatible (vecchie chiamate funzionano)
- [ ] Version bumped a 2.1.0 nel toast

---

### S6-T2: Test Integrazione End-to-End

#### S6-T2.1: Creare fixture repository di test

| Campo | Valore |
|-------|--------|
| **ID** | S6-T2.1 |
| **Titolo** | Creare test/__fixtures__/sample-fullstack-repo/ |
| **Tipo** | test |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | - |
| **Status** | ✅ completed |

**Directory da creare:** `test/__fixtures__/sample-fullstack-repo/`

**Descrizione:**
Creare un mini-repo fullstack di esempio per testing E2E:
```
sample-fullstack-repo/
├── package.json          # Express + React deps
├── src/
│   ├── server/
│   │   ├── index.ts      # Express entry
│   │   ├── routes/
│   │   │   └── users.ts  # Sample REST routes
│   │   └── models/
│   │       └── User.ts   # Sample Prisma model
│   └── client/
│       ├── App.tsx       # React app
│       └── components/
│           └── UserList.tsx
├── prisma/
│   └── schema.prisma     # Sample schema
└── .env.example          # Sample env
```

**Acceptance Criteria:**
- [ ] Fixture creata con struttura fullstack
- [ ] package.json con deps rilevanti (Express, React, Prisma)
- [ ] Almeno 5 file di codice significativi
- [ ] Gitignored (non committare .env)

---

#### S6-T2.2: Test E2E: FeatureDetector -> SmartDAGPlanner

| Campo | Valore |
|-------|--------|
| **ID** | S6-T2.2 |
| **Titolo** | Test E2E pipeline analysis (detect -> plan) |
| **Tipo** | test |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T2.1 |
| **Status** | 🔵 pending |

**File da creare:** `test/e2e/analysis-pipeline.e2e.test.ts`

**Descrizione:**
Test E2E che verifica:
1. FeatureDetector rileva correttamente features del sample repo
2. SmartDAGPlanner genera DAG appropriato
3. Agenti corretti selezionati (backend + frontend + db)

**Acceptance Criteria:**
- [ ] Test rileva repoType='fullstack'
- [ ] Test verifica features: hasBackend, hasFrontend, hasDatabase
- [ ] Test verifica DAG include agenti corretti
- [ ] Test verifica ordine layer corretto

---

#### S6-T2.3: Test E2E: DAG Execution -> DiagramGenerator

| Campo | Valore |
|-------|--------|
| **ID** | S6-T2.3 |
| **Titolo** | Test E2E pipeline execution (DAG -> diagrams) |
| **Tipo** | test |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T2.1 |
| **Status** | 🔵 pending |

**File:** `test/e2e/analysis-pipeline.e2e.test.ts`

**Descrizione:**
Test E2E che verifica:
1. DAGExecutor esegue agenti in ordine corretto
2. GenericAnalysisAgent genera output con diagrammi
3. DiagramGenerator produce Mermaid valido

**Acceptance Criteria:**
- [ ] Test verifica esecuzione layer 0 prima di layer 1
- [ ] Test verifica output contiene diagrammi Mermaid
- [ ] Test verifica almeno 1 ERD generato per entities
- [ ] Test verifica almeno 1 sequence diagram per API flow

---

#### S6-T2.4: Test E2E: WriteSpecs -> Filesystem

| Campo | Valore |
|-------|--------|
| **ID** | S6-T2.4 |
| **Titolo** | Test E2E pipeline output (write -> verify structure) |
| **Tipo** | test |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T2.1 |
| **Status** | 🔵 pending |

**File:** `test/e2e/analysis-pipeline.e2e.test.ts`

**Descrizione:**
Test E2E che verifica:
1. WriteSpecsAgent scrive file nella struttura corretta
2. Struttura gerarchica 00-07 creata
3. File .mmd standalone in _diagrams/
4. index.md generato con link corretti

**Acceptance Criteria:**
- [ ] Test verifica creazione `_generated/00-foundation/`
- [ ] Test verifica creazione `_generated/_diagrams/`
- [ ] Test verifica contenuto file spec valido
- [ ] Test verifica link in index.md funzionanti

---

#### S6-T2.5: Test E2E: Full Pipeline Validation

| Campo | Valore |
|-------|--------|
| **ID** | S6-T2.5 |
| **Titolo** | Test E2E validazione completa pipeline |
| **Tipo** | test |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T2.2, S6-T2.3, S6-T2.4 |
| **Status** | 🔵 pending |

**File:** `test/e2e/analysis-pipeline.e2e.test.ts`

**Descrizione:**
Test E2E che esegue pipeline completa e valida risultato:
1. Chiama analyze su sample repo
2. Verifica tutti i file generati
3. Valida manifest v2.1 corretto
4. Verifica nessun errore/warning

**Acceptance Criteria:**
- [ ] Test passa con sample-fullstack-repo
- [ ] Manifest contiene schema_version='2.1'
- [ ] Tutti i file in file_locations esistono
- [ ] Nessun errore in console
- [ ] Tempo esecuzione < 60s (mock LLM)

---

### S6-T3: Validazione Manifest v2.1.0

#### S6-T3.1: Creare manifest-validator.ts

| Campo | Valore |
|-------|--------|
| **ID** | S6-T3.1 |
| **Titolo** | Creare src/core/manifest-validator.ts con JSON Schema |
| **Tipo** | feature |
| **Effort** | 2h |
| **Agent** | coder-backend |
| **Dipendenze** | - |
| **Status** | ✅ completed |

**File da creare:** `src/core/manifest-validator.ts`

**Descrizione:**
Creare validatore con JSON Schema per manifest v2.1:
```typescript
import Ajv from 'ajv';

const MANIFEST_SCHEMA_V21 = {
    type: 'object',
    required: ['schema_version', 'project_slug', 'repo_path', 'files'],
    properties: {
        schema_version: { enum: ['2.0', '2.1'] },
        folder_structure_version: { enum: ['1.0', '2.0'] },
        structure_hash: { type: 'string', pattern: '^[a-f0-9]{8}$' },
        file_locations: { type: 'object' },
        // ... altri campi
    }
};

export class ManifestValidator {
    validate(manifest: any): ValidationResult;
    validateFileLocations(manifest: any, specsPath: string): ValidationResult;
    repairManifest(manifest: any): SpecsManifest;
}
```

**Acceptance Criteria:**
- [ ] Schema JSON valido per manifest v2.1
- [ ] `validate()` ritorna errori dettagliati
- [ ] `validateFileLocations()` verifica file esistono
- [ ] `repairManifest()` corregge problemi comuni
- [ ] Supporto backward compatibility v2.0

---

#### S6-T3.2: Integrare validazione in SubmoduleManager

| Campo | Valore |
|-------|--------|
| **ID** | S6-T3.2 |
| **Titolo** | Aggiungere validazione manifest a readManifest/writeManifest |
| **Tipo** | enhancement |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T3.1 |
| **Status** | 🔵 pending |

**File:** `src/skills/submodule-manager.skill.ts`

**Descrizione:**
Integrare validazione:
- `readManifest()`: Valida dopo lettura, log warning se problemi
- `writeManifest()`: Valida prima di scrittura, blocca se invalido

**Acceptance Criteria:**
- [ ] `readManifest()` valida e logga warning
- [ ] `writeManifest()` blocca scrittura manifest invalido
- [ ] Error message chiaro con campo/valore errato
- [ ] Nessuna regressione su manifest v2.0 esistenti

---

#### S6-T3.3: Test suite ManifestValidator

| Campo | Valore |
|-------|--------|
| **ID** | S6-T3.3 |
| **Titolo** | Unit test per ManifestValidator |
| **Tipo** | test |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T3.1, S6-T3.2 |
| **Status** | 🔵 pending |

**File da creare:** `src/core/manifest-validator.test.ts`

**Acceptance Criteria:**
- [ ] Almeno 10 test cases
- [ ] Test manifest valido v2.1
- [ ] Test manifest valido v2.0 (backward compat)
- [ ] Test manifest invalido (missing fields)
- [ ] Test validateFileLocations con file mancanti
- [ ] Coverage > 80%

---

### S6-T4: Documentazione

#### S6-T4.1: Update README.md

| Campo | Valore |
|-------|--------|
| **ID** | S6-T4.1 |
| **Titolo** | Aggiornare README con nuove feature v2.1.0 |
| **Tipo** | docs |
| **Effort** | 1.5h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T1.6 |
| **Status** | 🔵 pending |

**File:** `README.md`

**Descrizione:**
Aggiornare README con:
- Sezione "What's New in v2.1.0"
- Nuovi flag CLI documentati
- Esempi output gerarchico
- Sezione diagrammi Mermaid

**Acceptance Criteria:**
- [ ] Versione aggiornata a 2.1.0
- [ ] Sezione "What's New" con changelog
- [ ] Documentazione tutti i nuovi flag
- [ ] Screenshot/esempio output structure
- [ ] Sezione diagrammi con esempio Mermaid

---

#### S6-T4.2: Update CLI help text

| Campo | Valore |
|-------|--------|
| **ID** | S6-T4.2 |
| **Titolo** | Aggiornare help text nei tool descriptions |
| **Tipo** | docs |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T1.6 |
| **Status** | 🔵 pending |

**File:** `src/index.ts`

**Descrizione:**
Migliorare descrizioni tool:
- Descrizioni dettagliate per ogni arg
- Esempi nei descriptions
- Defaults documentati

**Acceptance Criteria:**
- [ ] Ogni arg ha description esaustiva
- [ ] Defaults indicati nelle descriptions
- [ ] Almeno 1 esempio per tool principale
- [ ] TypeScript JSDoc aggiornati

---

#### S6-T4.3: Update CHANGELOG.md

| Campo | Valore |
|-------|--------|
| **ID** | S6-T4.3 |
| **Titolo** | Creare/aggiornare CHANGELOG.md per v2.1.0 |
| **Tipo** | docs |
| **Effort** | 1h |
| **Agent** | coder-backend |
| **Dipendenze** | S6-T1.6, S6-T3.2 |
| **Status** | 🔵 pending |

**File da creare/aggiornare:** `CHANGELOG.md`

**Descrizione:**
Documentare tutti i cambiamenti v2.1.0:
- Features aggiunte
- Breaking changes (se presenti)
- Deprecations
- Bug fixes

**Acceptance Criteria:**
- [ ] Formato Keep a Changelog
- [ ] Sezione [2.1.0] con data
- [ ] Categorie: Added, Changed, Deprecated, Fixed
- [ ] Link a PR/issues se disponibili

---

### Riepilogo Sprint 6

| Task ID | Titolo | Effort | Parallelizzabile | Stato |
|---------|--------|--------|------------------|-------|
| S6-T1.1 | Tipi CLI Options | 1h | ✅ | ✅ completed |
| S6-T1.2 | CLI module scaffolding | 1.5h | - | ✅ completed |
| S6-T1.3 | Flag --smart-dag | 1h | ✅ (dopo S6-T1.2) | ✅ completed |
| S6-T1.4 | Flag --diagrams | 1h | ✅ (dopo S6-T1.2) | ✅ completed |
| S6-T1.5 | Flag --template | 1h | ✅ (dopo S6-T1.2) | ✅ completed |
| S6-T1.6 | Integrare CLI in index.ts | 1.5h | - | ✅ completed |
| S6-T2.1 | Test fixture repo | 1.5h | ✅ | ✅ completed |
| S6-T2.2 | E2E analyze | 2h | ✅ (dopo S6-T2.1) | ✅ completed |
| S6-T2.3 | E2E DAG + diagrams | 2h | ✅ (dopo S6-T2.1) | ✅ completed |
| S6-T2.4 | E2E write | 1.5h | ✅ (dopo S6-T2.1) | ✅ completed |
| S6-T2.5 | E2E validation | 2h | - | ✅ completed |
| S6-T3.1 | manifest-validator.ts | 2h | ✅ | ✅ completed |
| S6-T3.2 | Integrate in SubmoduleManager | 1h | - | ✅ completed |
| S6-T3.3 | Test ManifestValidator | 1.5h | ✅ (dopo S6-T3.2) | ✅ completed |
| S6-T4.1 | README update | 1.5h | ✅ | ✅ completed |
| S6-T4.2 | CLI help text | 1h | ✅ | ✅ completed |
| S6-T4.3 | CHANGELOG update | 1h | ✅ | ✅ completed |

**Effort Totale Sprint 6:** ~24h
**Con Parallelizzazione:** ~11h

### Waves di Esecuzione Parallela (Sprint 6)

| Wave | Tasks | Effort |
|------|-------|--------|
| 1 | S6-T1.1, S6-T2.1, S6-T3.1 | 2h (parallelo) |
| 2 | S6-T1.2 | 1.5h |
| 3 | S6-T1.3, S6-T1.4, S6-T1.5, S6-T2.2, S6-T2.3, S6-T2.4 | 2h (parallelo) |
| 4 | S6-T1.6, S6-T3.2 | 1.5h (parallelo) |
| 5 | S6-T2.5, S6-T3.3 | 2h (parallelo) |
| 6 | S6-T4.1, S6-T4.2, S6-T4.3 | 1.5h (parallelo) |

---

## 📈 Dipendenze tra Sprint

```
SPRINT 1 (Foundation) ─────────────────────────────────────┐
                                                           │
SPRINT 2 (Prompt Registry) ───┬──→ SPRINT 3 (DAG) ───┐     │
                              │                       │     │
                              │                       ▼     ▼
                              └──────────────→ SPRINT 4 (Agent + Templates)
                                                      │
                                                      ▼
                                              SPRINT 5 (Diagrams + Prompts)
                                                      │
                                                      ▼
                                              SPRINT 6 (CLI + Validation)
```

---

## 🔄 Changelog

| Data | Sprint | Azione | Note |
|------|--------|--------|------|
| 2026-01-16 | - | Creazione SPRINT.md | Piano iniziale da ARCHITECTURE_v2.1.0 e UPGRADE_PLAN |
| 2026-01-16 | S1, S2 | Decomposizione atomica | 26 subtask create con acceptance criteria |
| 2026-01-16 | S3 | /start-sprint S3 | Sprint 3 iniziato, 18 subtask atomiche aggiunte |
| 2026-01-16 | S3 | Sprint 3 COMPLETATO | FeatureDetector, SmartDAGPlanner, DAGExecutor skip, 22 test |
| 2026-01-16 | S4 | /start-sprint S4 | Sprint 4 iniziato, 17 subtask atomiche aggiunte |
| 2026-01-16 | S4 | Task S4-T1.1, S4-T2.1 COMPLETATI | Aggiunti tipi Template e GenericAgent in types.ts |
| 2026-01-16 | S4 | Sprint 4 COMPLETATO | TemplateLoader, GenericAnalysisAgent, 5 template, 51 test totali |
| 2026-01-16 | S5 | /start-sprint S5 | Sprint 5 iniziato, 17 subtask atomiche aggiunte (S5-T1.1 a S5-T7.2) |
| 2026-01-17 | S5 | Wave 3 COMPLETATO | Implementati generatori Mermaid (ERD, Sequence, Flowchart, Class, State, C4) in DiagramGenerator |
| 2026-01-17 | S5 | S5-T2.1, S5-T2.3 COMPLETATI | Integrato DiagramGenerator in GenericAnalysisAgent e aggiunti 12 unit test |
| 2026-01-17 | S5 | Sprint 5 COMPLETATO | DiagramGenerator, 5 prompt specializzati, registry aggiornato, 75 test totali |
| 2026-01-17 | S6 | /start-sprint S6 | Sprint 6 iniziato (CLI & Validation), 17 subtask atomiche aggiunte (S6-T1.1 a S6-T4.3) |
| 2026-01-17 | S6 | Wave 1 INIZIATA | Assegnati S6-T1.1, S6-T2.1, S6-T3.1 |
| 2026-01-17 | S6 | Wave 1 COMPLETATA | Tipi CLI, Fixture repo, Manifest Validator implementati |
| 2026-01-17 | S6 | Sprint 6 COMPLETATO | CLI v2.1.0, E2E pipeline validation, Manifest validation/repair, Docs updated |
| 2026-01-17 | - | UPGRADE v2.1.0 COMPLETATO | Sistema modulare, Smart DAG, Mermaid diagrams, Template system |

## 🚀 Assignments Correnti

### 2026-01-17 11:00 → coder-backend
**Task**: S6-T1.2, S6-T1.3, S6-T1.4, S6-T1.5, S6-T1.6
**Spec**: SPRINT.md
**Commit**: `feat(cli): implement v2.1.0 flags and integrate into index.ts`
**Output**: `src/core/cli.ts`, `src/index.ts`

### 2026-01-17 11:00 → test-writer
**Task**: S6-T2.2, S6-T2.3, S6-T2.4
**Spec**: SPRINT.md
**Commit**: `test(e2e): implement analysis pipeline integration tests`
**Output**: `test/e2e/analysis-pipeline.e2e.test.ts`
**Task**: S6-T1.1, S6-T3.1
**Spec**: SPRINT.md
**Commit**: `feat(cli): add CLI options types`, `feat(core): implement manifest validator`
**Output**: `src/types.ts`, `src/core/manifest-validator.ts`

### 2026-01-17 10:00 → test-writer
**Task**: S6-T2.1
**Spec**: SPRINT.md
**Commit**: `test(fixture): add sample-fullstack-repo for E2E`
**Output**: `test/__fixtures__/sample-fullstack-repo/`

---

## 📎 Riferimenti

- [ARCHITECTURE_v2.1.0.md](./docs/ARCHITECTURE_v2.1.0.md)
- [UPGRADE_PLAN_v2.1.0.md](./docs/UPGRADE_PLAN_v2.1.0.md)

---

> **Nota:** Questo file è la fonte di verità per lo stato del progetto.
> Aggiornare dopo ogni completamento task o cambio di stato.

## 🏁 Post-Sprint Improvements (2026-01-17)

### Quality Improvements v2.1.0-patch1

| Task ID | Titolo | Status | Descrizione |
|---------|--------|--------|-------------|
| Q-T1 | DiagramGenerator Extraction | ✅ | Migliorata estrazione blocchi mermaid e salvataggio standalone |
| Q-T2 | Professional Summary Prompt | ✅ | Refactoring summary agent per executive summary strutturato |
| Q-T3 | Mermaid Sanitization | ✅ | Implementata funzione sanitizeMermaid per correggere errori comuni |

**Dettagli:**
- Migliorato `DiagramGenerator` per rilevare e validare diagrammi esistenti nell'output LLM.
- `GenericAnalysisAgent` ora salva tutti i diagrammi trovati (anche extra) in `_diagrams/`.
- Aggiornato `getSummarySystemContext` per imporre una struttura professionale (Summary, Findings, Tech Stack, Architecture, Next Steps).
- Aggiunta pulizia automatica di errori comuni di sintassi Mermaid (es. `--|->`, `--\>`, activation/deactivation spacing).
