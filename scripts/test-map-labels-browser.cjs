const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const assert = require('node:assert/strict')
const path = require('node:path')

;(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
  try {
    for (const route of ['map', 'map-painter']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
      const errors = [], tiles = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('request', request => { if (/\/\d+\/\d+\/\d+\.webp/.test(request.url())) tiles.push(request.url()) })
      await page.goto((process.env.PREVIEW_URL || 'http://127.0.0.1:5173') + '/' + route + '/', { waitUntil: 'domcontentloaded' })
      const selector = route === 'map' ? '.map-labels-overlay' : '.paint-labels-svg'
      await page.locator(selector + ' path').first().waitFor()
      await page.locator('.leaflet-tile-loaded').first().waitFor()
      await page.waitForTimeout(600)
      for (let i = 0; i < 2; i++) {
        const result = await page.evaluate(selector => {
          const tile = document.querySelector('img.leaflet-tile-loaded')
          const r = tile.getBoundingClientRect(), s = document.querySelector(selector).getBoundingClientRect()
          const match = tile.src.match(/base-v2\/(\d+)\/(\d+)\/(\d+)\.webp/)
          const nativeTileWidth = 512 * 2 ** (6 - Number(match[1]))
          return {
            dx: Math.abs(s.left - (r.left - Number(match[2]) * r.width)),
            dy: Math.abs(s.top - (r.top - Number(match[3]) * r.height)),
            dw: Math.abs(s.width - 21600 / nativeTileWidth * r.width),
          }
        }, selector)
        assert(result.dx < 2 && result.dy < 2 && result.dw < 2, JSON.stringify(result))
        await page.getByRole('button', { name: '放大地图', exact: true }).click()
        await page.waitForTimeout(650)
      }
      if (route === 'map') await page.getByRole('button', { name: '地图显示设置' }).click()
      await page.getByRole('button', { name: '显示地图文字' }).click()
      await page.waitForTimeout(250)
      if (route === 'map') assert(!await page.locator(selector).isVisible())
      else assert(await page.locator('.paint-labels').evaluate(el => getComputedStyle(el).display === 'none'))
      await page.getByRole('button', { name: '显示地图文字' }).click()
      if (route === 'map-painter') {
        const layers = await page.evaluate(() => ({
          labels: +getComputedStyle(document.querySelector('.paint-labels')).zIndex,
          paint: +getComputedStyle(document.querySelector('.paint-surface')).zIndex,
          blend: getComputedStyle(document.querySelector('.paint-labels')).mixBlendMode,
        }))
        assert(layers.labels > layers.paint && layers.blend === 'normal')
      }
      assert(tiles.length && tiles.every(url => url.includes('base-v2')))
      assert.deepEqual(errors, [])
      await page.screenshot({ path: path.join(__dirname, `../../design/${route}-final-labels.png`) })
      console.log(route + ': label visibility, new basemap and zoom alignment passed')
      await page.close()
    }
  } finally { await browser.close() }
})().catch(error => { console.error(error.message); process.exit(1) })
