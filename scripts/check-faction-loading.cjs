const { chromium } = require('C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const phase = process.argv[2] || 'after';
const mobile = process.argv.includes('--mobile');
const out = path.resolve(__dirname, '../../audit/faction-performance');
(async () => {
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const results = [];
  try {
    for (const route of ['imperial-knights', 'unconventional-affairs', 'faction-profile']) {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: mobile ? 2 : 1, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) });
      await page.addInitScript(() => {
        localStorage.setItem('celestian-music-enabled', 'false');
        window.lcp = 0; window.longTasks = [];
        new PerformanceObserver(list => { for (const e of list.getEntries()) window.lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => window.longTasks.push(...list.getEntries().map(e => Math.round(e.duration)))).observe({ type: 'longtask', buffered: true });
      });
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 80, downloadThroughput: 500000, uploadThroughput: 125000 });
      await page.goto(`http://127.0.0.1:5173/${route}.html`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(2500);
      const result = await page.evaluate(() => ({
        lcp: Math.round(window.lcp),
        paints: performance.getEntriesByType('paint').map(e => ({name:e.name, ms:Math.round(e.startTime)})),
        resources: performance.getEntriesByType('resource').filter(e => !e.name.startsWith('data:')).map(e => ({url:new URL(e.name).pathname, type:e.initiatorType, bytes:e.encodedBodySize, end:Math.round(e.responseEnd)})),
        images: [...document.images].map(i => ({src:i.currentSrc, ok:i.complete && i.naturalWidth>0, width:Math.round(i.getBoundingClientRect().width)})),
        longTasks: window.longTasks,
        cloth: document.querySelector('.standards')?.dataset.cloth,
      }));
      result.route = route; result.errors = errors;
      result.bytes = result.resources.reduce((n,r) => n+r.bytes,0);
      result.imageBytes = result.resources.filter(r => /\.(svg|webp|avif|png|jpg)$/.test(r.url)).reduce((n,r) => n+r.bytes,0);
      await page.screenshot({ path:path.join(out, `${phase}-${route}${mobile?'-mobile':''}.png`) });
      results.push(result);
      console.log(JSON.stringify({route,bytes:result.bytes,imageBytes:result.imageBytes,lcp:result.lcp,paints:result.paints,errors,broken:result.images.filter(i=>!i.ok),longTasks:result.longTasks}));
      await context.close();
    }
  } finally { await browser.close(); await fs.writeFile(path.join(out, `${phase}${mobile?'-mobile':''}.json`), JSON.stringify(results,null,2)) }
})().catch(e=>{console.error(e);process.exitCode=1});
