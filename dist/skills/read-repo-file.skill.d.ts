/**
 * Read Repo File Skill - Reads specific files from repository
 *
 * This skill provides controlled file reading with:
 * - Path validation (security)
 * - Size limits
 * - Encoding handling
 * - Error handling
 */
import type { SkillResult, SkillExecutor } from '../agents/base.js';
export interface ReadRepoFileParams {
    repoPath: string;
    filePath: string;
    maxChars?: number;
    encoding?: BufferEncoding;
}
export interface ReadRepoFileResult {
    content: string;
    relativePath: string;
    absolutePath: string;
    size: number;
    truncated: boolean;
}
export declare class ReadRepoFileSkill implements SkillExecutor {
    readonly id = "repo_spec_zero_read_file";
    readonly name = "Read Repo File";
    readonly description = "Reads a specific file from the repository";
    private static readonly MAX_FILE_SIZE;
    private static readonly DEFAULT_MAX_CHARS;
    private static readonly BLOCKED_PATTERNS;
    private static readonly BINARY_EXTENSIONS;
    execute<T = ReadRepoFileResult>(params: Record<string, unknown>): Promise<SkillResult<T>>;
    /**
     * Read multiple files at once
     */
    readMultiple(repoPath: string, filePaths: string[], maxCharsPerFile?: number): Promise<Map<string, ReadRepoFileResult | null>>;
    /**
     * Check if a file is readable (exists, not blocked, not binary)
     */
    isReadable(repoPath: string, filePath: string): boolean;
    /**
     * Find files matching patterns in a directory
     */
    findFiles(repoPath: string, patterns: string[], options?: {
        maxResults?: number;
        recursive?: boolean;
    }): string[];
    /**
     * Simple pattern matching (supports * and **)
     */
    private matchPattern;
}
//# sourceMappingURL=read-repo-file.skill.d.ts.map