/**
 * Default options for the analyze command
 */
const DEFAULT_ANALYZE_OPTIONS = {
    smartDag: true,
    diagrams: 'both',
    verbose: false,
    dryRun: false,
};
/**
 * Default options for the generate command
 */
const DEFAULT_GENERATE_OPTIONS = {
    verbose: false,
    dryRun: false,
};
/**
 * Parses and validates arguments for the Repo-Spec-Zero plugin
 */
export function parseArgs(args) {
    const command = args.command || 'analyze';
    let options = {};
    switch (command) {
        case 'analyze':
            options = {
                ...DEFAULT_ANALYZE_OPTIONS,
                ...args
            };
            // Cleanup: remove command from options
            delete options.command;
            break;
        case 'generate':
            options = {
                ...DEFAULT_GENERATE_OPTIONS,
                ...args
            };
            delete options.command;
            break;
        case 'validate':
        case 'help':
            options = {
                verbose: args.verbose || false,
                outputDir: args.outputDir
            };
            break;
        default:
            throw new Error(`Unknown command: ${command}`);
    }
    return {
        command: command,
        options
    };
}
/**
 * Validates options against expected schema for a specific command
 */
export function validateOptions(options, schema) {
    if (schema === 'analyze') {
        const analyzeOptions = options;
        if (analyzeOptions.diagrams && !['inline', 'standalone', 'both', 'none'].includes(analyzeOptions.diagrams)) {
            return false;
        }
    }
    else if (schema === 'generate') {
        const generateOptions = options;
        if (!generateOptions.type || !['api', 'component', 'entity', 'feature'].includes(generateOptions.type)) {
            return false;
        }
        if (!generateOptions.name) {
            return false;
        }
    }
    return true;
}
/**
 * Returns default options for a given command
 */
export function getDefaultOptions(command) {
    if (command === 'analyze') {
        return { ...DEFAULT_ANALYZE_OPTIONS };
    }
    return {
        verbose: false,
        dryRun: false,
    };
}
//# sourceMappingURL=cli.js.map