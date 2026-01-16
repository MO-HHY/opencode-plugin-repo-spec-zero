import { definePlugin } from 'opencode';

export default definePlugin({
    name: 'sprint-coordinator',

    tools: {
        // Legge lo stato corrente dello sprint
        sprint_status: {
            description: 'Legge SPRINT.md e ritorna lo stato corrente',
            parameters: {},
            async execute() {
                const fs = await import('fs/promises');
                const content = await fs.readFile('SPRINT.md', 'utf-8');
                return parseSprintMd(content);
            }
        },

        // Aggiorna una task nello sprint
        sprint_update_task: {
            description: 'Aggiorna lo stato di una task in SPRINT.md',
            parameters: {
                taskId: { type: 'string', required: true },
                newStatus: {
                    type: 'string',
                    enum: ['BLOCKED', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'DONE'],
                    required: true
                },
                note: { type: 'string' }
            },
            async execute({ taskId, newStatus, note }) {
                // Implementazione: legge, modifica, salva SPRINT.md
                return { success: true, taskId, newStatus };
            }
        },

        // Aggiunge comunicazione al log
        sprint_log_communication: {
            description: 'Aggiunge entry al Agent Communications Log',
            parameters: {
                from: { type: 'string', required: true },
                to: { type: 'string', required: true },
                taskId: { type: 'string', required: true },
                message: { type: 'string', required: true },
                context: { type: 'string' },
                specRef: { type: 'string' },
                outputPath: { type: 'string' }
            },
            async execute(params) {
                // Implementazione: append to SPRINT.md communications log
                return { success: true, logged: true };
            }
        },

        // Verifica dipendenze task
        sprint_check_dependencies: {
            description: 'Verifica se le dipendenze di una task sono soddisfatte',
            parameters: {
                taskId: { type: 'string', required: true }
            },
            async execute({ taskId }) {
                // Legge SPRINT.md, verifica dipendenze
                return {
                    taskId,
                    dependenciesMet: true,
                    blockers: []
                };
            }
        },

        // Inizializza nuovo sprint da master plan
        sprint_init: {
            description: 'Crea nuovo SPRINT.md da riferimento master plan',
            parameters: {
                masterPlanRef: { type: 'string', required: true },
                sprintName: { type: 'string', required: true },
                targetDate: { type: 'string', required: true }
            },
            async execute({ masterPlanRef, sprintName, targetDate }) {
                // Crea SPRINT.md template
                return { success: true, sprintFile: 'SPRINT.md' };
            }
        }
    }
});

function parseSprintMd(content: string) {
    // Parser per estrarre struttura da SPRINT.md
    return {
        meta: { /* ... */ },
        tasks: {
            blocked: [],
            inProgress: [],
            readyForReview: [],
            done: []
        },
        dependencies: [],
        communications: []
    };
}
```

---

## Workflow Esempio

### 1. Avvio Sprint
```
User: /start-sprint docs/masterplan / MP-001.md

Architect:
→ Legge MP-001.md
→ Chiama sprint_init
→ Delega a Planner per decomposizione
    ```

### 2. Planner crea Task
```
Planner Output:
- T-001: Project Setup(S, 1h, coder - fullstack, [])
    - T-002: Database Schema(M, 2h, coder - backend, [T-001])
        - T-003: Auth Module(L, 4h, coder - backend, [T-001])
            - T-004: UI Components(M, 3h, coder - frontend, [T-002])
                - T-005: API Endpoints(M, 3h, coder - backend, [T-003])
                    - T-006: Integration(L, 4h, coder - fullstack, [T-004, T-005])
                        ```

### 3. Executor Manager assegna
```
→ T-001 può partire(nessuna dipendenza)
→ Assegna a coder - fullstack
→ Scrive in SPRINT.md
    ```

### 4. Coder completa e segnala
```
coder - fullstack → SPRINT.md:
"T-001 COMPLETED, files: [package.json, tsconfig.json, ...]"
    ```

### 5. Parallelizzazione automatica
```
Executor Manager vede T-001 DONE:
→ T-002 e T-003 sono sbloccate(entrambe dipendono solo da T-001)
→ Assegna T-002 e T-003 in parallelo a coder - backend