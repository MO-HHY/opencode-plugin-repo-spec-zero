import { AnalyzeOptions, GenerateOptions, CLIBaseOptions } from '../types';
/**
 * Parsed arguments from the command line or tool call
 */
export interface ParsedArgs {
    command: 'analyze' | 'generate' | 'validate' | 'help';
    options: AnalyzeOptions | GenerateOptions | CLIBaseOptions;
}
/**
 * Parses and validates arguments for the Repo-Spec-Zero plugin
 */
export declare function parseArgs(args: Record<string, any>): ParsedArgs;
/**
 * Validates options against expected schema for a specific command
 */
export declare function validateOptions(options: any, schema: 'analyze' | 'generate'): boolean;
/**
 * Returns default options for a given command
 */
export declare function getDefaultOptions(command: string): CLIBaseOptions;
//# sourceMappingURL=cli.d.ts.map