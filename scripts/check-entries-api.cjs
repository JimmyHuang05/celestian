const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const assert = require('node:assert/strict')
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4179'

;(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
  try {
    for (const mobile of [false, true]) {
      const context = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' } : { viewport: { width: 1440, height: 960 } })
      const page = await context.newPage()
      const errors = [], retiredRequests = []
      page.on('pageerror', e => errors.push(e.message))
      page.on('request', r => { if (/supabase|deepseek/i.test(r.url())) retiredRequests.push(r.url()) })
      await page.route('**/api/entries/counts', r => r.fulfill({ json: { data: [{ node_id: 'aeons', count: 3 }, { node_id: 'terms', count: 4 }], error: null } }))
      for (const node of ['aeons', 'terms']) {
        for (const arrayBlocks of [false, true]) {
          const title = `API fixture ${node} ${arrayBlocks}`
          const blocks = [{ type: 'paragraph', content: 'Verified public API paragraph.' }, { type: 'key-value', key: '来源', value: '现有 API' }]
          await page.route(`**/api/entries/node/${node}`, r => r.fulfill({ json: { data: [{ id: 'fixture', node_id: node, title, blocks: arrayBlocks ? blocks : JSON.stringify(blocks), sort_order: 0 }], error: null } }))
          await page.goto(`${base}/encyclopedia/${node}?id=fixture`, { waitUntil: 'domcontentloaded' })
          await page.getByText(title, { exact: true }).first().waitFor()
          await page.waitForFunction(() => document.body.textContent.includes('Verified public API paragraph.'), null, { timeout: 10000 }).catch(async error => {
            console.error({ mobile, node, arrayBlocks, body: (await page.locator('body').innerText()).slice(-2500) })
            throw error
          })
          await page.unroute(`**/api/entries/node/${node}`)
        }
      }
      await page.goto(`${base}/encyclopedia/`, { waitUntil: 'domcontentloaded' })
      await page.locator('[data-node-id="aeons"]').waitFor()
      await page.waitForFunction(() => document.querySelector('[data-node-id="aeons"]')?.textContent.includes('3'))
      assert.deepEqual(retiredRequests, [])
      assert.deepEqual(errors, [])
      await context.close()
    }
    console.log('Passed: desktop/mobile counts, both detail types, JSON-string/array blocks, no retired-service requests or page errors.')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
