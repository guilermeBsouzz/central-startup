import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const projectRoot = new URL('../', import.meta.url);

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) files.push(...await sourceFiles(url));
    else if (/\.(?:js|mjs|cjs)$/.test(entry.name)) files.push(fileURLToPath(url));
  }
  return files;
}

const files = [
  fileURLToPath(new URL('server.cjs', projectRoot)),
  ...await sourceFiles(new URL('src/client/scripts/', projectRoot)),
  ...await sourceFiles(new URL('scripts/', projectRoot)),
  ...await sourceFiles(new URL('tests/', projectRoot)),
];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`Sintaxe validada: ${files.length} arquivos JavaScript.`);
