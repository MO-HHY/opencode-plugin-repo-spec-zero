/**
 * REGRESSION TEST: SmartDAGPlanner → SPEC-OS Edge Integrity
 * 
 * Task: T-REGRESSION-002
 * Objective: Verificare che i link SPEC-OS (edges) rimangano integri dopo il cambio
 *            di ID degli agenti (es. da 'entity' a 'entities').
 * 
 * Background:
 * - SPEC-OS usa "edges" nel frontmatter YAML per collegare documenti correlati
 * - Gli edge seguono il formato: "uid:agentId:subtype"
 * - Nel mapping AGENT_TO_SUBDIR_MAP e AGENT_TO_FILENAME_MAP ci sono duplicati:
 *   - 'entity' → '01-domain/entities.md'
 *   - 'entities' → '01-domain/entities.md'
 * - Se un agent cambia ID, gli edge negli altri documenti devono aggiornarsi
 * 
 * Test Scenarios:
 * 1. Edge da 'overview' a 'entities' (dipendenza diretta)
 * 2. Edge da 'api-rest' a 'entities' (dipendenza indiretta)
 * 3. Edge circolare/bidirezionale (es. 'architecture' ↔ 'modules')
 * 4. Edge con wildcard ('*') come nel 'summary' agent
 * 
 * Critical Points:
 * - Agent ID consistency: PlannedAgent.id MUST match edges UIDs
 * - Dependency mapping: PlannedAgent.dependencies MUST resolve to valid agent IDs
 * - Output file mapping: Agent ID → output file path must be consistent
 * - Edge format: "uid:${agentId}:type" where agentId is the PlannedAgent.id
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SmartDAGPlanner } from '../../src/core/smart-dag-planner.js';
import { PromptRegistry } from '../../src/core/prompt-registry.js';
import { FeatureDetector } from '../../src/core/feature-detector.js';
import type { PlannedDAG, DetectedFeatures, PlannedAgent, AGENT_TO_SUBDIR_MAP, AGENT_TO_FILENAME_MAP } from '../../src/types.js';

describe('Regression: SmartDAGPlanner → SPEC-OS Edge Integrity', () => {
    let registry: PromptRegistry;
    let featureDetector: FeatureDetector;
    let planner: SmartDAGPlanner;

    beforeEach(() => {
        const pluginRoot = process.cwd();
        registry = new PromptRegistry(pluginRoot);
        featureDetector = new FeatureDetector();
        planner = new SmartDAGPlanner(registry, featureDetector);
    });

    describe('Happy Path: Agent ID Consistency', () => {
        it('should use "entities" (not "entity") as the PlannedAgent ID', () => {
            const mockFeatures: DetectedFeatures = {
                repoType: 'backend',
                languages: new Set(['typescript']),
                frameworks: new Set(['express']),
                features: new Set(['has_rest_api', 'has_sql_db']),
                structure: {
                    hasBackend: true,
                    hasFrontend: false,
                    hasTests: true,
                    hasDocs: false,
                    hasDocker: true,
                    hasCICD: true,
                    isMonorepo: false,
                },
                packageManager: 'npm',
                entryPoints: ['src/index.ts'],
            };

            const dag = planner.planFromFeatures(mockFeatures);

            // Find the entities agent
            const entitiesAgent = dag.agents.find(a => a.promptId === 'analysis/entities');
            
            expect(entitiesAgent).toBeDefined();
            expect(entitiesAgent!.id).toBe('entities'); // NOT 'entity'
        });

        it('should have consistent dependencies pointing to "entities"', () => {
            const mockFeatures: DetectedFeatures = {
                repoType: 'fullstack',
                languages: new Set(['typescript']),
                frameworks: new Set(['express', 'react']),
                features: new Set(['has_rest_api', 'has_sql_db', 'has_auth']),
                structure: {
                    hasBackend: true,
                    hasFrontend: true,
                    hasTests: true,
                    hasDocs: false,
                    hasDocker: true,
                    hasCICD: true,
                    isMonorepo: false,
                },
                packageManager: 'npm',
                entryPoints: ['src/index.ts'],
            };

            const dag = planner.planFromFeatures(mockFeatures);

            // Find agents that depend on entities
            const apiAgent = dag.agents.find(a => a.id === 'api-rest');
            const databaseAgent = dag.agents.find(a => a.id === 'database');

            if (apiAgent) {
                expect(apiAgent.dependencies).toContain('entities');
                expect(apiAgent.dependencies).not.toContain('entity'); // Old ID
            }

            if (databaseAgent) {
                expect(databaseAgent.dependencies).toContain('entities');
                expect(databaseAgent.dependencies).not.toContain('entity');
            }
        });

        it('should resolve all dependencies to existing agent IDs', () => {
            const mockFeatures: DetectedFeatures = {
                repoType: 'backend',
                languages: new Set(['typescript']),
                frameworks: new Set(['express', 'prisma']),
                features: new Set(['has_rest_api', 'has_sql_db', 'has_orm', 'has_auth']),
                structure: {
                    hasBackend: true,
                    hasFrontend: false,
                    hasTests: true,
                    hasDocs: false,
                    hasDocker: true,
                    hasCICD: true,
                    isMonorepo: false,
                },
                packageManager: 'npm',
                entryPoints: ['src/index.ts'],
            };

            const dag = planner.planFromFeatures(mockFeatures);
            
            const agentIds = new Set(dag.agents.map(a => a.id));

            // Check all dependencies resolve
            for (const agent of dag.agents) {
                for (const dep of agent.dependencies) {
                    if (dep !== '*') { // Wildcard is special
                        expect(agentIds.has(dep), `Agent ${agent.id} depends on ${dep} which doesn't exist`).toBe(true);
                    }
                }
            }
        });

        it('should map agent IDs correctly to output files', () => {
            const mockFeatures: DetectedFeatures = {
                repoType: 'backend',
                languages: new Set(['typescript']),
                frameworks: new Set([]),
                features: new Set([]),
                structure: {
                    hasBackend: true,
                    hasFrontend: false,
                    hasTests: false,
                    hasDocs: false,
                    hasDocker: false,
                    hasCICD: false,
                    isMonorepo: false,
                },
                packageManager: 'npm',
                entryPoints: ['src/index.ts'],
            };

            const dag = planner.planFromFeatures(mockFeatures);

            const entitiesAgent = dag.agents.find(a => a.id === 'entities');
            
            if (entitiesAgent) {
                // Should map to 01-domain/entities.md
                expect(entitiesAgent.outputFile).toBe('01-domain/entities.md');
            }

            const overviewAgent = dag.agents.find(a => a.id === 'overview');
            if (overviewAgent) {
                expect(overviewAgent.outputFile).toBe('00-foundation/overview.md');
            }
        });
    });

    describe('Edge Cases: Wildcard Dependencies', () => {
        it('should resolve "*" dependencies to all non-optional previous agents', () => {
            const mockFeatures: DetectedFeatures = {
                repoType: 'backend',
                languages: new Set(['typescript']),
                frameworks: new Set(['express']),
                features: new Set(['has_rest_api']),
                structure: {
                    hasBackend: true,
                    hasFrontend: false,
                    hasTests: true,
                    hasDocs: false,
                    hasDocker: false,
                    hasCICD: false,
                    isMonorepo: false,
                },
                packageManager: 'npm',
                entryPoints: ['src/index.ts'],
            };

            const dag = planner.planFromFeatures(mockFeatures);

            // Find summary agent (has '*' dependency)
            const summaryAgent = dag.agents.find(a => a.id === 'summary');
            
            expect(summaryAgent).toBeDefined();
            
            // After resolution, '*' should be replaced with actual IDs
            if (summaryAgent) {
                expect(summaryAgent.dependencies.length).toBeGreaterThan(0);
                expect(summaryAgent.dependencies).not.toContain('*');
                
                // Should include bootstrap, overview, entities, etc.
                expect(summaryAgent.dependencies).toContain('bootstrap');
                expect(summaryAgent.dependencies).toContain('overview');
            }
        });

        it('should only include non-optional agents in wildcard resolution', () => {
            const mockFeatures: DetectedFeatures = {
                repoType: 'fullstack',
                languages: new Set(['typescript']),
                frameworks: new Set(['express', 'react']),
                features: new Set(['has_rest_api', 'has_sql_db']),
                structure: {
                    hasBackend: true,
                    hasFrontend: true,
                    hasTests: true,
                    hasDocs: false,
                    hasDocker: true,
                    hasCICD: false,
                    isMonorepo: false,
                },
                packageManager: 'npm',
                entryPoints: ['src/index.ts'],
            };

            const dag = planner.planFromFeatures(mockFeatures);

            const summaryAgent = dag.agents.find(a => a.id === 'summary');
            
            if (summaryAgent) {
                // Get all optional agents in previous layers
                const optionalAgents = dag.agents
                    .filter(a => a.optional && a.layer < (summaryAgent.layer || 12))
                    .map(a => a.id);

                // None of the optional agents should be in summary's dependencies
                for (const optionalId of optionalAgents) {
                    expect(summaryAgent.dependencies).not.toContain(optionalId);
                }
            }
        });
    });

    describe('Edge Cases: Agent ID Aliases', () => {
        it('should handle both "backend-modules" and "frontend-modules" correctly', () => {
            const mockFeatures: DetectedFeatures = {
                repoType: 'fullstack',
                languages: new Set(['typescript']),
                frameworks: new Set(['express', 'react']),
                features: new Set(['has_rest_api', 'has_react']),
                structure: {
                    hasBackend: true,
                    hasFrontend: true,
                    hasTests: true,
                    hasDocs: false,
                    hasDocker: false,
                    hasCICD: false,
                    isMonorepo: false,
                },
                packageManager: 'npm',
                entryPoints: ['src/index.ts'],
            };

            const dag = planner.planFromFeatures(mockFeatures);

            const backendModules = dag.agents.find(a => a.id === 'backend-modules');
            const frontendModules = dag.agents.find(a => a.id === 'frontend-modules');

            expect(backendModules).toBeDefined();
            expect(frontendModules).toBeDefined();

            // Should have distinct output files
            expect(backendModules!.outputFile).toBe('02-modules/backend/index.md');
            expect(frontendModules!.outputFile).toBe('02-modules/frontend/index.md');
        });

        it('should use correct IDs for API agents (api-rest, api-graphql)', () => {
            const mockFeatures: DetectedFeatures = {
                repoType: 'backend',
                languages: new Set(['typescript']),
                frameworks: new Set(['express']),
                features: new Set(['has_rest_api', 'has_graphql']),
                structure: {
                    hasBackend: true,
                    hasFrontend: false,
                    hasTests: true,
                    hasDocs: false,
                    hasDocker: false,
                    hasCICD: false,
                    isMonorepo: false,
                },
                packageManager: 'npm',
                entryPoints: ['src/index.ts'],
            };

            const dag = planner.planFromFeatures(mockFeatures);

            const restAgent = dag.agents.find(a => a.id === 'api-rest');
            const graphqlAgent = dag.agents.find(a => a.id === 'api-graphql');

            expect(restAgent).toBeDefined();
            expect(graphqlAgent).toBeDefined();

            // IDs should match the PlannedAgent configuration in SmartDAGPlanner
            expect(restAgent!.id).toBe('api-rest');
            expect(graphqlAgent!.id).toBe('api-graphql');
        });
    });

    describe('DAG Validation', () => {
        it('should pass validateDAG for all agent dependencies', () => {
            const mockFeatures: DetectedFeatures = {
                repoType: 'fullstack',
                languages: new Set(['typescript']),
                frameworks: new Set(['express', 'react', 'prisma']),
                features: new Set(['has_rest_api', 'has_sql_db', 'has_orm', 'has_auth', 'has_react']),
                structure: {
                    hasBackend: true,
                    hasFrontend: true,
                    hasTests: true,
                    hasDocs: true,
                    hasDocker: true,
                    hasCICD: true,
                    isMonorepo: false,
                },
                packageManager: 'npm',
                entryPoints: ['src/index.ts'],
            };

            const dag = planner.planFromFeatures(mockFeatures);

            const validation = planner.validateDAG(dag);

            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('should detect missing dependencies if agent IDs are inconsistent', () => {
            const mockFeatures: DetectedFeatures = {
                repoType: 'backend',
                languages: new Set(['typescript']),
                frameworks: new Set(['express']),
                features: new Set(['has_rest_api']),
                structure: {
                    hasBackend: true,
                    hasFrontend: false,
                    hasTests: true,
                    hasDocs: false,
                    hasDocker: false,
                    hasCICD: false,
                    isMonorepo: false,
                },
                packageManager: 'npm',
                entryPoints: ['src/index.ts'],
            };

            const dag = planner.planFromFeatures(mockFeatures);

            // Artificially break a dependency (simulate old 'entity' ID)
            const apiAgent = dag.agents.find(a => a.id === 'api-rest');
            if (apiAgent) {
                // Replace 'entities' with old 'entity' ID
                apiAgent.dependencies = apiAgent.dependencies.map(d => 
                    d === 'entities' ? 'entity' : d
                );

                // Now validation should fail
                const validation = planner.validateDAG(dag);
                
                expect(validation.valid).toBe(false);
                expect(validation.errors.length).toBeGreaterThan(0);
                expect(validation.errors.some(e => e.includes('entity'))).toBe(true);
            }
        });

        it('should not have circular dependencies', () => {
            const mockFeatures: DetectedFeatures = {
                repoType: 'backend',
                languages: new Set(['typescript']),
                frameworks: new Set([]),
                features: new Set([]),
                structure: {
                    hasBackend: true,
                    hasFrontend: false,
                    hasTests: false,
                    hasDocs: false,
                    hasDocker: false,
                    hasCICD: false,
                    isMonorepo: false,
                },
                packageManager: 'npm',
                entryPoints: ['src/index.ts'],
            };

            const dag = planner.planFromFeatures(mockFeatures);

            // Check no agent depends on itself
            for (const agent of dag.agents) {
                expect(agent.dependencies).not.toContain(agent.id);
            }
        });
    });

    describe('Output File Path Consistency', () => {
        it('should generate consistent output paths for all agents', () => {
            const mockFeatures: DetectedFeatures = {
                repoType: 'fullstack',
                languages: new Set(['typescript']),
                frameworks: new Set(['express', 'react']),
                features: new Set(['has_rest_api', 'has_react']),
                structure: {
                    hasBackend: true,
                    hasFrontend: true,
                    hasTests: true,
                    hasDocs: false,
                    hasDocker: false,
                    hasCICD: false,
                    isMonorepo: false,
                },
                packageManager: 'npm',
                entryPoints: ['src/index.ts'],
            };

            const dag = planner.planFromFeatures(mockFeatures);

            // All agents should have outputFile defined
            for (const agent of dag.agents) {
                if (!['bootstrap', 'structure_builder', 'write_specs'].includes(agent.id)) {
                    expect(agent.outputFile).toBeDefined();
                    expect(agent.outputFile.length).toBeGreaterThan(0);
                    
                    // Should end with .md
                    expect(agent.outputFile.endsWith('.md')).toBe(true);
                }
            }
        });
    });
});
