const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const path = require('node:path')
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5173'
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
async function ready(page) {
  await page.waitForFunction(() => { const b = document.querySelector('button[aria-label="新增国家"]'); return b && !b.disabled }, { timeout: 60000 })
  await page.locator('.leaflet-tile-loaded').first().waitFor()
  await page.waitForTimeout(800)
}
async function backup(page) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: '下载备份', exact: true }).click()
  const download = await pending, chunks = []
  for await (const chunk of await download.createReadStream()) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks))
}
;(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 1500, height: 1100 } })
    const page = await context.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(base + '/map-painter/?project=legacy', { waitUntil: 'domcontentloaded' }); await ready(page)
    assert.equal(await page.locator('.paint-country').count(), 208)
    const initial = await backup(page)
    assert.equal(new Set(initial.regions.map(r => r.source.regionId)).size, 208)
    assert.equal(initial.regions.filter(r => Object.keys(r.source.metadata).length).length, 82)
    const selected = initial.regions[0].id
    let sample
    for (const tile of initial.tiles) {
      const run = tile.runs.find(([, length, id]) => id === selected && length > 32768)
      if (!run) continue
      const [x, y] = tile.key.split(',').map(Number), offset = run[0] + Math.floor(run[1] / 2)
      sample = { x: x * 256 + offset % 256, y: y * 256 + Math.floor(offset / 256) }
      break
    }
    assert(sample)
    const screen = await page.evaluate(({ x, y }) => {
      const tile = document.querySelector('.leaflet-tile-loaded'), box = tile.getBoundingClientRect()
      const match = tile.src.match(/base-v2\/(\d+)\/(\d+)\/(\d+)\.webp/), side = 512 * 2 ** (6 - Number(match[1]))
      return { x: box.left + (x - Number(match[2]) * side) / side * box.width, y: box.top + (y - Number(match[3]) * side) / side * box.height }
    }, sample)
    await page.mouse.click(screen.x, screen.y, { button: 'right' })
    const edited = await backup(page)
    assert.notEqual(hash(edited.tiles), hash(initial.tiles), 'migrated regions are editable, not a reference image')
    await page.getByRole('button', { name: '撤销', exact: false }).click()
    assert.equal(hash((await backup(page)).tiles), hash(initial.tiles), 'undo restores the migrated geometry')
    await page.waitForTimeout(1000)
    await page.reload({ waitUntil: 'domcontentloaded' }); await ready(page)
    const restored = await backup(page)
    assert.equal(hash(restored), hash(initial), 'full geometry and source metadata survive reload')
    await page.getByRole('textbox', { name: '搜索区域' }).fill('region_3_1')
    assert(await page.locator('.paint-country').count() > 0)
    await page.getByRole('textbox', { name: '搜索区域' }).fill('')
    await page.screenshot({ path: path.join(__dirname, '../../design/map-legacy-migration/editable-project.png') })
    const normal = await context.newPage()
    await normal.goto(base + '/map-painter/', { waitUntil: 'domcontentloaded' }); await ready(normal)
    const draft = await backup(normal)
    assert.equal(draft.regions.length, 1); assert.equal(draft.tiles.length, 0, 'normal project is untouched')
    assert.deepEqual(errors, [])
    console.log('Passed: 208 editable legacy regions, 82 matching metadata records, erasing, undo, autosave/reload, original IDs, search and project isolation.')
  } finally { await browser.close() }
})().catch(error => { console.error(error.message); process.exit(1) })
