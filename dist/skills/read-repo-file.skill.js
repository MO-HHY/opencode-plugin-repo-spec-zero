/**
 * Read Repo File Skill - Reads specific files from repository
 *
 * This skill provides controlled file reading with:
 * - Path validation (security)
 * - Size limits
 * - Encoding handling
 * - Error handling
 */
import * as fs from 'fs';
import * as path from 'path';
export class ReadRepoFileSkill {
    id = 'repo_spec_zero_read_file';
    name = 'Read Repo File';
    description = 'Reads a specific file from the repository';
    // Maximum file size to read (10MB)
    static MAX_FILE_SIZE = 10 * 1024 * 1024;
    // Default max chars if not specified
    static DEFAULT_MAX_CHARS = 50000;
    // Blocked file patterns (security)
    static BLOCKED_PATTERNS = [
        /\.env$/,
        /\.env\..+$/,
        /credentials\.json$/,
        /secrets?\.(json|yaml|yml)$/,
        /\.pem$/,
        /\.key$/,
        /id_rsa/,
        /\.p12$/,
        /\.pfx$/,
    ];
    // Binary file extensions to skip
    static BINARY_EXTENSIONS = [
        '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx',
        '.zip', '.tar', '.gz', '.rar', '.7z',
        '.exe', '.dll', '.so', '.dylib',
        '.woff', '.woff2', '.ttf', '.eot',
        '.mp3', '.mp4', '.wav', '.avi', '.mov',
    ];
    async execute(params) {
        const typedParams = params;
        const { repoPath, filePath, maxChars = ReadRepoFileSkill.DEFAULT_MAX_CHARS, encoding = 'utf-8' } = typedParams;
        // Validate inputs
        if (!repoPath || !filePath) {
            return {
                success: false,
                error: 'repoPath and filePath are required'
            };
        }
        // Resolve paths
        const absoluteRepoPath = path.resolve(repoPath);
        const absoluteFilePath = path.resolve(absoluteRepoPath, filePath);
        // Security: ensure file is within repo
        if (!absoluteFilePath.startsWith(absoluteRepoPath)) {
            return {
                success: false,
                error: 'Path traversal detected: file path is outside repository'
            };
        }
        // Check if file exists
        if (!fs.existsSync(absoluteFilePath)) {
            return {
                success: false,
                error: `File not found: ${filePath}`
            };
        }
        // Check file stats
        const stats = fs.statSync(absoluteFilePath);
        if (stats.isDirectory()) {
            return {
                success: false,
                error: `Path is a directory, not a file: ${filePath}`
            };
        }
        if (stats.size > ReadRepoFileSkill.MAX_FILE_SIZE) {
            return {
                success: false,
                error: `File too large: ${stats.size} bytes (max: ${ReadRepoFileSkill.MAX_FILE_SIZE})`
            };
        }
        // Check for blocked patterns
        for (const pattern of ReadRepoFileSkill.BLOCKED_PATTERNS) {
            if (pattern.test(filePath)) {
                return {
                    success: false,
                    error: `Blocked file pattern: ${filePath} (security restriction)`
                };
            }
        }
        // Check for binary files
        const ext = path.extname(filePath).toLowerCase();
        if (ReadRepoFileSkill.BINARY_EXTENSIONS.includes(ext)) {
            return {
                success: false,
                error: `Binary file detected: ${filePath} (extension: ${ext})`
            };
        }
        try {
            // Read file
            let content = fs.readFileSync(absoluteFilePath, encoding);
            let truncated = false;
            // Apply max chars limit
            if (content.length > maxChars) {
                content = content.slice(0, maxChars);
                truncated = true;
            }
            const result = {
                content,
                relativePath: filePath,
                absolutePath: absoluteFilePath,
                size: stats.size,
                truncated
            };
            return {
                success: true,
                data: result,
                metadata: {
                    bytesRead: content.length,
                    originalSize: stats.size,
                    truncated
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to read file: ${error.message}`
            };
        }
    }
    /**
     * Read multiple files at once
     */
    async readMultiple(repoPath, filePaths, maxCharsPerFile = 5000) {
        const results = new Map();
        for (const filePath of filePaths) {
            const result = await this.execute({
                repoPath,
                filePath,
                maxChars: maxCharsPerFile
            });
            if (result.success && result.data) {
                results.set(filePath, result.data);
            }
            else {
                results.set(filePath, null);
            }
        }
        return results;
    }
    /**
     * Check if a file is readable (exists, not blocked, not binary)
     */
    isReadable(repoPath, filePath) {
        const absoluteRepoPath = path.resolve(repoPath);
        const absoluteFilePath = path.resolve(absoluteRepoPath, filePath);
        // Check path traversal
        if (!absoluteFilePath.startsWith(absoluteRepoPath)) {
            return false;
        }
        // Check exists
        if (!fs.existsSync(absoluteFilePath)) {
            return false;
        }
        // Check not directory
        const stats = fs.statSync(absoluteFilePath);
        if (stats.isDirectory()) {
            return false;
        }
        // Check not blocked
        for (const pattern of ReadRepoFileSkill.BLOCKED_PATTERNS) {
            if (pattern.test(filePath)) {
                return false;
            }
        }
        // Check not binary
        const ext = path.extname(filePath).toLowerCase();
        if (ReadRepoFileSkill.BINARY_EXTENSIONS.includes(ext)) {
            return false;
        }
        return true;
    }
    /**
     * Find files matching patterns in a directory
     */
    findFiles(repoPath, patterns, options = {}) {
        const { maxResults = 100, recursive = true } = options;
        const matches = [];
        const absoluteRepoPath = path.resolve(repoPath);
        const scan = (dir, depth = 0) => {
            if (matches.length >= maxResults)
                return;
            if (!recursive && depth > 0)
                return;
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (matches.length >= maxResults)
                        break;
                    const fullPath = path.join(dir, entry.name);
                    const relativePath = path.relative(absoluteRepoPath, fullPath);
                    // Skip node_modules, .git, etc.
                    if (entry.isDirectory()) {
                        if (['node_modules', '.git', 'dist', 'build', '.next', '__pycache__'].includes(entry.name)) {
                            continue;
                        }
                        scan(fullPath, depth + 1);
                    }
                    else {
                        // Check against patterns
                        for (const pattern of patterns) {
                            if (this.matchPattern(relativePath, pattern)) {
                                if (this.isReadable(repoPath, relativePath)) {
                                    matches.push(relativePath);
                                }
                                break;
                            }
                        }
                    }
                }
            }
            catch (e) {
                // Ignore permission errors etc.
            }
        };
        scan(absoluteRepoPath);
        return matches;
    }
    /**
     * Simple pattern matching (supports * and **)
     */
    matchPattern(filePath, pattern) {
        // Convert pattern to regex
        const regexPattern = pattern
            .replace(/\*\*/g, '{{DOUBLE_STAR}}')
            .replace(/\*/g, '[^/]*')
            .replace(/{{DOUBLE_STAR}}/g, '.*')
            .replace(/\./g, '\\.')
            .replace(/\//g, '[\\\\/]');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(filePath);
    }
}
//# sourceMappingURL=read-repo-file.skill.js.map