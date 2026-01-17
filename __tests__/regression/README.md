# Regression Test Suite Documentation

**Task ID**: T-REGRESSION-001, T-REGRESSION-002, T-REGRESSION-003  
**Author**: TEST-WRITER (Dev Swarm)  
**Date**: 2026-01-17  
**Status**: ✅ Ready for Execution

---

## 📋 Overview

Suite di test di regressione progettata per verificare:

1. **Orchestrator → GenericAnalysisAgent Instantiation**
2. **SmartDAGPlanner → SPEC-OS Edge Integrity**
3. **PromptRegistry → Metadata Extraction**

---

## 🎯 Obiettivi

### T-REGRESSION-001: Orchestrator Instantiation

**File**: `__tests__/regression/orchestrator-generic-agent-instantiation.test.ts`

**Obiettivo**: Verificare che l'Orchestrator istanzi correttamente `GenericAnalysisAgent` per ogni nodo del DAG pianificato da `SmartDAGPlanner`.

**Test Scenarios**:

| Scenario | Descrizione | Tipo |
|----------|-------------|------|
| `should instantiate GenericAnalysisAgent for each non-core PlannedAgent` | Verifica creazione istanze per ogni nodo DAG | Happy Path |
| `should correctly pass PlannedAgent config to instances` | Verifica passaggio configurazione corretta | Happy Path |
| `should NOT re-instantiate core agents` | Verifica che bootstrap, summary, write_specs non siano ricreati | Happy Path |
| `should register agents in agentMap with correct IDs` | Verifica mappatura ID → istanza | Happy Path |
| `should inherit skills from Orchestrator` | Verifica eredità skills | Happy Path |
| `should skip agents when explicitly requested` | Verifica logica skipAgents | Edge Case |
| `should apply template overrides from params` | Verifica override template | Edge Case |
| `should handle missing PromptRouter gracefully` | Verifica gestione errori | Error Handling |
| `should continue execution if one agent fails` | Verifica resilienza | Error Handling |
| `should respect PlannedAgent dependencies` | Verifica ordine esecuzione | DAG Structure |
| `should convert PlannedDAG to DAGDefinition correctly` | Verifica conversione struttura | DAG Structure |

**Coverage Target**: 100% happy path, edge cases, error handling

---

### T-REGRESSION-002: Edge Integrity

**File**: `__tests__/regression/smart-dag-planner-edge-integrity.test.ts`

**Obiettivo**: Verificare che i link SPEC-OS (edges) rimangano integri dopo il cambio di ID (es. da 'entity' a 'entities').

**Critical Points**:
- Agent ID consistency: `PlannedAgent.id` MUST match edges UIDs
- Dependency mapping: `PlannedAgent.dependencies` MUST resolve to valid agent IDs
- Output file mapping: Agent ID → output file path must be consistent
- Edge format: `"uid:${agentId}:type"` where `agentId` is the `PlannedAgent.id`

**Test Scenarios**:

| Scenario | Descrizione | Tipo |
|----------|-------------|------|
| `should use "entities" (not "entity") as PlannedAgent ID` | Verifica ID corretto per entities | Happy Path |
| `should have consistent dependencies pointing to "entities"` | Verifica dipendenze usano ID nuovo | Happy Path |
| `should resolve all dependencies to existing agent IDs` | Verifica che tutte le dipendenze esistano | Happy Path |
| `should map agent IDs correctly to output files` | Verifica mapping ID → file path | Happy Path |
| `should resolve "*" dependencies correctly` | Verifica wildcard dependencies | Edge Case |
| `should only include non-optional agents in wildcard` | Verifica filtro optional agents | Edge Case |
| `should handle backend-modules and frontend-modules correctly` | Verifica aliases moduli | Edge Case |
| `should use correct IDs for API agents` | Verifica ID api-rest, api-graphql | Edge Case |
| `should pass validateDAG for all dependencies` | Verifica validazione DAG | Validation |
| `should detect missing dependencies if IDs inconsistent` | Verifica rilevamento errori | Validation |
| `should not have circular dependencies` | Verifica no circolarità | Validation |
| `should generate consistent output paths for all agents` | Verifica percorsi output | Consistency |

**Coverage Target**: 100% agent ID mapping, edge integrity, DAG validation

---

### T-REGRESSION-003: Metadata Extraction

**File**: `__tests__/regression/prompt-registry-metadata-extraction.test.ts`

**Obiettivo**: Verificare che i metadati (version, hash) siano estratti correttamente dai nuovi prompt nel registry.

**Critical Points**:
- Version extraction regex: `/^\s*<!--\s*version[=:]\s*(\d+)\s*-->/`
- Hash calculation: `MD5(rawContent).slice(0, 8)`
- Content stripping: remove version line from output
- Metadata flow: `PromptRegistry` → `RoutedPrompt` → `GenericAgentOutput` → SPEC-OS frontmatter

**Test Scenarios**:

| Scenario | Descrizione | Tipo |
|----------|-------------|------|
| `should extract version from HTML comment format` | Verifica estrazione da `<!-- version=1 -->` | Happy Path |
| `should extract version from all registered prompts` | Verifica tutti i prompt hanno version | Happy Path |
| `should default to version "1" if not specified` | Verifica default version | Happy Path |
| `should calculate MD5 hash of raw content` | Verifica calcolo hash | Happy Path |
| `should produce different hashes for different prompts` | Verifica unicità hash | Happy Path |
| `should produce same hash for same content` | Verifica idempotenza | Happy Path |
| `should strip version HTML comment from content` | Verifica rimozione metadata | Happy Path |
| `should strip version plain text from content` | Verifica rimozione versione plain | Happy Path |
| `should preserve actual content after stripping` | Verifica contenuto preservato | Happy Path |
| `should return LoadedPromptV2 with all required fields` | Verifica struttura output | Happy Path |
| `should include PromptDefinition from registry` | Verifica definizione prompt | Happy Path |
| `should cache loaded prompts` | Verifica cache | Edge Case |
| `should clear cache when clearCache() is called` | Verifica clear cache | Edge Case |
| `should reload definitions when reload() is called` | Verifica reload | Edge Case |
| `should throw error for non-existent prompt ID` | Verifica gestione errori | Error Handling |
| `should provide metadata for PromptVersion` | Verifica integrazione GenericAgent | Integration |
| `should format metadata for SPEC-OS frontmatter` | Verifica formato frontmatter | Integration |
| `should include all metadata fields for RoutedPrompt` | Verifica metadata routing | Integration |
| `should load all prompts from _registry.json` | Verifica caricamento registry | Registry |
| `should have correct categories for prompts` | Verifica categorie | Registry |
| `should have bootstrap as highest priority` | Verifica priorità | Registry |
| `should find applicable prompts for backend repo` | Verifica findApplicable | Registry |
| `should filter out prompts with missing features` | Verifica filtro features | Registry |
| `should respect dependencies` | Verifica dipendenze prompt | Registry |
| `should sort by priority descending` | Verifica ordinamento | Registry |

**Coverage Target**: 100% metadata extraction, cache behavior, integration flow

---

## 📊 Test Statistics

| File | Test Count | Categories | Assertions |
|------|-----------|------------|------------|
| orchestrator-generic-agent-instantiation.test.ts | 11 | 4 | ~40 |
| smart-dag-planner-edge-integrity.test.ts | 12 | 5 | ~50 |
| prompt-registry-metadata-extraction.test.ts | 24 | 7 | ~80 |
| **TOTAL** | **47** | **16** | **~170** |

---

## 🏗️ Test Structure

Tutti i test seguono il pattern **Arrange-Act-Assert**:

```typescript
describe('[Component/Feature]', () => {
  describe('[Scenario Category]', () => {
    it('should [behavior] when [condition]', () => {
      // Arrange
      const mockData = createMockData();
      
      // Act
      const result = component.method(mockData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
```

---

## 🔧 Setup & Execution

### Prerequisites

```bash
npm install
```

### Run All Regression Tests

```bash
npm test __tests__/regression
```

### Run Individual Test Suites

```bash
# Orchestrator instantiation tests
npm test __tests__/regression/orchestrator-generic-agent-instantiation.test.ts

# Edge integrity tests
npm test __tests__/regression/smart-dag-planner-edge-integrity.test.ts

# Metadata extraction tests
npm test __tests__/regression/prompt-registry-metadata-extraction.test.ts
```

### Watch Mode

```bash
npm test -- --watch __tests__/regression
```

---

## 🎨 Test Categories

### 1. Happy Path
Test che verificano il comportamento corretto in condizioni normali.

### 2. Edge Cases
Test che verificano comportamenti ai limiti (wildcard, aliases, cache).

### 3. Error Handling
Test che verificano la gestione degli errori.

### 4. Validation
Test che verificano la validazione dei dati (DAG, dependencies).

### 5. Integration
Test che verificano l'integrazione tra componenti.

### 6. Consistency
Test che verificano la consistenza dei dati (ID, paths, hashes).

---

## 📝 Test Naming Convention

```typescript
describe('Regression: [Component] → [Feature]', () => {
  describe('[Category]: [Scenario Group]', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test implementation
    });
  });
});
```

**Esempi**:
- `should instantiate GenericAnalysisAgent for each non-core PlannedAgent`
- `should use "entities" (not "entity") as PlannedAgent ID`
- `should extract version from HTML comment format`

---

## 🔍 Coverage Reports

Dopo l'esecuzione, verifica la copertura:

```bash
npm test -- --coverage __tests__/regression
```

**Target Coverage**:
- Statements: 100%
- Branches: 95%+
- Functions: 100%
- Lines: 100%

---

## 🚨 Known Issues & Limitations

### Orchestrator Tests
- **Limitation**: Non possiamo verificare direttamente le istanze di `GenericAnalysisAgent` create dinamicamente senza spy invasivi
- **Workaround**: Verifichiamo l'esecuzione tramite `dagSummary.results`

### Edge Integrity Tests
- **Limitation**: Non possiamo testare il formato esatto degli edge YAML senza eseguire l'intera pipeline
- **Workaround**: Verifichiamo la consistenza degli ID nel DAG

### Metadata Tests
- **Limitation**: Non possiamo modificare i file prompt per testare tutte le varianti di version format
- **Workaround**: Verifichiamo il comportamento con i prompt esistenti e simuliamo edge cases

---

## 🎯 Success Criteria

### ✅ Tutti i test passano
- 47/47 test in verde

### ✅ Nessun regression
- ID mapping: `entities` (NOT `entity`)
- Dependencies: tutte risolvono a ID validi
- Metadata: version + hash estratti correttamente

### ✅ Coverage > 95%
- Statements, Branches, Functions, Lines

---

## 📚 References

### Code Files
- `src/agents/core/orchestrator.agent.ts` (lines 196-231)
- `src/core/smart-dag-planner.ts` (lines 80-166, 488-565)
- `src/core/prompt-registry.ts` (lines 100-144, 191-213)
- `src/agents/generic-analysis.agent.ts` (lines 40-121)

### Type Definitions
- `src/types.ts` (PlannedAgent, PlannedDAG, LoadedPromptV2, RoutedPrompt)

### Registry
- `prompts/_registry.json`
- `prompts/analysis/*.md`

---

## 🤝 Handoff to Tester

**Status**: ✅ Test files scritti, ready for execution

**Next Steps**:
1. Esegui `npm test __tests__/regression`
2. Verifica che tutti i 47 test passino
3. Controlla coverage report
4. Se test falliscono, riporta errori con:
   - Nome test fallito
   - Expected vs Actual values
   - Stack trace

**Output Atteso**:
```
Test Suites: 3 passed, 3 total
Tests:       47 passed, 47 total
Snapshots:   0 total
Time:        ~10s
```

---

**Ready for**: Tester (esecuzione e validazione)  
**Commit Message**: `test: add regression suite for orchestrator, dag planner, and prompt registry`
