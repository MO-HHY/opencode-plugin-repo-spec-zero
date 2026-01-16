import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from '../core/config.js';
export class BuildRepoTreeSkill {
    generateTree(repoPath) {
        return this.buildTree(repoPath, "");
    }
    buildTree(currentPath, prefix) {
        let output = "";
        if (!fs.existsSync(currentPath))
            return output;
        const items = fs.readdirSync(currentPath).sort();
        // Filter out .git, node_modules, etc.
        const filteredItems = items.filter(item => !['.git', 'node_modules', '.DS_Store'].includes(item));
        filteredItems.forEach((item, index) => {
            const fullPath = path.join(currentPath, item);
            const isLast = index === filteredItems.length - 1;
            const connector = isLast ? "└── " : "├── ";
            const childPrefix = isLast ? "    " : "│   ";
            const stats = fs.statSync(fullPath);
            const icon = stats.isDirectory() ? CONFIG.DIR_ICON : CONFIG.FILE_ICON;
            output += `${prefix}${connector}${icon} ${item}\n`;
            if (stats.isDirectory()) {
                output += this.buildTree(fullPath, prefix + childPrefix);
            }
        });
        return output;
    }
}
//# sourceMappingURL=build-repo-tree.skill.js.map