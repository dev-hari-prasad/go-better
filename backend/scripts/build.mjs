import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const packageManager = process.env.npm_execpath;

if (!packageManager) {
  throw new Error('This build must run through pnpm or npm.');
}

rmSync('dist', { recursive: true, force: true });
const runPackageManager = (args) => execFileSync(process.execPath, [packageManager, ...args], {
  stdio: 'inherit',
});

runPackageManager(['exec', 'tsc', '--noEmit']);
runPackageManager([
  'exec',
  'esbuild',
  'src/server.ts',
  '--bundle',
  '--platform=node',
  '--format=esm',
  '--packages=external',
  '--tree-shaking=true',
  '--minify',
  '--sourcemap',
  '--outfile=dist/server.js',
]);

mkdirSync('dist', { recursive: true });
for (const directory of ['templates', 'tempaltes']) {
  const source = `src/${directory}`;
  if (existsSync(source)) {
    cpSync(source, `dist/${directory}`, { recursive: true });
  }
}
