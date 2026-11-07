const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const assert = require('node:assert/strict')
const path = require('node:path')
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5173'
const key = 'celestian-map-view-v2'
const prefs = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), key)
const count = p => p.locator('.map-place-label[data-visible=true]').count()
async function ready(p, url = base + '/map/') {
  await p.goto(url)
  await p.waitForFunction(() => document.querySelectorAll('.map-territories [role=button]').length === 82 && document.querySelectorAll('.map-place-label').length === 52)
  await p.waitForTimeout(450)
}
async function select(p, title) {
  const input = p.getByRole('combobox', { name: '搜索地点或区域' })
  await input.fill(title); await input.press('Enter'); await p.waitForTimeout(650)
}
async function share(p, name) {
  await p.getByRole('button', { name, exact: true }).click()
  await p.getByRole('dialog').waitFor(); await p.waitForTimeout(200)
  return p.getByLabel('分享链接', { exact: true }).inputValue()
}
async function sameView(p, expected) {
  const actual = (await prefs(p)).view
  assert(Math.abs(actual.zoom - expected.zoom) < .001)
  assert(actual.center.every((n, i) => Math.abs(n - expected.center[i]) < .00001), JSON.stringify({ actual, expected }))
}
;(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
  const errors = []
  try {
    const p = await browser.newPage({ viewport: { width: 1440, height: 960 } })
    p.on('pageerror', e => errors.push(e.message))
    await ready(p)
    const overview = await count(p)
    assert(overview > 0 && overview < 20)
    for (let i = 0; i < 3; i++) { await p.getByRole('button', { name: '放大地图', exact: true }).click(); await p.waitForTimeout(450) }
    assert(await count(p) > overview)
    await p.getByRole('button', { name: '地图显示设置' }).click()
    await p.getByRole('button', { name: '完整原图', exact: true }).click()
    assert.equal(await count(p), 52)
    await p.getByRole('button', { name: '关闭图层设置' }).click()
    await p.reload(); await p.locator('.map-place-label').first().waitFor()
    assert.equal(await count(p), 52)
    assert.equal(await p.locator('.map-labels-overlay path').count(), 1423)

    await select(p, '北港')
    const pointState = await prefs(p), pointTitle = await p.locator('.map-marker-detail h2').innerText()
    const pointURL = await share(p, '分享此地点')
    // Clipboard success and denial are exercised without changing the real clipboard.
    await p.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedMapLink = text } } }))
    await p.getByRole('button', { name: '复制链接', exact: true }).click()
    assert.equal(await p.evaluate(() => window.__copiedMapLink), pointURL)
    await p.keyboard.press('Escape')
    assert.equal(await p.locator('.map-marker-detail h2').innerText(), pointTitle, 'Escape should only close sharing')
    assert.equal(await p.evaluate(() => document.activeElement.getAttribute('aria-label')), '分享此地点')
    const recipient = await browser.newPage({ viewport: { width: 1440, height: 960 } })
    recipient.on('pageerror', e => errors.push(e.message))
    await ready(recipient, pointURL)
    assert.equal(await recipient.locator('.map-marker-detail h2').innerText(), pointTitle)
    await sameView(recipient, pointState.view)
    assert.equal((await prefs(recipient)).query, '')

    await select(p, '奥兰尼亚')
    await p.getByRole('button', { name: '全部领土', exact: true }).click(); await p.waitForTimeout(600)
    const regionState = await prefs(p), regionTitle = await p.locator('.map-marker-detail h2').innerText()
    const regionURL = await share(p, '分享此区域')
    await ready(recipient, regionURL)
    assert.equal(await recipient.locator('.map-marker-detail h2').innerText(), regionTitle)
    await sameView(recipient, regionState.view)
    await p.keyboard.press('Escape')
    const viewURL = await share(p, '分享当前视野')
    await ready(recipient, viewURL)
    assert.equal(await recipient.locator('.map-marker-detail').count(), 0)
    await sameView(recipient, regionState.view)
    await p.screenshot({ path: path.join(__dirname, '../../design/map-phase3-share-desktop.png') })
    await p.keyboard.press('Escape')

    const invalid = new URL(viewURL); invalid.searchParams.set('point', 'missing-point')
    await ready(recipient, invalid.href)
    assert((await recipient.locator('.map-notice').innerText()).includes('地点已不存在'))
    invalid.searchParams.set('atlas', 'b'.repeat(64))
    await ready(recipient, invalid.href)
    assert((await recipient.locator('.map-notice').innerText()).includes('其他版本'))
    await ready(recipient, base + '/map/?map=2&x=NaN')
    assert((await recipient.locator('.map-notice').innerText()).includes('链接无效'))

    const mobile = await browser.newPage({ viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
    mobile.on('pageerror', e => errors.push(e.message))
    await ready(mobile, pointURL)
    await share(mobile, '分享此地点')
    const box = await mobile.getByRole('dialog').boundingBox()
    assert(box.x >= 0 && box.x + box.width <= 320 && box.y >= 0 && box.y + box.height <= 740)
    await mobile.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied') } } }))
    await mobile.getByRole('button', { name: '复制链接', exact: true }).click()
    assert((await mobile.getByRole('dialog').innerText()).includes('请复制上方已选中的链接'))
    await mobile.screenshot({ path: path.join(__dirname, '../../design/map-phase3-share-mobile.png') })
    await mobile.keyboard.press('Escape')
    await mobile.getByRole('button', { name: '关闭资料卡' }).click()
    await mobile.getByRole('button', { name: '地图显示设置' }).click()
    await share(mobile, '分享当前视野')
    await mobile.getByRole('button', { name: '关闭分享' }).click()

    // Deferred lettering must not delay tiles, points or regions.
    const slow = await browser.newPage()
    let release
    const gate = new Promise(resolve => { release = resolve })
    await slow.route('**/labels.svg', async route => { await gate; await route.continue() })
    await slow.goto(base + '/map/', { waitUntil: 'domcontentloaded' })
    await slow.locator('.leaflet-tile-loaded').first().waitFor()
    await slow.locator('.map-territories [role=button]').first().waitFor()
    assert.equal(await slow.locator('.map-labels-overlay').count(), 0)
    release(); await slow.locator('.map-place-label').first().waitFor()
    await slow.close()
    const fallback = await browser.newPage()
    await fallback.route('**/labels-index.json', route => route.fulfill({ status: 404, body: 'missing' }))
    await fallback.goto(base + '/map/')
    await fallback.locator('.map-labels-overlay path').first().waitFor()
    assert.equal(await fallback.locator('.map-labels-overlay path').count(), 1423)
    assert((await fallback.locator('.map-notice').innerText()).includes('完整文字'))
    assert.deepEqual(errors, [])
    console.log('Passed: label levels / full-art mode, point / region / view links, invalid and old links, mobile share and clipboard fallback, nonblocking layers.')
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exit(1) })
