
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const TEMP_DIR = join(process.cwd(), 'temp', 'installer-test');

function log(msg: string) {
    console.log(`[VerifyInstaller] ${msg}`);
}

async function main() {
    log(`Cleaning temp dir: ${TEMP_DIR}`);
    if (existsSync(TEMP_DIR)) {
        rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEMP_DIR, { recursive: true });

    // Path to the compiled installer script
    const installerScript = join(process.cwd(), 'dist', 'bin', 'install.js');

    log(`Running installer in ${TEMP_DIR}...`);
    const result = spawnSync('node', [installerScript], {
        cwd: TEMP_DIR,
        stdio: 'inherit',
        env: { ...process.env, NODE_AUTH_TOKEN: 'dummy-token-for-test' } // Mock token
    });

    if (result.status !== 0) {
        // Installing npm deps might fail with dummy token, but the structure creation should happen BEFORE npm install?
        // Wait, the script runs `npm install` at step 5.
        // If npm install fails, the script exits.
        // We expect it to fail on npm install with dummy token if it tries to fetch from private registry.
        // BUT we want to verify the file creation which happens BEFORE.
        // Let's check if files exist even if it failed.
        log('Installer exited with status ' + result.status + ' (Expected failure due to dummy token, but checking files...)');
    }

    // Verification Checks
    const checks = [
        join(TEMP_DIR, '.opencode'),
        join(TEMP_DIR, '.opencode', '.npmrc'),
        join(TEMP_DIR, '.opencode', 'package.json'),
        join(TEMP_DIR, '.opencode', 'plugin', 'repo-spec-zero.ts'),
        join(TEMP_DIR, 'opencode.json')
    ];

    let success = true;
    for (const path of checks) {
        if (existsSync(path)) {
            log(`✅ Found: ${path.replace(TEMP_DIR, '')}`);
        } else {
            log(`❌ Missing: ${path.replace(TEMP_DIR, '')}`);
            success = false;
        }
    }

    if (success) {
        // Verify opencode.json content
        const config = JSON.parse(readFileSync(join(TEMP_DIR, 'opencode.json'), 'utf-8'));
        if (config.plugin && config.plugin.includes("./.opencode/plugin/repo-spec-zero.ts")) {
            log(`✅ opencode.json contains correct plugin path.`);
        } else {
            log(`❌ opencode.json missing plugin path.`);
            success = false;
        }
    }

    if (success) {
        log('🎉 Installer Verification Passed (Structure Created correctly)');
    } else {
        log('💥 Verification Failed');
        process.exit(1);
    }
}

main();
