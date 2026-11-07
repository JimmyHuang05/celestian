// Bake the approved composite SVG artwork once instead of decoding it on every visit.
// Source SVGs remain editable and unchanged. Run the Vite server before this script.
const { chromium } = require('C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const out = path.resolve(__dirname, '../../audit/faction-performance/masters');
const sources = [
  ...['lion-damask', 'bear-selected', 'imperial-damask', 'lynx-selected', 'wolf-selected'].map(name => [name, `/imperial-knights/delivery-v1/${name}.svg`]),
  ['astrology-emblem', '/eternal-astrology/emblem-user-v2.svg'],
];
(async () => {
  await fs.mkdir(out, { recursive:true });
  const browser = await chromium.launch({ executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless:true });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5173/favicon.svg');
    for (const [name, src] of sources) {
      const png = await page.evaluate(async src => {
        const image = new Image(); image.src = src; await image.decode();
        const canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        canvas.getContext('2d').drawImage(image,0,0);
        return canvas.toDataURL('image/png').split(',')[1];
      }, src);
      await fs.writeFile(path.join(out, `${name}.png`), Buffer.from(png, 'base64'));
      console.log(name);
    }
  } finally { await browser.close() }
})().catch(e=>{console.error(e);process.exitCode=1});
