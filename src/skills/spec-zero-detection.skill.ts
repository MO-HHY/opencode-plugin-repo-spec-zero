import * as fs from 'fs';
import * as path from 'path';

// Embedded configuration from prompt_selector.json
const DETECTION_CONFIG = {
    repository_types: [
        {
            type: "infra-as-code",
            detection_patterns: {
                files: ["*.tf", "*.tfvars", "terraform.tfstate", "ansible.cfg", "playbook*.yml", "Chart.yaml", "values.yaml", "*.cfn.json", "*.cfn.yaml", "template.yaml", "serverless.yml", "atlantis.yaml", ".gitlab-ci.yml", "Jenkinsfile"],
                directories: ["terraform/", "ansible/", "helm/", "charts/", "cloudformation/", "infrastructure/", "deployments/", "k8s/", "kubernetes/"],
                keywords: ["terraform", "provider", "resource", "module", "ansible", "playbook", "kubernetes", "helm", "infrastructure"]
            }
        },
        {
            type: "frontend",
            detection_patterns: {
                files: ["package.json", "index.html", "*.jsx", "*.tsx", "*.vue", "angular.json", "webpack.config.js", "vite.config.js", ".eslintrc.js", "tsconfig.json"],
                directories: ["src/components/", "src/pages/", "src/views/", "src/app/", "public/", "assets/", "styles/", "css/"],
                dependencies: ["react", "vue", "angular", "svelte", "next", "nuxt", "gatsby", "webpack", "vite", "@angular/core"],
                keywords: ["component", "useState", "useEffect", "render", "props", "jsx", "tsx", "frontend", "ui"]
            }
        },
        {
            type: "backend",
            detection_patterns: {
                files: ["requirements.txt", "setup.py", "pyproject.toml", "Pipfile", "poetry.lock", "Gemfile", "Gemfile.lock", "Rakefile", "config.ru", "*.py", "*.rb", "manage.py", "wsgi.py", "asgi.py", "application.rb", "routes.rb"],
                directories: ["app/", "api/", "controllers/", "models/", "services/", "views/", "serializers/", "db/", "config/", "lib/", "spec/", "test/", "tests/", "migrations/", "workers/", "workflows/", "activities/", "jobs/", "mailers/"],
                dependencies: ["django", "flask", "fastapi", "celery", "sqlalchemy", "pandas", "numpy", "requests", "boto3", "rails", "sinatra", "resque", "sidekiq", "activerecord", "puma", "unicorn"],
                keywords: ["api", "endpoint", "route", "controller", "service", "model", "view", "serializer", "migration", "activerecord", "django", "flask", "fastapi", "rails", "rest", "graphql", "celery", "sidekiq", "orm"]
            }
        },
        {
            type: "libraries",
            detection_patterns: {
                files: ["setup.py", "setup.cfg", "pyproject.toml", "package.json", "tsconfig.json", "rollup.config.js", "webpack.config.js", ".npmignore", "LICENSE", "*.d.ts"],
                directories: ["lib/", "src/", "dist/", "build/", "examples/", "docs/", "types/"],
                package_indicators: {
                    "npm": ["main", "module", "types", "exports"],
                    "python": ["packages", "py_modules"],
                    "java": ["groupId", "artifactId"]
                },
                keywords: ["library", "sdk", "package", "module", "export", "public api", "dist", "bundle"]
            }
        },
        {
            type: "generic",
            detection_patterns: { default: true }
        }
    ],
    detection_strategy: {
        priority_order: ["infra-as-code", "libraries", "frontend", "backend", "generic"],
        min_confidence_score: 0.15,
        scoring_weights: {
            files: 0.5,
            directories: 0.3,
            dependencies: 0.15,
            keywords: 0.05
        }
    }
};

export class SpecZeroDetectionSkill {
    async detect(repoPath: string): Promise<string> {
        console.log(`Detecting repo type for: ${repoPath}`);

        const fileList = await this.getFileList(repoPath);
        const scores: Record<string, number> = {};

        for (const typeConfig of DETECTION_CONFIG.repository_types) {
            if (typeConfig.type === 'generic') continue;

            let score = 0;
            const patterns = typeConfig.detection_patterns;

            // Check files
            if (patterns.files) {
                score += this.checkFiles(fileList, patterns.files) * DETECTION_CONFIG.detection_strategy.scoring_weights.files;
            }

            // Check directories
            if (patterns.directories) {
                score += this.checkDirectories(fileList, patterns.directories) * DETECTION_CONFIG.detection_strategy.scoring_weights.directories;
            }

            // Check dependencies (simplified: just check text in package.json/requirements.txt if they exist)
            if (patterns.dependencies) {
                score += await this.checkDependencies(repoPath, patterns.dependencies) * DETECTION_CONFIG.detection_strategy.scoring_weights.dependencies;
            }

            scores[typeConfig.type] = score;
        }

        // Find best match based on priority and score
        for (const type of DETECTION_CONFIG.detection_strategy.priority_order) {
            if (type === 'generic') continue;
            if ((scores[type] || 0) >= DETECTION_CONFIG.detection_strategy.min_confidence_score) {
                console.log(`Detected type: ${type} (score: ${scores[type]})`);
                return type;
            }
        }

        console.log('Detected type: generic');
        return 'generic';
    }

    private async getFileList(dir: string): Promise<string[]> {
        // Simple recursive file list, relative paths
        const files: string[] = [];

        const walk = (currentDir: string, baseDir: string) => {
            if (!fs.existsSync(currentDir)) return;
            const list = fs.readdirSync(currentDir);
            for (const file of list) {
                const fullPath = path.join(currentDir, file);
                const relativePath = path.relative(baseDir, fullPath);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    files.push(relativePath + '/'); // Add trailing slash for dir match
                    if (file !== '.git' && file !== 'node_modules') {
                        walk(fullPath, baseDir);
                    }
                } else {
                    files.push(relativePath);
                }
            }
        };

        walk(dir, dir);
        return files;
    }

    private checkFiles(fileList: string[], patterns: string[]): number {
        let matches = 0;
        for (const pattern of patterns) {
            // specific file match
            if (!pattern.includes('*')) {
                if (fileList.includes(pattern)) matches++;
            } else {
                // Wildcard match (simplified)
                const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
                if (fileList.some(f => regex.test(path.basename(f)))) matches++;
            }
        }
        return matches > 0 ? 1 : 0; // Binary score for now, can be improved
    }

    private checkDirectories(fileList: string[], patterns: string[]): number {
        let matches = 0;
        for (const pattern of patterns) {
            if (fileList.some(f => f.includes(pattern))) matches++;
        }
        return matches > 0 ? 1 : 0;
    }

    private async checkDependencies(repoPath: string, dependencies: string[]): Promise<number> {
        let matches = 0;
        // Check package.json
        const pkgJsonPath = path.join(repoPath, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
            const content = fs.readFileSync(pkgJsonPath, 'utf8');
            for (const dep of dependencies) {
                if (content.includes(`"${dep}"`)) matches++;
            }
        }
        // Check requirements.txt
        const reqPath = path.join(repoPath, 'requirements.txt');
        if (fs.existsSync(reqPath)) {
            const content = fs.readFileSync(reqPath, 'utf8');
            for (const dep of dependencies) {
                if (content.includes(dep)) matches++;
            }
        }
        return matches > 0 ? 1 : 0;
    }
}
