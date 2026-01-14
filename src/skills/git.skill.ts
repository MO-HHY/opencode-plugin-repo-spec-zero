import { GitManager } from '../core/git-manager.js';

export class GitSkill {
    private gitManager: GitManager;

    constructor(logger: any) {
        this.gitManager = new GitManager(logger);
    }

    async cloneOrUpdate(repoUrl: string, targetDir: string): Promise<string> {
        return this.gitManager.cloneOrUpdate(repoUrl, targetDir);
    }
}
