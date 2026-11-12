const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const assert = require('node:assert/strict')
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
async function ready(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('[data-node-id]')].filter(card => {
    const svg = card.querySelector('.animated-emblem svg'), img = card.querySelector('.node-image, .animated-emblem img')
    return svg || (img?.complete && img.naturalWidth)
  }).length === 7)
}
;(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
  try {
    for (const mobile of [false, true]) {
      const page = await browser.newPage(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' } : { viewport: { width: 1440, height: 960 } })
      const errors = [], requests = []
      page.on('pageerror', e => errors.push(e.message)); page.on('request', r => requests.push(r.url()))
      await page.route('**/api/entries/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[],"error":null}' }))
      await page.goto(base + '/encyclopedia/'); await ready(page)
      assert.equal(requests.filter(url => /node-emblem-.+\.svg/.test(url)).length, 7)
      const snapshot = () => page.evaluate(() => ({
        stars: [...document.querySelectorAll('.encyclopedia-sky canvas')].map(canvas => canvas.toDataURL()),
        positions: [...document.querySelectorAll('[data-node-id]')].map(card => getComputedStyle(card).transform),
      }))
      const before = await snapshot()
      await page.mouse.move(300, 200); await page.waitForTimeout(800)
      assert.deepEqual(await snapshot(), before, 'No background or node parallax')
      if (!mobile) {
        for (const id of ['characters', 'enemies', 'factions', 'gallery']) {
          const card = page.locator(`[data-node-id="${id}"]`)
          await card.hover(); await page.waitForTimeout(500)
          assert(await card.evaluate(c => c.querySelector('svg[data-kind]').getAnimations({ subtree: true }).length > 0), id)
          await page.mouse.move(10, 10); await page.waitForTimeout(500)
        }
      }
      await page.setViewportSize(mobile ? { width: 430, height: 932 } : { width: 1280, height: 800 })
      await page.waitForTimeout(200)
      assert(await page.locator('[data-static-starfield]').evaluate(c => c.width > 0 && c.height > 0))
      await page.locator('[data-node-id="terms"]').click(); await page.waitForURL('**/encyclopedia/terms')
      await page.goBack(); await ready(page)
      await page.locator('[data-node-id="gallery"]').click(); await page.waitForURL('**/map/')
      await page.locator('.leaflet-tile-loaded').first().waitFor()
      assert.deepEqual(errors, [])
      await page.close()
    }
    const fallback = await browser.newPage()
    await fallback.route('**/node-emblem-characters*.svg', route => route.request().resourceType() === 'fetch' ? route.abort() : route.continue())
    await fallback.goto(base + '/encyclopedia/'); await ready(fallback)
    assert(await fallback.locator('[data-node-id="characters"] .animated-emblem img').evaluate(img => img.complete && img.naturalWidth > 0))
    await fallback.close()
    console.log('Passed: desktop/mobile, one request per SVG, still background, retained hover motions, resize, detail/map navigation and static fallback.')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
