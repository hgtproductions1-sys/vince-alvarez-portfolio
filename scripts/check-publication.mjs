import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, posix } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname, '..');
if (!process.argv[2]) throw new Error('Provide the publication manifest JSON path.');
const inventory = JSON.parse(await readFile(resolve(root, process.argv[2]), 'utf8'));
if (!Array.isArray(inventory) || inventory.length === 0) throw new Error('Publication inventory is empty.');
const files = new Set(inventory.map(entry => entry.file));
for (const page of ['index.html','work/fitness-vault/index.html','work/the-faceless-prompts/index.html','concepts/forme/index.html','concepts/slow-tide/index.html','concepts/common-ground/index.html','concepts/sora-reyes/index.html','concepts/mara-solis/index.html','concepts/foundry-build/index.html']) {
  if (!files.has(page)) throw new Error('Page absent from publication: ' + page);
}
for (const entry of inventory) {
  const bytes = await readFile(resolve(root, 'dist', entry.file));
  if (bytes.length !== entry.size || createHash('sha1').update(bytes).digest('hex') !== entry.sha) throw new Error('Stale publication file: ' + entry.file);
}
const images = new Set(), missing = new Set();
if (files.has('animation/blueprint/finished.webp')) {
  for (const width of [640, 960]) for (let frame = 0; frame < 48; frame++) {
    const file = `animation/blueprint/${width}/${String(frame).padStart(3, '0')}.webp`;
    if (!files.has(file)) throw Error('Animation frame absent from publication: ' + file);
  }
}
for (const file of files) {
  if (!/\.(?:html|css|js)$/.test(file)) continue;
  const text = await readFile(resolve(root, 'dist', file), 'utf8');
  const references = [
    ...text.matchAll(/\b(?:src|href|poster)=["']([^"']+)["']/g),
    ...[...text.matchAll(/\bsrcset=["']([^"']+)["']/g)].flatMap(match => match[1].split(',').map(candidate => [candidate, candidate.trim().split(/\s+/)[0]])),
    ...text.matchAll(/url\(\s*["']?([^\s)"']+)/g),
    ...text.matchAll(/["'`](\/(?:images|audio)\/[^"'`\s]+)["'`]/g),
    ...text.matchAll(/\bimage:["']([^"']+\.(?:jpg|png|webp))["']/g),
  ];
  for (const match of references) {
    let url = match[1];
    if (match[0].startsWith('image:')) url = '/images/' + url;
    if (/^(?:[a-z]+:|\/\/|#)/i.test(url)) continue;
    const path = decodeURIComponent(url.split(/[?#]/)[0]);
    if (!path || path.includes('${')) continue;
    let target = path.startsWith('/') ? path.slice(1) : posix.join(dirname(file).replaceAll('\\', '/'), path);
    if (!target || target.endsWith('/')) target += 'index.html';
    if (!files.has(target)) missing.add(`${file}: ${url}`);
    if (/\.(?:png|jpe?g|webp|avif|svg)$/i.test(target)) images.add('/' + target);
  }
}
if (missing.size) throw new Error('Missing from publication:\n' + [...missing].join('\n'));
console.log(`PASS: referenced local assets are included in the ${files.size}-file publication inventory.`);
await writeFile(resolve(dirname(resolve(root, process.argv[2])), 'published-image-paths.json'), JSON.stringify([...images].sort(), null, 2) + '\n');
