/**
 * SmartDAGPlanner - Builds dynamic DAG based on detected features
 * 
 * Unlike static DAG, this:
 * 1. Uses feature detection to determine necessary agents
 * 2. Assigns prompts to each agent
 * 3. Optimizes parallelism
 * 4. Skips irrelevant agents
 */

import { 
    PlannedAgent, PlannedDAG, DetectedFeatures, 
    DiagramType, RepoType, FEATURE_FLAGS, SkipResult
} from '../types.js';
import { PromptRegistry } from './prompt-registry.js';
import { FeatureDetector } from './feature-detector.js';

export class SmartDAGPlanner {
    constructor(
        private registry: PromptRegistry,
        private featureDetector: FeatureDetector
    ) {}

    /**
     * Plan DAG for a repository
     */
    async plan(repoPath: string): Promise<PlannedDAG> {
        // 1. Detect features
        const features = await this.featureDetector.detect(repoPath);
        
        // 2. Select necessary agents
        const agents = this.selectAgents(features);
        
        // 3. Resolve dependencies and create layers
        const layers = this.buildLayers(agents);
        
        // 4. Assign prompts to each agent
        const withPrompts = this.assignPrompts(agents, features);
        
        return {
            version: '2.1.0',
            repoType: features.repoType,
            agents: withPrompts,
            layers,
            metadata: {
                totalAgents: agents.length,
                optionalAgents: agents.filter(a => a.optional).length,
                estimatedDuration: this.estimateDuration(agents),
                features: Array.from(features.features)
            }
        };
    }

    /**
     * Plan DAG from pre-detected features (skip detection)
     */
    planFromFeatures(features: DetectedFeatures): PlannedDAG {
        const agents = this.selectAgents(features);
        const layers = this.buildLayers(agents);
        const withPrompts = this.assignPrompts(agents, features);
        
        return {
            version: '2.1.0',
            repoType: features.repoType,
            agents: withPrompts,
            layers,
            metadata: {
                totalAgents: agents.length,
                optionalAgents: agents.filter(a => a.optional).length,
                estimatedDuration: this.estimateDuration(agents),
                features: Array.from(features.features)
            }
        };
    }

    /**
     * Select agents based on detected features
     * Layers 0-4: Bootstrap, Overview, Architecture, Domain, Modules
     */
    private selectAgents(features: DetectedFeatures): PlannedAgent[] {
        const agents: PlannedAgent[] = [];
        const { hasBackend, hasFrontend } = features.structure;
        
        // ===== LAYER 0: Bootstrap (Always) =====
        agents.push({
            id: 'bootstrap',
            promptId: 'analysis/bootstrap',
            dependencies: [],
            parallel: false,
            optional: false,
            diagrams: [],
            outputFile: '',  // No output file, just context gathering
            layer: 0
        });
        
        // ===== LAYER 1: Overview (Always) =====
        agents.push({
            id: 'overview',
            promptId: 'analysis/overview',
            templateId: 'overview',
            dependencies: ['bootstrap'],
            parallel: false,
            optional: false,
            diagrams: ['c4', 'flowchart'] as DiagramType[],
            outputFile: '00-foundation/overview.md',
            layer: 1
        });
        
        // ===== LAYER 2: Architecture (Always) =====
        agents.push({
            id: 'architecture',
            promptId: 'analysis/architecture',
            dependencies: ['overview'],
            parallel: true,
            optional: false,
            diagrams: ['c4', 'flowchart'] as DiagramType[],
            outputFile: '00-foundation/architecture.md',
            layer: 2
        });
        
        // ===== LAYER 3: Domain - Entities (Always) =====
        agents.push({
            id: 'entities',
            promptId: 'analysis/entities',
            templateId: 'entity/model',
            dependencies: ['overview'],
            parallel: true,
            optional: false,
            diagrams: ['erd', 'classDiagram'] as DiagramType[],
            outputFile: '01-domain/entities.md',
            layer: 3
        });
        
        // ===== LAYER 4: Modules (Conditional on structure) =====
        if (hasBackend) {
            agents.push({
                id: 'backend-modules',
                promptId: 'analysis/modules',
                dependencies: ['architecture'],
                parallel: true,
                optional: false,
                diagrams: ['flowchart'] as DiagramType[],
                outputFile: '02-modules/backend/index.md',
                layer: 4
            });
        }
        
        if (hasFrontend) {
            agents.push({
                id: 'frontend-modules',
                promptId: 'analysis/modules',
                dependencies: ['architecture'],
                parallel: true,
                optional: false,
                diagrams: ['flowchart'] as DiagramType[],
                outputFile: '02-modules/frontend/index.md',
                layer: 4
            });
        }
        
        // Continue with Layers 5-12 from helper methods
        agents.push(...this.selectAgentsLayer5to8(features, agents));
        agents.push(...this.selectAgentsLayer9to12(features, agents));
        
        return agents;
    }

    /**
     * Helper: Select agents for Layers 5-8
     * Layer 5: API (REST, GraphQL)
     * Layer 6: Data (Database)
     * Layer 7: Auth (Authentication, Authorization)
     * Layer 8: UI Components
     */
    private selectAgentsLayer5to8(
        features: DetectedFeatures,
        existingAgents: PlannedAgent[]
    ): PlannedAgent[] {
        const agents: PlannedAgent[] = [];
        const { hasFrontend } = features.structure;
        const hasAgent = (id: string) => existingAgents.some(a => a.id === id);
        
        // ===== LAYER 5: API (Conditional on features) =====
        if (features.features.has(FEATURE_FLAGS.HAS_REST_API)) {
            const deps = ['entities'];
            if (hasAgent('backend-modules')) deps.push('backend-modules');
            
            agents.push({
                id: 'api-rest',
                promptId: 'api/detect-endpoints',
                templateId: 'api/endpoint',
                dependencies: deps,
                parallel: true,
                optional: false,
                diagrams: ['sequence'] as DiagramType[],
                outputFile: '03-api/rest.md',
                layer: 5
            });
        }
        
        if (features.features.has(FEATURE_FLAGS.HAS_GRAPHQL)) {
            agents.push({
                id: 'api-graphql',
                promptId: 'api/detect-graphql',
                dependencies: ['entities'],
                parallel: true,
                optional: false,
                diagrams: ['classDiagram'] as DiagramType[],
                outputFile: '03-api/graphql.md',
                layer: 5
            });
        }
        
        if (features.features.has(FEATURE_FLAGS.HAS_WEBSOCKET)) {
            agents.push({
                id: 'api-websocket',
                promptId: 'api/detect-websocket',
                dependencies: ['entities'],
                parallel: true,
                optional: true,
                diagrams: ['sequence'] as DiagramType[],
                outputFile: '03-api/websocket.md',
                layer: 5
            });
        }
        
        // ===== LAYER 6: Data (Conditional on DB features) =====
        if (features.features.has(FEATURE_FLAGS.HAS_SQL_DB) || 
            features.features.has(FEATURE_FLAGS.HAS_NOSQL_DB)) {
            agents.push({
                id: 'database',
                promptId: 'data/detect-schema',
                dependencies: ['entities'],
                parallel: true,
                optional: false,
                diagrams: ['erd'] as DiagramType[],
                outputFile: '04-data/database.md',
                layer: 6
            });
        }
        
        if (features.features.has(FEATURE_FLAGS.HAS_MIGRATIONS)) {
            agents.push({
                id: 'migrations',
                promptId: 'data/detect-migrations',
                dependencies: ['database'],
                parallel: true,
                optional: true,
                diagrams: [] as DiagramType[],
                outputFile: '04-data/migrations.md',
                layer: 6
            });
        }
        
        // ===== LAYER 7: Auth (Conditional on Auth features) =====
        if (features.features.has(FEATURE_FLAGS.HAS_AUTH)) {
            // Build dependencies based on available API agents
            const allAgents = [...existingAgents, ...agents];
            const authDeps = ['api-rest', 'api-graphql']
                .filter(id => allAgents.some(a => a.id === id));
            if (authDeps.length === 0) authDeps.push('entities');
            
            agents.push({
                id: 'authentication',
                promptId: 'auth/detect-auth',
                templateId: 'auth/flow',
                dependencies: authDeps,
                parallel: true,
                optional: false,
                diagrams: ['sequence', 'stateDiagram'] as DiagramType[],
                outputFile: '05-auth/authentication.md',
                layer: 7
            });
            
            if (features.features.has(FEATURE_FLAGS.HAS_RBAC)) {
                agents.push({
                    id: 'authorization',
                    promptId: 'auth/detect-authz',
                    dependencies: ['authentication'],
                    parallel: true,
                    optional: false,
                    diagrams: ['flowchart'] as DiagramType[],
                    outputFile: '05-auth/authorization.md',
                    layer: 7
                });
            }
        }
        
        // ===== LAYER 8: UI Components (Conditional on Frontend + Framework) =====
        if (hasFrontend && (
            features.features.has(FEATURE_FLAGS.HAS_REACT) ||
            features.features.has(FEATURE_FLAGS.HAS_VUE) ||
            features.features.has(FEATURE_FLAGS.HAS_ANGULAR)
        )) {
            const componentDeps = hasAgent('frontend-modules') 
                ? ['frontend-modules'] 
                : ['architecture'];
            
            agents.push({
                id: 'components',
                promptId: 'ui/detect-components',
                templateId: 'ui/component',
                dependencies: componentDeps,
                parallel: true,
                optional: false,
                diagrams: ['classDiagram', 'flowchart'] as DiagramType[],
                outputFile: '02-modules/frontend/components.md',
                layer: 8
            });
            
            if (features.features.has(FEATURE_FLAGS.HAS_STATE_MGMT)) {
                agents.push({
                    id: 'state',
                    promptId: 'ui/analyze-state',
                    dependencies: ['components'],
                    parallel: true,
                    optional: false,
                    diagrams: ['stateDiagram', 'flowchart'] as DiagramType[],
                    outputFile: '02-modules/frontend/state.md',
                    layer: 8
                });
            }
            
            if (features.features.has(FEATURE_FLAGS.HAS_ROUTING)) {
                agents.push({
                    id: 'routing',
                    promptId: 'ui/analyze-routing',
                    dependencies: ['components'],
                    parallel: true,
                    optional: true,
                    diagrams: ['flowchart'] as DiagramType[],
                    outputFile: '02-modules/frontend/routing.md',
                    layer: 8
                });
            }
        }
        
        return agents;
    }

    /**
     * Helper: Select agents for Layers 9-12
     * Layer 9: Integration (External services, Dependencies)
     * Layer 10: Ops (Deployment, CI/CD)
     * Layer 11: Security Audit
     * Layer 12: Summary
     */
    private selectAgentsLayer9to12(
        features: DetectedFeatures,
        existingAgents: PlannedAgent[]
    ): PlannedAgent[] {
        const agents: PlannedAgent[] = [];
        const allAgents = [...existingAgents];
        const hasAgent = (id: string) => allAgents.some(a => a.id === id);
        
        // Helper to get API agent IDs
        const getApiAgentIds = () => allAgents
            .filter(a => a.id.startsWith('api-'))
            .map(a => a.id);
        
        // ===== LAYER 9: Integration =====
        const apiDeps = getApiAgentIds();
        agents.push({
            id: 'services',
            promptId: 'integration/detect-services',
            dependencies: apiDeps.length > 0 ? apiDeps : ['entities'],
            parallel: true,
            optional: true,
            diagrams: ['sequence'] as DiagramType[],
            outputFile: '06-integration/services.md',
            layer: 9
        });
        
        agents.push({
            id: 'dependencies',
            promptId: 'integration/dependencies',
            dependencies: ['bootstrap'],
            parallel: true,
            optional: false,
            diagrams: ['pie'] as DiagramType[],
            outputFile: '06-integration/dependencies.md',
            layer: 9
        });
        
        // ===== LAYER 10: Ops (Conditional on Docker/CI) =====
        if (features.structure.hasDocker || features.structure.hasCICD) {
            agents.push({
                id: 'deployment',
                promptId: 'ops/deployment',
                dependencies: ['architecture'],
                parallel: true,
                optional: true,
                diagrams: ['flowchart', 'c4'] as DiagramType[],
                outputFile: '07-ops/deployment.md',
                layer: 10
            });
        }
        
        if (features.structure.hasCICD) {
            const cicdDeps = hasAgent('deployment') || agents.some(a => a.id === 'deployment')
                ? ['deployment']
                : ['architecture'];
            
            agents.push({
                id: 'cicd',
                promptId: 'ops/cicd',
                dependencies: cicdDeps,
                parallel: true,
                optional: true,
                diagrams: ['flowchart', 'gantt'] as DiagramType[],
                outputFile: '07-ops/ci-cd.md',
                layer: 10
            });
        }
        
        if (features.structure.hasDocker && features.features.has(FEATURE_FLAGS.HAS_K8S)) {
            agents.push({
                id: 'kubernetes',
                promptId: 'ops/kubernetes',
                dependencies: ['deployment'],
                parallel: true,
                optional: true,
                diagrams: ['c4'] as DiagramType[],
                outputFile: '07-ops/kubernetes.md',
                layer: 10
            });
        }
        
        // ===== LAYER 11: Security Audit (Conditional) =====
        const securityDeps = ['authentication', 'api-rest', 'database']
            .filter(id => hasAgent(id) || allAgents.some(a => a.id === id));
        
        if (securityDeps.length > 0 || features.features.has(FEATURE_FLAGS.HAS_AUTH)) {
            agents.push({
                id: 'security',
                promptId: 'analysis/security-audit',
                dependencies: securityDeps.length > 0 ? securityDeps : ['entities'],
                parallel: false,
                optional: true,
                diagrams: ['flowchart'] as DiagramType[],
                outputFile: '05-auth/security.md',
                layer: 11
            });
        }
        
        // ===== LAYER 12: Summary (Always - Final) =====
        agents.push({
            id: 'summary',
            promptId: 'analysis/summary',
            dependencies: ['*'],  // Special: depends on all previous non-optional agents
            parallel: false,
            optional: false,
            diagrams: ['c4'] as DiagramType[],
            outputFile: 'index.md',
            layer: 12
        });
        
        // Structure builder (before write_specs)
        agents.push({
            id: 'structure_builder',
            promptId: 'finalizer/structure',
            dependencies: ['summary'],
            parallel: false,
            optional: false,
            diagrams: [],
            outputFile: '',  // Creates folder structure
            layer: 12
        });
        
        // Write specs (final)
        agents.push({
            id: 'write_specs',
            promptId: 'finalizer/write',
            dependencies: ['structure_builder'],
            parallel: false,
            optional: false,
            diagrams: [],
            outputFile: '',  // Writes all spec files
            layer: 12
        });
        
        return agents;
    }

    /**
     * Build execution layers from agents
     */
    private buildLayers(agents: PlannedAgent[]): PlannedAgent[][] {
        const layers: PlannedAgent[][] = [];
        const maxLayer = Math.max(...agents.map(a => a.layer), 0);
        
        for (let i = 0; i <= maxLayer; i++) {
            const layerAgents = agents.filter(a => a.layer === i);
            if (layerAgents.length > 0) {
                layers.push(layerAgents);
            }
        }
        
        return layers;
    }

    /**
     * Assign and override prompts for specific frameworks
     */
    private assignPrompts(
        agents: PlannedAgent[], 
        features: DetectedFeatures
    ): PlannedAgent[] {
        // First resolve '*' dependencies
        const resolved = this.resolveDependencies(agents);
        
        // Override prompts for specific frameworks
        return resolved.map(agent => {
            // Next.js specific modules
            if (agent.id === 'frontend-modules' && features.frameworks.has('nextjs')) {
                return { ...agent, promptId: 'analysis/modules-nextjs' };
            }
            
            // Nuxt.js specific modules
            if (agent.id === 'frontend-modules' && features.frameworks.has('nuxt')) {
                return { ...agent, promptId: 'analysis/modules-nuxt' };
            }
            
            // NestJS specific modules
            if (agent.id === 'backend-modules' && features.frameworks.has('nest')) {
                return { ...agent, promptId: 'analysis/modules-nestjs' };
            }
            
            // Fastify specific API detection
            if (agent.id === 'api-rest' && features.frameworks.has('fastify')) {
                return { ...agent, promptId: 'api/detect-endpoints-fastify' };
            }
            
            // Express specific API detection
            if (agent.id === 'api-rest' && features.frameworks.has('express')) {
                return { ...agent, promptId: 'api/detect-endpoints-express' };
            }
            
            // Prisma specific database
            if (agent.id === 'database' && features.features.has(FEATURE_FLAGS.HAS_ORM)) {
                // Check for specific ORM in frameworks or features
                if (features.frameworks.has('prisma')) {
                    return { ...agent, promptId: 'data/detect-schema-prisma' };
                }
            }
            
            return agent;
        });
    }

    /**
     * Resolve special '*' dependencies to actual agent IDs
     */
    private resolveDependencies(agents: PlannedAgent[]): PlannedAgent[] {
        return agents.map(agent => {
            if (agent.dependencies.includes('*')) {
                // Depends on all non-optional agents in previous layers
                const previousAgents = agents
                    .filter(a => a.layer < agent.layer && !a.optional)
                    .map(a => a.id);
                return { ...agent, dependencies: previousAgents };
            }
            return agent;
        });
    }

    /**
     * Estimate execution duration
     */
    private estimateDuration(agents: PlannedAgent[]): string {
        const layers = this.buildLayers(agents);
        
        // ~30-45s per agent, parallelism reduces total time
        let totalSeconds = 0;
        for (const layer of layers) {
            if (layer.length === 1) {
                // Sequential agent
                totalSeconds += 45;
            } else {
                // Parallel agents: time = max single + overhead per agent
                // We assume 45s for the longest agent + 10s per additional agent in parallel
                totalSeconds += 45 + ((layer.length - 1) * 10);
            }
        }
        
        const minutes = Math.ceil(totalSeconds / 60);
        return `~${minutes} min`;
    }

    /**
     * Determine if an agent should be skipped
     */
    shouldSkipAgent(
        agent: PlannedAgent,
        features: DetectedFeatures,
        completedAgents: Set<string>,
        failedAgents: Set<string>
    ): SkipResult {
        // 1. Skip if required dependency failed and agent is optional
        const failedDeps = agent.dependencies.filter(d => failedAgents.has(d));
        if (failedDeps.length > 0) {
            if (agent.optional) {
                return { skip: true, reason: `Dependency ${failedDeps[0]} failed` };
            }
            // Non-optional agent with failed dep - this is an error condition
            // but we continue and let the executor handle it
        }
        
        // 2. Skip if required dependency not completed (not ready yet)
        const pendingDeps = agent.dependencies.filter(
            d => !completedAgents.has(d) && !failedAgents.has(d)
        );
        if (pendingDeps.length > 0) {
            return { skip: true, reason: `Waiting for dependency ${pendingDeps[0]}` };
        }
        
        // 3. Feature-based skip rules
        const featureRequirements: Record<string, string[]> = {
            'api-rest': [FEATURE_FLAGS.HAS_REST_API],
            'api-graphql': [FEATURE_FLAGS.HAS_GRAPHQL],
            'api-websocket': [FEATURE_FLAGS.HAS_WEBSOCKET],
            'database': [FEATURE_FLAGS.HAS_SQL_DB, FEATURE_FLAGS.HAS_NOSQL_DB],
            'authentication': [FEATURE_FLAGS.HAS_AUTH],
            'authorization': [FEATURE_FLAGS.HAS_RBAC],
            'components': [FEATURE_FLAGS.HAS_REACT, FEATURE_FLAGS.HAS_VUE, FEATURE_FLAGS.HAS_ANGULAR],
            'state': [FEATURE_FLAGS.HAS_STATE_MGMT],
            'routing': [FEATURE_FLAGS.HAS_ROUTING],
        };
        
        const required = featureRequirements[agent.id];
        if (required) {
            const hasAny = required.some(f => features.features.has(f));
            if (!hasAny && agent.optional) {
                return { skip: true, reason: `Missing required features: ${required.join(' or ')}` };
            }
        }
        
        // 4. Structure-based skip rules
        if (agent.id === 'backend-modules' && !features.structure.hasBackend) {
            return { skip: true, reason: 'No backend structure detected' };
        }
        if (agent.id === 'frontend-modules' && !features.structure.hasFrontend) {
            return { skip: true, reason: 'No frontend structure detected' };
        }
        if (agent.id === 'deployment' && !features.structure.hasDocker && !features.structure.hasCICD) {
            return { skip: true, reason: 'No Docker or CI/CD detected' };
        }
        if (agent.id === 'cicd' && !features.structure.hasCICD) {
            return { skip: true, reason: 'No CI/CD configuration detected' };
        }
        
        // No skip
        return { skip: false };
    }

    /**
     * Filter agents based on skip rules (pre-execution filtering)
     */
    filterAgents(dag: PlannedDAG, features: DetectedFeatures): PlannedDAG {
        const completedAgents = new Set<string>();
        const failedAgents = new Set<string>();
        
        const filteredAgents = dag.agents.filter(agent => {
            const result = this.shouldSkipAgent(agent, features, completedAgents, failedAgents);
            if (!result.skip) {
                completedAgents.add(agent.id);
                return true;
            }
            console.log(`[DAG] Skipping ${agent.id}: ${result.reason}`);
            return false;
        });
        
        return {
            ...dag,
            agents: filteredAgents,
            layers: this.buildLayers(filteredAgents),
            metadata: {
                ...dag.metadata,
                totalAgents: filteredAgents.length,
                optionalAgents: filteredAgents.filter(a => a.optional).length
            }
        };
    }

    /**
     * Validate DAG for circular dependencies and missing deps
     */
    validateDAG(dag: PlannedDAG): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const agentIds = new Set(dag.agents.map(a => a.id));
        
        for (const agent of dag.agents) {
            // Check dependencies exist
            for (const dep of agent.dependencies) {
                if (dep !== '*' && !agentIds.has(dep)) {
                    errors.push(`Agent ${agent.id} depends on non-existent agent ${dep}`);
                }
            }
            
            // Check no circular dependencies
            if (agent.dependencies.includes(agent.id)) {
                errors.push(`Agent ${agent.id} has circular dependency on itself`);
            }
        }
        
        return { valid: errors.length === 0, errors };
    }
}
