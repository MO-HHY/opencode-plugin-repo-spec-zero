/**
 * SmartDAGPlanner - Builds dynamic DAG based on detected features
 *
 * Unlike static DAG, this:
 * 1. Uses feature detection to determine necessary agents
 * 2. Assigns prompts to each agent
 * 3. Optimizes parallelism
 * 4. Skips irrelevant agents
 */
import { PlannedAgent, PlannedDAG, DetectedFeatures, SkipResult } from '../types.js';
import { PromptRegistry } from './prompt-registry.js';
import { FeatureDetector } from './feature-detector.js';
export declare class SmartDAGPlanner {
    private registry;
    private featureDetector;
    constructor(registry: PromptRegistry, featureDetector: FeatureDetector);
    /**
     * Plan DAG for a repository
     */
    plan(repoPath: string): Promise<PlannedDAG>;
    /**
     * Plan DAG from pre-detected features (skip detection)
     */
    planFromFeatures(features: DetectedFeatures): PlannedDAG;
    /**
     * Select agents based on detected features
     * Layers 0-4: Bootstrap, Overview, Architecture, Domain, Modules
     */
    private selectAgents;
    /**
     * Helper: Select agents for Layers 5-8
     * Layer 5: API (REST, GraphQL)
     * Layer 6: Data (Database)
     * Layer 7: Auth (Authentication, Authorization)
     * Layer 8: UI Components
     */
    private selectAgentsLayer5to8;
    /**
     * Helper: Select agents for Layers 9-12
     * Layer 9: Integration (External services, Dependencies)
     * Layer 10: Ops (Deployment, CI/CD)
     * Layer 11: Security Audit
     * Layer 12: Summary
     */
    private selectAgentsLayer9to12;
    /**
     * Build execution layers from agents
     */
    private buildLayers;
    /**
     * Assign and override prompts for specific frameworks
     */
    private assignPrompts;
    /**
     * Resolve special '*' dependencies to actual agent IDs
     */
    private resolveDependencies;
    /**
     * Estimate execution duration
     */
    private estimateDuration;
    /**
     * Determine if an agent should be skipped
     */
    shouldSkipAgent(agent: PlannedAgent, features: DetectedFeatures, completedAgents: Set<string>, failedAgents: Set<string>): SkipResult;
    /**
     * Validate DAG for circular dependencies and missing deps
     */
    validateDAG(dag: PlannedDAG): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=smart-dag-planner.d.ts.map