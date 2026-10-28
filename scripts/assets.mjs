import { mkdir, writeFile, copyFile } from 'node:fs/promises';
const folder = new URL('../public/images/', import.meta.url);
await mkdir(folder, { recursive: true });
const downloads = {
  'faceless.webp': 'https://www.thefacelessprompts.com/story-cat.webp',
  'architecture.jpg': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
  'interior.jpg': 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
  'coast.jpg': 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1800&q=85',
  'suite.jpg': 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85',
  'coffee.jpg': 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1400&q=85',
  'cafe.jpg': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=85',
};
await Promise.all(Object.entries(downloads).map(async ([name, url]) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Asset failed: ${name} (${response.status})`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(new URL(name, folder), bytes);
  console.log(`${name}: ${bytes.length} bytes`);
}));
await copyFile('D:/Downloads/2x2.png', new URL('vince.png', folder));
await copyFile('D:/Desktop/CHATGPT/Fitness_Vault/dist/assets/campaign/hero-gym.webp', new URL('fitness.webp', folder));
await copyFile('D:/Desktop/CHATGPT/Fitness_Vault/dist/concepts/brutalist/assets/dashboard-members.jpg', new URL('fitness-dashboard.jpg', folder));
console.log('Local portrait and project images copied.');
