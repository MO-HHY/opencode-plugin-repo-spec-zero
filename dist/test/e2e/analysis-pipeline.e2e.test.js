import { describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RepoSpecZeroOrchestrator } from '../../agents/core/orchestrator.agent.js';
import { SpecZeroDetectionSkill } from '../../skills/spec-zero-detection.skill.js';
import { GitSkill } from '../../skills/git.skill.js';
import { TaskSpecAgent } from '../../agents/core/task-spec.agent.js';
// Import core agents
import { BootstrapAgent } from '../../agents/core/bootstrap.agent.js';
import { SummaryAgent } from '../../agents/spec-zero/finalizer/summary.agent.js';
import { StructureBuilderAgent } from '../../agents/spec-zero/finalizer/structure-builder.agent.js';
import { WriteSpecsAgent } from '../../agents/spec-zero/finalizer/write-specs.agent.js';
import { SubmoduleCheckAgent } from '../../agents/core/submodule-check.agent.js';
import { CommitPushAgent } from '../../agents/spec-zero/finalizer/commit-push.agent.js';
describe('Analysis Pipeline E2E', () => {
    const fixtureRepoPath = path.resolve('test/__fixtures__/sample-fullstack-repo');
    const outputDir = path.join(fixtureRepoPath, 'specs');
    // Mock skills
    const detectionSkill = new SpecZeroDetectionSkill();
    const gitSkill = new GitSkill(console);
    const taskSpecAgent = new TaskSpecAgent();
    // Mock NativeLLM to return deterministic responses based on prompt
    const mockLLMExecutor = {
        execute: async (params) => {
            const messages = params.messages || [];
            const userMessage = messages.find((m) => m.role === 'user')?.content || '';
            const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
            console.log(`[MockLLM] User message keywords: ${userMessage.slice(0, 50)}...`);
            if (userMessage.includes('overview')) {
                return {
                    success: true,
                    data: '# Executive Summary\nThis is a sample fullstack repository.\n\n## Tech Stack\nReact, Express, Prisma.'
                };
            }
            if (userMessage.includes('entities') || userMessage.includes('Domain model')) {
                return {
                    success: true,
                    data: '# Entities\n| Entity | Description |\n| --- | --- |\n| User | System users |\n\n```mermaid\nerDiagram\n  User { string id } \n```'
                };
            }
            if (userMessage.includes('Endpoints') || userMessage.includes('API') || userMessage.includes('api')) {
                return {
                    success: true,
                    data: '# Endpoints\n- GET /api/users\n\n```mermaid\nsequenceDiagram\n  Client->>Server: GET /api/users\n```'
                };
            }
            return {
                success: true,
                data: '# Generic Analysis\nAnalysis content for ' + userMessage.slice(0, 20)
            };
        }
    };
    const orchestrator = new RepoSpecZeroOrchestrator(detectionSkill, gitSkill, taskSpecAgent);
    orchestrator.registerSkill('native_llm', mockLLMExecutor);
    // Mock Git skill methods
    vi.spyOn(gitSkill, 'cloneOrUpdate').mockResolvedValue(fixtureRepoPath);
    // Register core agents with mocked git operations
    const submoduleCheckAgent = new SubmoduleCheckAgent();
    vi.spyOn(submoduleCheckAgent, 'process').mockResolvedValue({
        success: true,
        data: {
            mode: 'generation',
            specsPath: path.join(fixtureRepoPath, 'specs'),
            currentVersion: '0.0.0',
            promptVersion: { id: 'analysis/bootstrap', version: '1', hash: 'mock' }
        }
    });
    const commitPushAgent = new CommitPushAgent();
    vi.spyOn(commitPushAgent, 'process').mockResolvedValue({
        success: true,
        data: { success: true }
    });
    const coreAgents = [
        submoduleCheckAgent,
        new BootstrapAgent(),
        new SummaryAgent(),
        new StructureBuilderAgent(),
        new WriteSpecsAgent(),
        commitPushAgent
    ];
    coreAgents.forEach(agent => {
        orchestrator.registerSubAgent(agent);
    });
    // Mock Tree Skill
    orchestrator.registerSkill('repo_spec_zero_build_tree', {
        execute: async () => ({
            success: true,
            data: 'sample-fullstack-repo/\n  package.json\n  src/\n    server/\n    client/'
        })
    });
    it('should run full pipeline and verify results', async () => {
        const result = await orchestrator.process({
            client: {
                tui: { showToast: vi.fn(async () => undefined) },
                session: { prompt: vi.fn(async () => 'Mock LLM Response') }
            },
            params: {
                repoPath: fixtureRepoPath,
                smartDag: true,
                diagrams: 'both'
            },
        });
        expect(result.success).toBe(true);
        expect(result.data.repoType).toBe('fullstack');
        expect(result.data.version).toBe('2.1.0');
        // Verify filesystem structure
        const generatedDir = path.join(outputDir, '_generated');
        expect(fs.existsSync(generatedDir)).toBe(true);
        expect(fs.existsSync(path.join(generatedDir, '00-foundation', 'overview.md'))).toBe(true);
        expect(fs.existsSync(path.join(generatedDir, '01-domain', 'entities.md'))).toBe(true);
        expect(fs.existsSync(path.join(generatedDir, '03-api', 'rest.md'))).toBe(true);
        // Verify diagrams
        const diagramsDir = path.join(generatedDir, '_diagrams');
        expect(fs.existsSync(diagramsDir)).toBe(true);
        const diagramFiles = fs.readdirSync(diagramsDir);
        expect(diagramFiles.length).toBeGreaterThan(0);
        expect(diagramFiles.some(f => f.includes('erd'))).toBe(true);
        expect(diagramFiles.some(f => f.includes('sequence'))).toBe(true);
        // Verify index.md
        expect(fs.existsSync(path.join(outputDir, 'index.md'))).toBe(true);
        const indexContent = fs.readFileSync(path.join(outputDir, 'index.md'), 'utf-8');
        expect(indexContent).toContain('Project Overview');
    }, 30000); // 30s timeout
});
//# sourceMappingURL=analysis-pipeline.e2e.test.js.map