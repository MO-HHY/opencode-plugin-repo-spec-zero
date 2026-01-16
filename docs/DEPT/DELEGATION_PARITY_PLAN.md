# Delegation/Sub-Agents Parity Plan (vs `opencode-plugin-spec-os`)

## Contesto
Nel plugin `opencode-plugin-spec-os` il flusso “multi-agent + delega” funziona perché:
- ogni agente è esposto come tool (`spec_os_agent_<id>`)
- esiste un tool di routing/delega (`spec_os_delegate`) che usa un `Router` e un `AgentRegistry`
- gli asset “del plugin” (prompt, config, ecc.) non dipendono da `process.cwd()` (quindi funzionano anche quando il plugin gira dentro un repo utente)

In `opencode-plugin-repo-spec-zero` lo “swarm” esiste ma oggi **non raggiunge la stessa integrazione** (né la stessa robustezza runtime quando installato/usato da workspace esterni).

---

## Differenze chiave (verificate)

### 1) Exposure: tool/agent vs orchestrator-only
- `spec-os`: registra agenti e li espone come tool + tool di delega.
  - Ref: `00__Plugin-SPEC-OS/opencode-plugin-spec-os/src/index.ts` (tool factories + `spec_os_delegate`)
  - Ref: `00__Plugin-SPEC-OS/opencode-plugin-spec-os/src/tools/agent-tools.ts` (`createAgentTools`, `createDelegationTool`)
- `repo-spec-zero`: espone quasi solo `repo_spec_zero_analyze` (lo swarm rimane “interno” all’orchestrator).
  - Ref: `00__Plugin-SPEC-OS/opencode-plugin-repo-spec-zero/src/index.ts`

### 2) Delegation/routing primitives
- `spec-os`: `Router` + trigger-based routing + opzionale `preferredAgent`.
  - Ref: `00__Plugin-SPEC-OS/opencode-plugin-spec-os/src/core/router.ts`
- `repo-spec-zero`: topological sort su `contextDeps`, ma **nessun tool di routing** per invocare/indirizzare sotto-agenti dall’esterno.
  - Ref: `00__Plugin-SPEC-OS/opencode-plugin-repo-spec-zero/src/agents/core/orchestrator.agent.ts`

### 3) Prompt path: `process.cwd()` (bug tipico da “install mode”)
- `repo-spec-zero` carica i prompt con `process.cwd()`:
  - Ref: `00__Plugin-SPEC-OS/opencode-plugin-repo-spec-zero/src/agents/spec-zero/base.ts`
- In runtime, `process.cwd()` tende ad essere il repo dell’utente (quello analizzato), non la cartella del plugin:
  - Risultato tipico: **prompt non trovati ⇒ agent falliscono ⇒ swarm “sembra” non funzionare**.

### 4) Output path incoerente (`-spec` vs ` -spec`)
- Orchestrator scrive audit e `specDir` in: ``${projectSlug} -spec`` (con spazio).
  - Ref: `00__Plugin-SPEC-OS/opencode-plugin-repo-spec-zero/src/agents/core/orchestrator.agent.ts`
- I sub-agent scrivono in: ``${projectSlug}-spec`` (senza spazio).
  - Ref: `00__Plugin-SPEC-OS/opencode-plugin-repo-spec-zero/src/agents/spec-zero/base.ts`
- Impatto: output e audit finiscono in cartelle diverse; `specDir` può puntare a una cartella “vuota”.

### 5) “Success” anche con swarm fallito
- L’orchestrator accumula log di errori ma ritorna `success: true` anche se molti agent falliscono.
  - Impatto: UX ingannevole (toast “complete” ma senza spec utile).

---

## Piano di fix (proposto)

### Fase A — Hardening path & output (blocca i bug più comuni)
1. **Introdurre un `pluginRoot` stabile** (no `process.cwd()` per asset del plugin).
   - Strategia consigliata: `fileURLToPath(new URL('../..', import.meta.url))` (o equivalente) + helper `resolvePluginPath(...)`.
   - Applicare a: loader prompt, template installer, eventuali file “embedded”.
2. **Normalizzare l’output dir** (scegliere UNO standard) e usarlo ovunque:
   - `const specDirName = \`\${projectSlug}-spec\`` (o qualsiasi standard, ma unico)
   - aggiornare orchestrator (auditPath + `specDir`) e sub-agent writer.
3. **Creare la struttura output prima dello swarm** (cartelle `analysis/...`, `_meta/`, ecc.).
4. **Fallire “early”** se mancano prerequisiti critici (es. prompt non trovato / nessun LLM skill) con errore esplicito.

### Fase B — Parity con “delegation” di `spec-os`
5. **Esporre tool “agent” per sub-agenti**:
   - `repo_spec_zero_agent_<id>` per invocare un singolo agent (debug & composizione).
6. **Aggiungere un tool di delega/routing**:
   - `repo_spec_zero_delegate` con args tipo `{ query, preferredAgent? }`
   - routing minimo: `preferredAgent` + fallback su mapping statico (o triggers) + possibilità di far girare l’orchestrator.
7. **(Opzionale) Introdurre `Router` + `AgentRegistry`** come in `spec-os`:
   - `AgentRegistry` registra orchestrator + sub-agenti
   - `Router` sceglie un agent in base a triggers/intent

### Fase C — Verifiche & regression
8. **Test “install mode”**: installare il plugin in un workspace esterno e verificare:
   - i prompt si caricano (da pluginRoot)
   - la spec viene scritta in `specDir` unico
   - audit log è nella stessa directory
9. **Test “local repo path”** + **test “clone repoUrl”**.
10. **Aggiornare docs/README** con:
   - tool disponibili (`repo_spec_zero_analyze`, `repo_spec_zero_delegate`, `repo_spec_zero_agent_*`)
   - dove vengono scritti gli output
   - troubleshooting per path/prompt

---

## Acceptance criteria (pronti per QA)
- Eseguendo `repo_spec_zero_analyze` dentro un repo qualunque, lo swarm genera output (non fallisce per prompt path).
- `specDir` restituito dal tool contiene:
  - `analysis/` (con file generati)
  - `_meta/analysis_audit.md`
- (Se implementato) `repo_spec_zero_delegate` instrada correttamente (almeno via `preferredAgent`) e non dipende da `process.cwd()` per i prompt.

