import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const source = 'C:/Users/Pastor Bhong/.codex/generated_images/01a1609e-70c6-7ba3-b8b3-9cf0315ae58e';
const files = {
  'vince-print': 'exec-f9068f0f-1bb2-41da-8bd0-ddb510c75acc.png',
  'flat-white': 'exec-8048aa3e-6449-4712-9ecb-f41850c16951.png',
  'oat-latte': 'exec-4fc40597-d980-4380-9163-cea3b0e47273.png',
  'cold-brew': 'exec-c75926eb-6100-4393-8954-3b0cab31a752.png',
  matcha: 'exec-481a9591-510e-4fde-aa7e-8643ec848f3c.png',
  'citrus-soda': 'exec-1452fe10-4dee-4c0c-966b-a932bc7b66d2.png',
  cookie: 'exec-d3b1b791-c94e-4dfc-8aa0-0ad44350ed53.png',
  toast: 'exec-8560fbb3-0bc7-40be-a1eb-1ef559ec95c8.png',
};
await mkdir('public/images', { recursive: true });
for (const [name, file] of Object.entries(files)) {
  const result = await sharp(path.join(source, file))
    .resize({ width: name === 'vince-print' ? 800 : 1448, withoutEnlargement: true })
    .webp({ quality: 83, alphaQuality: 100 }).toFile(`public/images/${name}.webp`);
  console.log(`${name}: ${result.width}x${result.height}, ${Math.round(result.size / 1024)} KB`);
}
