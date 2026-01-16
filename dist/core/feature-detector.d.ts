/**
 * FeatureDetector - Detects repository characteristics
 *
 * Analyzes repository to determine:
 * - Repository type (backend, frontend, fullstack, etc.)
 * - Programming languages used
 * - Frameworks detected
 * - Feature flags (API, DB, Auth, etc.)
 * - Directory structure patterns
 */
import { DetectedFeatures } from '../types';
export declare class FeatureDetector {
    /**
     * Main entry point - detect all features of a repository
     */
    detect(repoPath: string): Promise<DetectedFeatures>;
    /**
     * Detect frameworks and features from package files
     */
    private detectFromPackageFiles;
    /**
     * Detect directory structure patterns
     */
    private detectStructure;
    /**
     * Detect programming languages from file extensions
     */
    private detectLanguages;
    /**
     * Detect features from code patterns in key files
     */
    private detectPatterns;
    /**
     * Determine the repository type based on detected features
     */
    private determineRepoType;
    /**
     * Detect which package manager is used
     */
    private detectPackageManager;
    /**
     * Find entry point files
     */
    private findEntryPoints;
}
//# sourceMappingURL=feature-detector.d.ts.map