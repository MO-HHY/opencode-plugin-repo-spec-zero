export declare class GitManager {
    private logger;
    constructor(logger: {
        info: (msg: string) => void;
        error: (msg: string) => void;
    });
    cloneOrUpdate(repoUrl: string, targetDir: string): Promise<string>;
    private isExistingRepo;
    private updateRepository;
    private cloneRepository;
}
//# sourceMappingURL=git-manager.d.ts.map