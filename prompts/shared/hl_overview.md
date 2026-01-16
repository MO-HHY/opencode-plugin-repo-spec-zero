version=3
## Repository Analysis Context

{previous_context}

---

## Repository Structure

```
{repo_structure}
```

---

## Key Files Content

{key_files}

---

## Analysis Task: High-Level Overview

Act as a senior software architect analyzing a new project. Based on the repository structure and key files provided above, produce a comprehensive high-level overview.

### Required Sections

#### 1. Executive Summary
Provide 3-5 sentences describing:
- What this project does (primary purpose)
- Who it's for (target users/developers)
- What makes it notable (key features, scale)

#### 2. Repository Identification
- **Project Name:** Extract from package.json, README, or directory name. Format: `[[project-name]]`
- **Project Type:** (backend, frontend, library, mobile, fullstack, monorepo, infra-as-code)

#### 3. Technology Stack

Provide a table with discovered technologies:

| Category | Technology | Version | Source File |
|----------|-----------|---------|-------------|
| Runtime | Node.js | 18.x | package.json:10 |
| Framework | Express | 4.18 | package.json:15 |
| Database | MongoDB | - | docker-compose.yml |
| ... | ... | ... | ... |

**Note:** For dependency detection:
- Perform case-insensitive matching
- Consider dash variations (e.g., "new-relic", "data-dog")
- Check: package.json, requirements.txt, pyproject.toml, go.mod, Cargo.toml

#### 4. Architecture Pattern

Identify the architectural pattern(s):
- Layered / N-tier
- MVC / MVVM
- Microservices
- Event-Driven
- Monolith
- Monorepo

Provide evidence: specific directories, framework usage, communication patterns.

#### 5. Project Structure

Describe the high-level directory organization:

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| src/ | Main source code | index.ts |
| api/ | API endpoints | routes.ts |
| ... | ... | ... |

#### 6. Entry Points

List main entry points with file paths:
- Main application entry: `src/index.ts:1`
- Server entry: `server.ts:1`
- CLI entry: `bin/cli.ts:1`

#### 7. Build & Run Commands

Based on package.json scripts or equivalent:

| Command | Purpose | Script |
|---------|---------|--------|
| `npm run dev` | Development server | "nodemon src/index.ts" |
| `npm run build` | Production build | "tsc" |
| `npm test` | Run tests | "jest" |

#### 8. Initial Observations

Note any interesting patterns, potential issues, or areas needing deeper analysis.

---

## Output Requirements

- Use YAML frontmatter with uid, title, status, version, created, prompt_version
- Cite file paths with line numbers: `path/to/file.ts:42`
- Use "NOT_FOUND" if information is unavailable
- Format as clean Markdown

**Special Instruction:** Ignore files under 'arch-docs' or similar documentation folders.
