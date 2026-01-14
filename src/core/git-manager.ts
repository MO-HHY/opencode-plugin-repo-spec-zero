import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export class GitManager {
    constructor(private logger: { info: (msg: string) => void; error: (msg: string) => void }) { }

    async cloneOrUpdate(repoUrl: string, targetDir: string): Promise<string> {
        if (this.isExistingRepo(targetDir)) {
            return this.updateRepository(targetDir);
        } else {
            return this.cloneRepository(repoUrl, targetDir);
        }
    }

    private isExistingRepo(dir: string): boolean {
        return fs.existsSync(path.join(dir, '.git'));
    }

    private async updateRepository(dir: string): Promise<string> {
        this.logger.info(`Updating repository at ${dir}`);
        try {
            await execAsync('git pull', { cwd: dir });
            this.logger.info('Repository updated successfully');
            return dir;
        } catch (error) {
            this.logger.error(`Failed to update repo: ${error}`);
            throw error;
        }
    }

    private async cloneRepository(repoUrl: string, targetDir: string): Promise<string> {
        this.logger.info(`Cloning repository from ${repoUrl} to ${targetDir}`);

        // Ensure parent dir exists
        fs.mkdirSync(targetDir, { recursive: true });

        try {
            await execAsync(`git clone ${repoUrl} .`, { cwd: targetDir });
            this.logger.info('Repository cloned successfully');
            return targetDir;
        } catch (error) {
            this.logger.error(`Failed to clone repo: ${error}`);
            // Clean up failed clone
            if (fs.existsSync(targetDir)) {
                fs.rmSync(targetDir, { recursive: true, force: true });
            }
            throw error;
        }
    }
}
