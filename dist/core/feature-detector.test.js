import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FeatureDetector } from './feature-detector.js';
import { FEATURE_FLAGS } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
describe('FeatureDetector', () => {
    let detector;
    let tempDir;
    beforeEach(() => {
        detector = new FeatureDetector();
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-test-'));
    });
    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });
    describe('detectFromPackageFiles', () => {
        it('should detect React framework from package.json', async () => {
            fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({
                dependencies: { react: '^18.0.0' }
            }));
            const result = await detector.detect(tempDir);
            expect(result.frameworks.has('react')).toBe(true);
            expect(result.features.has(FEATURE_FLAGS.HAS_REACT)).toBe(true);
        });
        it('should detect Express framework', async () => {
            fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({
                dependencies: { express: '^4.0.0' }
            }));
            const result = await detector.detect(tempDir);
            expect(result.frameworks.has('express')).toBe(true);
        });
        it('should detect Prisma ORM', async () => {
            fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({
                dependencies: { '@prisma/client': '^5.0.0' }
            }));
            const result = await detector.detect(tempDir);
            expect(result.features.has(FEATURE_FLAGS.HAS_ORM)).toBe(true);
            expect(result.features.has(FEATURE_FLAGS.HAS_SQL_DB)).toBe(true);
        });
        it('should handle invalid package.json gracefully', async () => {
            fs.writeFileSync(path.join(tempDir, 'package.json'), 'invalid json');
            const result = await detector.detect(tempDir);
            expect(result.frameworks.size).toBe(0);
        });
    });
    describe('detectStructure', () => {
        it('should detect backend structure', async () => {
            fs.mkdirSync(path.join(tempDir, 'src', 'routes'), { recursive: true });
            const result = await detector.detect(tempDir);
            expect(result.structure.hasBackend).toBe(true);
        });
        it('should detect frontend structure', async () => {
            fs.mkdirSync(path.join(tempDir, 'src', 'components'), { recursive: true });
            const result = await detector.detect(tempDir);
            expect(result.structure.hasFrontend).toBe(true);
        });
        it('should detect monorepo', async () => {
            fs.mkdirSync(path.join(tempDir, 'packages'), { recursive: true });
            const result = await detector.detect(tempDir);
            expect(result.structure.isMonorepo).toBe(true);
        });
        it('should detect Docker', async () => {
            fs.writeFileSync(path.join(tempDir, 'Dockerfile'), 'FROM node:18');
            const result = await detector.detect(tempDir);
            expect(result.structure.hasDocker).toBe(true);
        });
    });
    describe('determineRepoType', () => {
        it('should return fullstack for backend + frontend', async () => {
            fs.mkdirSync(path.join(tempDir, 'src', 'routes'), { recursive: true });
            fs.mkdirSync(path.join(tempDir, 'src', 'components'), { recursive: true });
            const result = await detector.detect(tempDir);
            expect(result.repoType).toBe('fullstack');
        });
        it('should return monorepo for packages dir', async () => {
            fs.mkdirSync(path.join(tempDir, 'packages'), { recursive: true });
            const result = await detector.detect(tempDir);
            expect(result.repoType).toBe('monorepo');
        });
    });
    describe('detectPackageManager', () => {
        it('should detect npm', async () => {
            fs.writeFileSync(path.join(tempDir, 'package-lock.json'), '{}');
            const result = await detector.detect(tempDir);
            expect(result.packageManager).toBe('npm');
        });
        it('should detect pnpm', async () => {
            fs.writeFileSync(path.join(tempDir, 'pnpm-lock.yaml'), '');
            const result = await detector.detect(tempDir);
            expect(result.packageManager).toBe('pnpm');
        });
    });
});
//# sourceMappingURL=feature-detector.test.js.map