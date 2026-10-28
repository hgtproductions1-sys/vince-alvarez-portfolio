import { spawnSync } from 'node:child_process';
import { mkdir, copyFile, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const source = process.argv[2];
if (!source) throw Error('Usage: node scripts/prepare-scroll-frames.mjs <source.mp4>');
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 4e6 });
  if (result.error || result.status !== 0) throw result.error || Error(result.stderr);
  return result.stdout;
};
const probe = JSON.parse(run(process.env.FFPROBE_PATH || 'ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames,avg_frame_rate,duration', '-of', 'json', source])).streams[0];
const count = Number(probe.nb_frames);
if (!Number.isInteger(count) || count < 48) throw Error('At least 48 source frames required.');
const indices = Array.from({ length: 48 }, (_, index) => Math.round(index * (count - 1) / 47));
const scratch = resolve(root, '.qa/scroll-source-frames');
const archive = resolve(root, 'output/portfolio-animation-v1');
const destination = resolve(root, 'public/animation/blueprint');
for (const folder of [scratch, archive, destination + '/640', destination + '/960']) await mkdir(folder, { recursive: true });
await copyFile(source, resolve(archive, 'source-animation.mp4'));
run(process.env.FFMPEG_PATH || 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', source, '-vf', `select='${indices.map(index => `eq(n,${index})`).join('+')}'`, '-fps_mode', 'vfr', '-frames:v', '48', '-start_number', '0', '-y', resolve(scratch, '%03d.png')]);
const frames = [];
for (let index = 0; index < 48; index++) {
  const filename = `${String(index).padStart(3, '0')}.webp`;
  for (const width of [640, 960]) {
    const output = resolve(destination, String(width), filename);
    await sharp(resolve(scratch, `${String(index).padStart(3, '0')}.png`)).resize(width).webp({ quality: 78, effort: 5 }).toFile(output);
    frames.push({ file: `animation/blueprint/${width}/${filename}`, size: (await stat(output)).size });
  }
}
await sharp(resolve(scratch, '047.png')).resize(960).webp({ quality: 86, effort: 5 }).toFile(resolve(destination, 'finished.webp'));
const bytes = await readFile(source);
const manifest = { sourceName: source.split(/[\\/]/).pop(), sourceSha256: createHash('sha256').update(bytes).digest('hex'), source: probe, frameCount: 48, sourceIndices: indices, widths: [640, 960], frames };
await writeFile(resolve(archive, 'scroll-frame-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Prepared 96 WebP frames + finished poster; ${(frames.reduce((sum, item) => sum + item.size, 0) / 1e6).toFixed(2)} MB combined. Source archived unchanged.`);
