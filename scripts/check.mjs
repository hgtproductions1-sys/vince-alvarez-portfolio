import { readFile, access, readdir } from 'node:fs/promises';
import { resolve, extname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const built = process.argv.includes('--dist');
const base = built ? resolve(root, 'dist') : root;
const pages = ['index.html', 'work/fitness-vault/index.html', 'work/the-faceless-prompts/index.html', 'concepts/forme/index.html', 'concepts/slow-tide/index.html', 'concepts/common-ground/index.html', 'concepts/sora-reyes/index.html', 'concepts/mara-solis/index.html', 'concepts/foundry-build/index.html'];
const issues = [];
const exists = async path => { try { await access(path); return true; } catch { return false; } };
const cache = new Map();
async function read(path) { if (!cache.has(path)) cache.set(path, await readFile(path, 'utf8')); return cache.get(path); }
function localReference(value, page) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return null;
  const reference = new URL(value, `https://portfolio.local/${page}`);
  return { pathname: decodeURIComponent(reference.pathname), hash: decodeURIComponent(reference.hash.slice(1)) };
}
for (const page of pages) {
  const file = resolve(base, page);
  if (!await exists(file)) { issues.push(`${page}: page missing`); continue; }
  const html = await read(file);
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) issues.push(`${page}: expected one page heading`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) issues.push(`${page}: missing page description`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) issues.push(`${page}: duplicate element IDs`);
  for (const image of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt="[^"]*"/.test(image[0])) issues.push(`${page}: image missing alt attribute`);
  const options = (html.match(/<option(?:\s|>)/g) || []).length;
  if (options !== (html.match(/<\/option>/g) || []).length) issues.push(`${page}: malformed select options`);
  const references = [
    ...[...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(match => match[1]),
    ...[...html.matchAll(/\bsrcset="([^"]+)"/g)].flatMap(match => match[1].split(',').map(candidate => candidate.trim().split(/\s+/)[0])),
  ];
  for (const value of references) {
    let reference;
    try { reference = localReference(value, page); }
    catch { issues.push(`${page}: malformed local reference ${value}`); continue; }
    if (!reference) continue;
    const { pathname, hash } = reference;
    let target = resolve(base, pathname.slice(1));
    if (pathname.endsWith('/')) target = resolve(target, 'index.html');
    if (relative(base, target).split(/[\\/]/).includes('..')) { issues.push(`${page}: local reference leaves publication root ${value}`); continue; }
    if (!await exists(target) && !built) target = resolve(root, 'public', pathname.slice(1));
    if (!await exists(target)) { issues.push(`${page}: broken local reference ${value}`); continue; }
    if (hash && extname(target) === '.html') {
      if (!(await read(target)).includes(`id="${hash}"`)) issues.push(`${page}: missing anchor ${value}`);
    }
  }
  if (page.startsWith('concepts/') && !html.includes('Fictional concept')) issues.push(`${page}: concept disclosure missing`);
}
if (!built) {
  for (const file of await readdir(resolve(root, 'src'))) {
    if (!file.endsWith('.js')) continue;
    const result = spawnSync(process.execPath, ['--check', resolve(root, 'src', file)], { encoding: 'utf8' });
    if (result.status !== 0) issues.push(`${file}: ${result.stderr}`);
  }
}
if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
else console.log(`PASS: ${pages.length} ${built ? 'built' : 'source'} pages; local links, anchors, assets, image labels, page metadata, and form option markup. ${built ? '' : 'JavaScript syntax checked.'}`);
