import { GitManager } from '../core/git-manager.js';
export class GitSkill {
    gitManager;
    constructor(logger) {
        this.gitManager = new GitManager(logger);
    }
    async cloneOrUpdate(repoUrl, targetDir) {
        return this.gitManager.cloneOrUpdate(repoUrl, targetDir);
    }
}
//# sourceMappingURL=git.skill.js.map