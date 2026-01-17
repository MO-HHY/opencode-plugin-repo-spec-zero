import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartDAGPlanner } from './smart-dag-planner.js';
import { FeatureDetector } from './feature-detector.js';
import { PromptRegistry } from './prompt-registry.js';
import { FEATURE_FLAGS } from '../types.js';
// Mock dependencies
vi.mock('./prompt-registry.js');
vi.mock('./feature-detector.js');
describe('SmartDAGPlanner', () => {
    let planner;
    let mockRegistry;
    let mockDetector;
    const createMockFeatures = (overrides = {}) => ({
        repoType: 'backend',
        languages: new Set(['typescript']),
        frameworks: new Set(['express']),
        features: new Set([FEATURE_FLAGS.HAS_REST_API]),
        structure: {
            hasBackend: true,
            hasFrontend: false,
            hasTests: true,
            hasDocs: false,
            hasDocker: false,
            hasCICD: false,
            isMonorepo: false
        },
        packageManager: 'npm',
        entryPoints: ['src/index.ts'],
        ...overrides
    });
    beforeEach(() => {
        mockRegistry = new PromptRegistry('/fake/path');
        mockDetector = new FeatureDetector();
        planner = new SmartDAGPlanner(mockRegistry, mockDetector);
    });
    describe('planFromFeatures', () => {
        it('should always include bootstrap, overview, architecture, entities', () => {
            const features = createMockFeatures();
            const dag = planner.planFromFeatures(features);
            const agentIds = dag.agents.map(a => a.id);
            expect(agentIds).toContain('bootstrap');
            expect(agentIds).toContain('overview');
            expect(agentIds).toContain('architecture');
            expect(agentIds).toContain('entities');
        });
        it('should include backend-modules when hasBackend', () => {
            const features = createMockFeatures({
                structure: {
                    hasBackend: true,
                    hasFrontend: false,
                    hasTests: false,
                    hasDocs: false,
                    hasDocker: false,
                    hasCICD: false,
                    isMonorepo: false
                }
            });
            const dag = planner.planFromFeatures(features);
            expect(dag.agents.some(a => a.id === 'backend-modules')).toBe(true);
        });
        it('should include api-rest when HAS_REST_API', () => {
            const features = createMockFeatures({
                features: new Set([FEATURE_FLAGS.HAS_REST_API])
            });
            const dag = planner.planFromFeatures(features);
            expect(dag.agents.some(a => a.id === 'api-rest')).toBe(true);
        });
        it('should include database when HAS_SQL_DB', () => {
            const features = createMockFeatures({
                features: new Set([FEATURE_FLAGS.HAS_SQL_DB])
            });
            const dag = planner.planFromFeatures(features);
            expect(dag.agents.some(a => a.id === 'database')).toBe(true);
        });
        it('should include authentication when HAS_AUTH', () => {
            const features = createMockFeatures({
                features: new Set([FEATURE_FLAGS.HAS_REST_API, FEATURE_FLAGS.HAS_AUTH])
            });
            const dag = planner.planFromFeatures(features);
            expect(dag.agents.some(a => a.id === 'authentication')).toBe(true);
        });
        it('should override prompt for express framework', () => {
            const features = createMockFeatures({
                frameworks: new Set(['express']),
                features: new Set([FEATURE_FLAGS.HAS_REST_API])
            });
            const dag = planner.planFromFeatures(features);
            const apiAgent = dag.agents.find(a => a.id === 'api-rest');
            expect(apiAgent?.promptId).toBe('api/detect-endpoints-express');
        });
    });
    describe('shouldSkipAgent', () => {
        it('should skip optional agent when dependency failed', () => {
            const features = createMockFeatures();
            const agent = {
                id: 'test-agent',
                promptId: 'test',
                dependencies: ['failed-dep'],
                parallel: true,
                optional: true,
                diagrams: [],
                outputFile: 'test.md',
                layer: 5
            };
            const result = planner.shouldSkipAgent(agent, features, new Set(['other']), new Set(['failed-dep']));
            expect(result.skip).toBe(true);
            expect(result.reason).toContain('failed');
        });
        it('should skip backend-modules when no backend structure', () => {
            const features = createMockFeatures({
                structure: {
                    hasBackend: false,
                    hasFrontend: false,
                    hasTests: false,
                    hasDocs: false,
                    hasDocker: false,
                    hasCICD: false,
                    isMonorepo: false
                }
            });
            const agent = {
                id: 'backend-modules',
                promptId: 'test',
                dependencies: [],
                parallel: true,
                optional: false,
                diagrams: [],
                outputFile: 'test.md',
                layer: 4
            };
            const result = planner.shouldSkipAgent(agent, features, new Set(), new Set());
            expect(result.skip).toBe(true);
        });
    });
    describe('buildLayers', () => {
        it('should group agents by layer', () => {
            const features = createMockFeatures();
            const dag = planner.planFromFeatures(features);
            expect(dag.layers.length).toBeGreaterThan(0);
            // Layer 0 should have bootstrap
            expect(dag.layers[0]?.some(a => a.id === 'bootstrap')).toBe(true);
        });
    });
    describe('validateDAG', () => {
        it('should pass for valid DAG', () => {
            const features = createMockFeatures();
            const dag = planner.planFromFeatures(features);
            const result = planner.validateDAG(dag);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=smart-dag-planner.test.js.map