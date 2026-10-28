import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const release = process.argv[2];
if (!/^[a-z-]+$/.test(release || '')) throw Error('Pass a release folder name.');
const entries = [];
async function walk(folder, prefix = '') {
  for (const item of await readdir(folder, { withFileTypes: true })) {
    if (item.name.startsWith('.')) continue;
    const file = prefix + item.name;
    if (item.isDirectory()) await walk(resolve(folder, item.name), file + '/');
    else {
      const data = await readFile(resolve(folder, item.name));
      entries.push({ file, size: data.length, sha: createHash('sha1').update(data).digest('hex') });
    }
  }
}
await walk(resolve(root, 'dist'));
entries.sort((a, b) => a.file.localeCompare(b.file));
const folder = resolve(root, 'preview', release);
await mkdir(folder, { recursive: true });
await writeFile(resolve(folder, 'publication-manifest.json'), JSON.stringify(entries, null, 2) + '\n');
console.log(`Created ${entries.length}-file publication manifest (${entries.reduce((sum, item) => sum + item.size, 0)} bytes).`);
