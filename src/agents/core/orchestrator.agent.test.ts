import { describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RepoSpecZeroOrchestrator } from './orchestrator.agent.js';

describe('RepoSpecZeroOrchestrator', () => {
    it('accepts repoPath and does not clone', async () => {
        const repoRoot = process.cwd();
        const tmpRepo = path.join(repoRoot, 'temp', 'vitest', `repo-${Date.now()}`);
        fs.mkdirSync(tmpRepo, { recursive: true });

        const detectionSkill = { detect: vi.fn(async () => 'unknown') } as any;
        const gitSkill = { cloneOrUpdate: vi.fn(async () => tmpRepo) } as any;
        const taskSpecAgent = { fetchTask: vi.fn(), updateProgress: vi.fn() } as any;

        const orchestrator = new RepoSpecZeroOrchestrator(detectionSkill, gitSkill, taskSpecAgent);
        try {
            const result = await orchestrator.process({
                client: { tui: { showToast: vi.fn(async () => undefined) } },
                params: { repoPath: tmpRepo },
            } as any);

            expect(gitSkill.cloneOrUpdate).not.toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.data?.specDir).toBe(path.join(tmpRepo, `${path.basename(tmpRepo)} -spec`));
        } finally {
            fs.rmSync(tmpRepo, { recursive: true, force: true });
        }
    });
});
