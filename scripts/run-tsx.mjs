import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
// Keep this path *relative* to avoid macOS unix-socket path length limits.
const tmpDir = 'temp/tsx-tmp';
mkdirSync(resolve(projectRoot, tmpDir), { recursive: true });

const tsxCli = resolve(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [tsxCli, ...args], {
    stdio: 'inherit',
    env: {
        ...process.env,
        TMPDIR: tmpDir,
        TMP: tmpDir,
        TEMP: tmpDir,
    },
});

process.exit(result.status ?? 1);
