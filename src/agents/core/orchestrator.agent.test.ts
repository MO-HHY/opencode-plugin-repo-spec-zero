import { describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RepoSpecZeroOrchestrator } from './orchestrator.agent.js';

describe('RepoSpecZeroOrchestrator', () => {
    it('accepts repoPath and does not clone', async () => {
        const repoRoot = process.cwd();
        const tmpRepo = path.join(repoRoot, 'temp', 'vitest', `repo-${Date.now()}`);
        fs.mkdirSync(tmpRepo, { recursive: true });
        
        // Create a minimal package.json for detection
        fs.writeFileSync(path.join(tmpRepo, 'package.json'), JSON.stringify({ name: 'test-repo' }));

        const detectionSkill = { detect: vi.fn(async () => 'generic') } as any;
        const gitSkill = { cloneOrUpdate: vi.fn(async () => tmpRepo) } as any;
        const taskSpecAgent = { fetchTask: vi.fn(), updateProgress: vi.fn() } as any;

        const orchestrator = new RepoSpecZeroOrchestrator(detectionSkill, gitSkill, taskSpecAgent);
        
        // Register a mock tree skill
        orchestrator.registerSkill('repo_spec_zero_build_tree', {
            execute: async (): Promise<any> => ({ success: true, data: 'test-repo/\n  package.json' })
        });
        
        try {
            const result = await orchestrator.process({
                client: { tui: { showToast: vi.fn(async () => undefined) } },
                params: { repoPath: tmpRepo },
            } as any);

            // Git clone should NOT be called for local repos
            expect(gitSkill.cloneOrUpdate).not.toHaveBeenCalled();
            
            // v2.0.0: Output directory is now 'specs' (submodule-based)
            // Check that specDir is set correctly
            expect(result.data?.specDir).toBe(path.join(tmpRepo, 'specs'));
            
            // v2.0.0: Verify the .meta directory was created (v2 uses .meta, v1 used _meta)
            const metaDir = path.join(tmpRepo, 'specs', '.meta');
            expect(fs.existsSync(metaDir)).toBe(true);
            
            // v2.0.0: Check mode is returned
            expect(result.data?.mode).toBeDefined();
            
        } finally {
            fs.rmSync(tmpRepo, { recursive: true, force: true });
        }
    });

    it('validates DAG structure is created', async () => {
        const repoRoot = process.cwd();
        const tmpRepo = path.join(repoRoot, 'temp', 'vitest', `repo-dag-${Date.now()}`);
        fs.mkdirSync(tmpRepo, { recursive: true });
        fs.writeFileSync(path.join(tmpRepo, 'package.json'), JSON.stringify({ name: 'dag-test' }));

        const detectionSkill = { detect: vi.fn(async () => 'backend') } as any;
        const gitSkill = { cloneOrUpdate: vi.fn() } as any;
        const taskSpecAgent = { fetchTask: vi.fn(), updateProgress: vi.fn() } as any;

        const orchestrator = new RepoSpecZeroOrchestrator(detectionSkill, gitSkill, taskSpecAgent);
        orchestrator.registerSkill('repo_spec_zero_build_tree', {
            execute: async (): Promise<any> => ({ success: true, data: 'dag-test/\n  package.json\n  src/' })
        });

        try {
            const result = await orchestrator.process({
                client: { tui: { showToast: vi.fn(async () => undefined) } },
                params: { repoPath: tmpRepo },
            } as any);

            // Check DAG summary is returned
            expect(result.data?.dagSummary).toBeDefined();
            expect(result.data?.dagSummary?.totalAgents).toBeGreaterThan(0);
            expect(result.data?.repoType).toBe('backend');
            
            // Check context metadata is returned
            expect(result.data?.contextMetadata).toBeDefined();
            expect(result.data?.contextMetadata?.projectSlug).toBe(path.basename(tmpRepo));
            
            // v2.0.0: Check version is returned
            expect(result.data?.version).toBe('2.0.0');

        } finally {
            fs.rmSync(tmpRepo, { recursive: true, force: true });
        }
    });
});
