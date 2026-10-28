import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const folder = resolve(root, 'output/concept-expansion');
const manifest = JSON.parse(await readFile(resolve(folder, 'generation-inputs.json'), 'utf8'));
await mkdir(resolve(folder, 'originals'), { recursive: true });
const prepared = [];
for (const asset of manifest) {
  const original = resolve(folder, 'originals', `${asset.name}.png`);
  await copyFile(asset.source, original);
  const variants = [];
  for (const width of [1280, 640]) {
    const name = `${asset.name}${width === 640 ? '-640' : ''}.webp`;
    const path = resolve(root, 'public/images', name);
    await sharp(original).resize({ width, withoutEnlargement: true }).webp({ quality: 83, effort: 5 }).toFile(path);
    const bytes = await readFile(path);
    const meta = await sharp(path).metadata();
    variants.push({ file: `images/${name}`, width: meta.width, height: meta.height, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  prepared.push({ name: asset.name, origin: 'OpenAI built-in Imagegen; illustrative generated photography, 26 October 2026', prompt: asset.prompt, original: `output/concept-expansion/originals/${asset.name}.png`, variants });
}
await writeFile(resolve(folder, 'asset-provenance.json'), JSON.stringify(prepared, null, 2) + '\n');
console.log(`Prepared ${prepared.length} original photographs and ${prepared.length * 2} responsive WebP assets.`);
