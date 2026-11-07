const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const assert = require('node:assert/strict')
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5173'
const key = 'celestian-map-view-v2'
async function ready(p) {
  await p.goto(base + '/map/')
  await p.locator('.map-atlas-frame').waitFor()
  await p.locator('.map-place-label').first().waitFor()
  await p.waitForTimeout(400)
}
async function box(p) { return p.locator('.map-atlas-frame').boundingBox() }
async function fills(p) {
  const b = await box(p), size = p.viewportSize()
  assert(b.x <= 1 && b.y <= 1 && b.x + b.width >= size.width - 1 && b.y + b.height >= size.height - 1, JSON.stringify({ b, size }))
  assert(Math.abs(b.width / b.height - 2232 / 1112) < .004, 'No distortion')
}
;(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
  try {
    const p = await browser.newPage({ viewport: { width: 1260, height: 936 } }), errors = []
    p.on('pageerror', e => errors.push(e.message))
    // Simulate the old saved miniature from the user's screenshot.
    await p.goto(base)
    await p.evaluate(k => localStorage.setItem(k, JSON.stringify({ version: 2, layers: { labels: true, points: true, countries: false, statuses: true }, view: { coordinates: '2acc2256324424aaf482a78d194fab5bfd899e1643c632db5c2526c983b0bc5e', center: [.5, .5], zoom: .5 } })), key)
    await ready(p); await fills(p)
    assert.equal(await p.evaluate(k => JSON.parse(localStorage.getItem(k)).frameVersion, key), 1)
    for (const size of [{ width: 2400, height: 800 }, { width: 320, height: 844 }, { width: 1440, height: 960 }]) {
      await p.setViewportSize(size); await p.waitForTimeout(500); await fills(p)
    }
    // Frame follows panning instead of being a fixed viewport border.
    const before = await box(p)
    await p.mouse.move(780, 630); await p.mouse.down(); await p.mouse.move(900, 630, { steps: 15 }); await p.mouse.up(); await p.waitForTimeout(400)
    const after = await box(p)
    assert(Math.abs(after.x - before.x) > 50)
    const aligned = await p.evaluate(() => {
      const f = document.querySelector('.map-atlas-frame').getBoundingClientRect(), s = document.querySelector('.map-labels-overlay').getBoundingClientRect()
      return Math.max(Math.abs(f.left + f.width * 36 / 2232 - s.left), Math.abs(f.top + f.height * 36 / 1112 - s.top))
    })
    assert(aligned < 2)
    await p.getByRole('button', { name: '查看全图', exact: true }).click(); await p.waitForTimeout(600)
    const full = await box(p)
    assert(full.x >= -1 && full.y >= -1 && full.x + full.width <= 1441 && full.y + full.height <= 961)
    assert.equal(await p.getByRole('button', { name: '缩小地图', exact: true }).isDisabled(), true)
    await ready(p)
    const restored = await box(p)
    assert(Math.abs(restored.width - full.width) < 2, 'An intentional overview survives reload')
    await p.getByRole('button', { name: '地图显示设置' }).click()
    await p.getByRole('button', { name: '恢复默认地图' }).click(); await p.waitForTimeout(600); await fills(p)
    assert.equal(await p.locator('.map-atlas-frame').evaluate(e => getComputedStyle(e).pointerEvents), 'none')
    assert.deepEqual(errors, [])
    console.log('Passed: old tiny-view migration, proportional fill, wide/mobile resize, pan alignment, complete framed overview, persistence and reset.')
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exit(1) })
