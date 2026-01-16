import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
const execAsync = promisify(exec);
export class GitManager {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    async cloneOrUpdate(repoUrl, targetDir) {
        if (this.isExistingRepo(targetDir)) {
            return this.updateRepository(targetDir);
        }
        else {
            return this.cloneRepository(repoUrl, targetDir);
        }
    }
    isExistingRepo(dir) {
        return fs.existsSync(path.join(dir, '.git'));
    }
    async updateRepository(dir) {
        this.logger.info(`Updating repository at ${dir}`);
        try {
            await execAsync('git pull', { cwd: dir });
            this.logger.info('Repository updated successfully');
            return dir;
        }
        catch (error) {
            this.logger.error(`Failed to update repo: ${error}`);
            throw error;
        }
    }
    async cloneRepository(repoUrl, targetDir) {
        this.logger.info(`Cloning repository from ${repoUrl} to ${targetDir}`);
        // Ensure parent dir exists
        fs.mkdirSync(targetDir, { recursive: true });
        try {
            await execAsync(`git clone ${repoUrl} .`, { cwd: targetDir });
            this.logger.info('Repository cloned successfully');
            return targetDir;
        }
        catch (error) {
            this.logger.error(`Failed to clone repo: ${error}`);
            // Clean up failed clone
            if (fs.existsSync(targetDir)) {
                fs.rmSync(targetDir, { recursive: true, force: true });
            }
            throw error;
        }
    }
}
//# sourceMappingURL=git-manager.js.map