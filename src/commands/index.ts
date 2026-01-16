/**
 * CLI Commands for Spec-Zero v2.0.0
 * 
 * Exports:
 * - analyzeCommand: Analyze a repository (generation or audit mode)
 * - applyCommand: Apply changes from an audit report
 */

export { 
    analyzeCommand, 
    parseAnalyzeArgs, 
    printAnalyzeHelp,
    type AnalyzeOptions,
    type AnalyzeResult,
} from './analyze.js';

export { 
    applyCommand, 
    parseApplyArgs, 
    printApplyHelp,
    type ApplyCommandOptions,
    type ApplyCommandResult,
} from './apply.js';
