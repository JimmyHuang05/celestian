const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const assert = require('node:assert/strict')
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const expectedLabels = require('../public/map/world-240705-base-v2/labels-index.json').data.length
const expectedMarkers = require('../public/map/world-240705-base-v2/markers.json').data.length
const key = 'celestian-map-view-v2'
async function ready(page) {
  await page.locator('.leaflet-tile-loaded').first().waitFor()
  await page.waitForFunction(n => document.querySelectorAll('[data-label-id]').length === n, expectedLabels)
  await page.locator('.map-atlas-frame path').first().waitFor({ state: 'attached' })
  await page.waitForFunction(n => document.querySelectorAll('[data-marker-id]').length === n, expectedMarkers)
}
;(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
    const errors = [], requests = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('request', r => requests.push(r.url()))
    await page.goto(base + '/map/')
    await ready(page)
    assert.equal(requests.filter(url => url.endsWith('/labels.svg')).length, 1, 'Reuse the early lettering request')
    assert.equal(requests.filter(url => url.endsWith('/labels-index.json')).length, 1)
    const initial = await page.evaluate(k => JSON.parse(localStorage.getItem(k)).view, key)
    await page.getByRole('button', { name: '放大地图', exact: true }).click()
    await page.waitForTimeout(500)
    const zoomed = await page.evaluate(k => JSON.parse(localStorage.getItem(k)).view, key)
    assert(zoomed.zoom > initial.zoom)
    await page.reload(); await ready(page)
    assert.equal(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).view.zoom, key), zoomed.zoom)
    await page.getByRole('combobox', { name: '搜索地点或区域' }).fill('伏棱')
    await page.getByRole('listbox', { name: '搜索结果' }).getByRole('option').first().click()
    await page.getByRole('complementary', { name: '地点资料' }).waitFor()
    await page.getByRole('button', { name: '关闭资料卡' }).click()
    await page.getByRole('button', { name: '地图显示设置' }).click()
    await page.getByRole('button', { name: '显示地图文字', exact: true }).click()
    assert.equal(await page.locator('.map-labels-overlay').getAttribute('data-visible'), 'false')
    await page.getByRole('button', { name: '显示地图文字', exact: true }).click()
    assert.equal(await page.locator('.map-labels-overlay').getAttribute('data-visible'), 'true')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(400)
    assert(await page.locator('.leaflet-tile-loaded').count() > 0)
    assert.deepEqual(errors, [])
    await page.close()

    // Fail the early request; the normal load must recover without a blank map.
    const failed = await browser.newPage()
    let svgRequests = 0
    await failed.route('**/labels.svg', route => ++svgRequests === 1 ? route.abort() : route.continue())
    await failed.goto(base + '/map/'); await ready(failed)
    assert.equal(svgRequests, 2)
    assert.equal(await failed.locator('.map-marker-error').count(), 0)
    await failed.close()

    // Persistent failure is retryable, not a permanently rejected boot promise.
    const retry = await browser.newPage()
    let failing = true
    await retry.route('**/labels.svg', route => failing ? route.abort() : route.continue())
    await retry.goto(base + '/map/')
    await retry.locator('.map-marker-error').waitFor()
    await retry.locator('.leaflet-tile-loaded').first().waitFor()
    failing = false
    await retry.locator('.map-marker-error').getByRole('button', { name: '重试' }).click()
    await ready(retry)
    assert.equal(await retry.locator('.map-marker-error').count(), 0)
    await retry.close()
    console.log('Passed: early request reuse, 48 labels, cities, frame, zoom, saved view, search/detail, layer toggle, mobile, failed preload fallback and retry.')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
