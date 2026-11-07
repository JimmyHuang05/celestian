import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const out = path.resolve(root, '../deploy/factions-20261018/release');
const seen = new Set();
async function copyAsset(url) {
  const rel = url.split(/[?#]/)[0].replace(/^\//, '');
  if (seen.has(rel) || rel.includes('..')) return;
  const source = path.join(root, 'public', rel);
  try { if (!(await fs.stat(source)).isFile()) return; } catch { return; }
  seen.add(rel);
  await fs.mkdir(path.dirname(path.join(out, rel)), {recursive:true});
  await fs.copyFile(source, path.join(out, rel));
  if (/\.(svg|css|js|html|json)$/.test(rel)) await scan(await fs.readFile(source,'utf8'));
}
async function scan(text) {
  for (const match of text.matchAll(/\/(?:imperial-knights|unconventional-affairs|eternal-astrology|assets|audio|fonts)\/[A-Za-z0-9_./-]+\.(?:png|webp|avif|svg|jpe?g|woff2?|opus|m4a|mp3)/g)) await copyAsset(match[0]);
}
await copyAsset('/faction-profile/factions.json');
for (const file of await fs.readdir(path.join(out,'assets'))) {
  if (/\.(js|css)$/.test(file)) await scan(await fs.readFile(path.join(out,'assets',file),'utf8'));
}
for (const file of await fs.readdir(path.join(root, 'public/fonts/v1'))) {
  if (file.endsWith('-OFL.txt')) await copyAsset('/fonts/v1/' + file);
}
for (const file of ['white-palace-oil-v1.png','palace-original-clouds-v1.png','palace-silhouette-v1.png']) await copyAsset('/unconventional-affairs/backgrounds/'+file);
for (const file of ['stone-hall.opus','stone-hall.m4a']) await copyAsset('/assets/astrology-audio-v1/'+file);
for (const [file,id] of [['imperial-knights.html','imperial-knights'],['unconventional-affairs.html','unconventional-affairs'],['faction-profile.html','eternal-astrology']]) {
  const html = await fs.readFile(path.join(out,file),'utf8');
  await scan(html);
  await fs.mkdir(path.join(out,'factions',id),{recursive:true});
  await fs.writeFile(path.join(out,'factions',id,'index.html'),html);
}
const hashes=[];
async function walk(dir) {
  for(const e of await fs.readdir(dir,{withFileTypes:true})) {
    const p=path.join(dir,e.name);
    if(e.isDirectory()) await walk(p);
    else hashes.push(`${crypto.createHash('sha256').update(await fs.readFile(p)).digest('hex')}  ${path.relative(out,p).replaceAll('\\','/')}`);
  }
}
await walk(out);
await fs.writeFile(path.join(out,'../SHA256SUMS'),hashes.join('\n')+'\n');
console.log(`Prepared ${hashes.length} files, including ${seen.size} referenced public assets.`);
