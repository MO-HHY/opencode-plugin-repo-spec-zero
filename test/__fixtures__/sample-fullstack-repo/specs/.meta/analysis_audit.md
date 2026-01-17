# Analysis Audit Log
Date: 2026-01-16T23:32:45.013Z
Repo: sample-fullstack-repo
Type: fullstack
Mode: generation
Duration: 0s

## DAG Execution Summary
- DAG Version: 2.1.0
- Total Agents: 15
- Executed: 15
- Success: 14
- Failed: 1
- Skipped: 0

## Execution Details
| Agent | Status | Duration | Message |
|-------|--------|----------|---------|
| bootstrap | Success | 2ms |  |
| overview | Success | 3ms |  |
| dependencies | Success | 1ms |  |
| architecture | Success | 2ms |  |
| entities | Success | 2ms |  |
| backend-modules | Success | 1ms |  |
| frontend-modules | Success | 0ms |  |
| database | Success | 0ms |  |
| api-rest | Success | 4ms |  |
| components | Success | 3ms |  |
| services | Success | 1ms |  |
| security | Failed | 1ms | No prompt found for agent security in repo type fullstack |
| summary | Success | 1ms |  |
| structure_builder | Success | 0ms |  |
| write_specs | Success | 37ms |  |

## Context Metadata
```json
{
  "projectSlug": "sample-fullstack-repo",
  "repoType": "fullstack",
  "baseDir": "/Users/mohamedouassif/Documents/GitHub/Github_MO-HHY_WorkDirectory/repos/00__Plugin-SPEC-OS/opencode-plugin-repo-spec-zero/test/__fixtures__/sample-fullstack-repo",
  "analysisDate": "2026-01-16T23:32:44.960Z",
  "durationMs": 53,
  "agentsExecuted": [
    "bootstrap",
    "dependencies",
    "overview",
    "entities",
    "architecture",
    "backend-modules",
    "frontend-modules",
    "database",
    "api-rest",
    "components",
    "summary",
    "services",
    "structure_builder",
    "write_specs"
  ],
  "keyFilesLoaded": [
    "package.json",
    ".env.example",
    "prisma/schema.prisma"
  ],
  "promptVersions": [
    {
      "id": "analysis/bootstrap",
      "version": "1",
      "hash": "native"
    },
    {
      "id": "integration/dependencies",
      "version": "5",
      "hash": "3b5ffb13"
    },
    {
      "id": "analysis/overview",
      "version": "1",
      "hash": "4f77d5b2"
    },
    {
      "id": "analysis/entities",
      "version": "1",
      "hash": "eddb8a32"
    },
    {
      "id": "analysis/architecture",
      "version": "1",
      "hash": "bd8a8720"
    },
    {
      "id": "analysis/modules",
      "version": "1",
      "hash": "90592d0c"
    },
    {
      "id": "analysis/modules",
      "version": "1",
      "hash": "90592d0c"
    },
    {
      "id": "data/detect-schema",
      "version": "1",
      "hash": "e0f6f86b"
    },
    {
      "id": "api/detect-endpoints",
      "version": "1",
      "hash": "a4d7ac10"
    },
    {
      "id": "ui/detect-components",
      "version": "1",
      "hash": "24105529"
    },
    {
      "id": "analysis/summary",
      "version": "1",
      "hash": "native"
    },
    {
      "id": "integration/detect-services",
      "version": "5",
      "hash": "812c4221"
    },
    {
      "id": "finalizer/structure",
      "version": "1",
      "hash": "native"
    },
    {
      "id": "finalizer/write",
      "version": "2",
      "hash": "native"
    }
  ]
}
```

## Key Files Loaded
- package.json
- .env.example
- prisma/schema.prisma

## Prompt Versions Used
- analysis/bootstrap@v1 (native)
- integration/dependencies@v5 (3b5ffb13)
- analysis/overview@v1 (4f77d5b2)
- analysis/entities@v1 (eddb8a32)
- analysis/architecture@v1 (bd8a8720)
- analysis/modules@v1 (90592d0c)
- analysis/modules@v1 (90592d0c)
- data/detect-schema@v1 (e0f6f86b)
- api/detect-endpoints@v1 (a4d7ac10)
- ui/detect-components@v1 (24105529)
- analysis/summary@v1 (native)
- integration/detect-services@v5 (812c4221)
- finalizer/structure@v1 (native)
- finalizer/write@v2 (native)
