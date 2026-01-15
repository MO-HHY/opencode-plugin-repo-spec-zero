#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

// Configuration
const PLUGIN_PKG = '@mo-hhy/opencode-plugin-repo-spec-zero';
// We set a default range, but usually we want to match the version of the installer if executed via npx from the same package
// But since the package IS the plugin, we can use the package's own version if we read it, or just use 'latest' or a caret range.
const DEFAULT_PLUGIN_RANGE = '^0.1.0';

function log(msg: string) {
    console.log(`[RepoSpecZero Installer] ${msg}`);
}

function ensureDir(path: string) {
    if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
    }
}

function writeJson(path: string, data: any) {
    ensureDir(dirname(path));
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

function readJson(path: string): any {
    if (!existsSync(path)) return {};
    return JSON.parse(readFileSync(path, 'utf-8'));
}

async function main() {
    const repoRoot = process.cwd();
    const opencodeDir = join(repoRoot, '.opencode');

    log(`Target Workspace: ${repoRoot}`);
    log(`OpenCode Directory: ${opencodeDir}`);

    // 1. Ensure .opencode directory
    ensureDir(opencodeDir);

    // 2. Ensure .npmrc (for GitHub Packages Auth)
    const npmrcPath = join(opencodeDir, '.npmrc');
    if (!existsSync(npmrcPath)) {
        log('Creating .npmrc...');
        const content = `@mo-hhy:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=\${NODE_AUTH_TOKEN}\n`;
        writeFileSync(npmrcPath, content, 'utf-8');
    }

    // 3. Ensure .opencode/package.json
    const pkgPath = join(opencodeDir, 'package.json');
    const pkg = readJson(pkgPath);
    pkg.dependencies = pkg.dependencies || {};

    // Only update if missing or different? For now, enforce it.
    if (!pkg.dependencies[PLUGIN_PKG]) {
        log(`Adding dependency: ${PLUGIN_PKG}`);
        pkg.dependencies[PLUGIN_PKG] = DEFAULT_PLUGIN_RANGE;
        // Also add necessary peers if not transitive? 
        // @opencode-ai/plugin might be needed if not deduped, but let's assume npm handles it.
        // We might want to add @opencode-ai/plugin explicitly to be safe + types.
        if (!pkg.dependencies['@opencode-ai/plugin']) {
            pkg.dependencies['@opencode-ai/plugin'] = 'latest';
        }
        writeJson(pkgPath, pkg);
    }

    // 4. Create Loader: .opencode/plugin/repo-spec-zero.ts
    const loaderPath = join(opencodeDir, 'plugin', 'repo-spec-zero.ts');
    if (!existsSync(loaderPath)) {
        log('Creating plugin loader...');
        const loaderContent = `
let pluginModule: any;
try {
  pluginModule = await import('${PLUGIN_PKG}');
} catch {
  // Fallback for local dev or misconfiguration
  console.warn('Failed to load ${PLUGIN_PKG}, checking local dist...');
  try {
      // Allow relative loading if mapped locally
      pluginModule = await import('./${PLUGIN_PKG}/dist/index.js');
  } catch (e) {
      console.error('Could not load plugin ${PLUGIN_PKG}', e);
  }
}

const plugin = pluginModule?.default ?? pluginModule;
export default plugin;
`;
        ensureDir(dirname(loaderPath));
        writeFileSync(loaderPath, loaderContent.trim(), 'utf-8');
    }

    // 5. Ensure Root opencode.json
    const configPath = join(repoRoot, 'opencode.json');
    if (!existsSync(configPath)) {
        log('Creating opencode.json...');
        const config = {
            "$schema": "https://raw.githubusercontent.com/opencode-ai/opencode/main/schemas/opencode.schema.json",
            "name": "HANDHY SPEC-OS",
            "description": "Knowledge Graph OS for Technical Documentation",
            "plugin": []
            // We intentionally leave plugin empty or add the relative path?
            // The loader is in .opencode/plugin/repo-spec-zero.ts.
            // OpenCode usually auto-discovers .opencode/plugin/*.ts if "plugin" is NOT specified or matches pattern.
            // But spec template has `plugin: ["./.opencode/plugin/spec-os.ts"]`.
            // Let's add it explicitly to be safe.
        };
        // Add our plugin to the list
        (config.plugin as string[]).push("./.opencode/plugin/repo-spec-zero.ts");

        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    } else {
        // If exists, ensure plugin is in list
        const config = readJson(configPath);
        const pluginEntry = "./.opencode/plugin/repo-spec-zero.ts";
        config.plugin = config.plugin || [];
        if (!config.plugin.includes(pluginEntry)) {
            log('Updating opencode.json with plugin entry...');
            config.plugin.push(pluginEntry);
            writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        }
    }

    // 6. Run npm install in .opencode
    log('Running npm install in .opencode...');
    const result = spawnSync('npm', ['install'], {
        cwd: opencodeDir,
        stdio: 'inherit',
        env: process.env // Pass through env for NODE_AUTH_TOKEN
    });

    if (result.status !== 0) {
        console.error('npm install failed. Please check your NODE_AUTH_TOKEN and permissions.');
        process.exit(1);
    }

    log('✅ Installation Complete!');
    log('Run OpenCode and type "Analyze repo..." to start.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
