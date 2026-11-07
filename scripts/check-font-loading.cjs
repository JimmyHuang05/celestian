const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/fonts/font-sources.json'), 'utf8'))
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5173'
const critical = manifest.priority.critical
const fontSizes = new Map(manifest.faces.map(face => [face.file, face.bytes]))
const titleSelector = '.celestian-player__title'

async function contextFor(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } })
  await context.addInitScript(() => {
    if (window === window.top) localStorage.setItem('celestian-music-enabled', 'false')
  })
  return context
}
async function openPlayer(page) {
  await page.locator('.celestian-player__disc').focus()
  await page.waitForTimeout(500) // Let only the panel's entrance animation finish.
}
async function fontsReady(page) {
  await page.evaluate(() => Promise.race([
    document.fonts.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Fonts timed out')), 10000)),
  ]))
}
async function renderedFonts(page) {
  const client = await page.context().newCDPSession(page)
  try {
    await client.send('DOM.enable'); await client.send('CSS.enable')
    const { root } = await client.send('DOM.getDocument')
    const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector: titleSelector })
    return (await client.send('CSS.getPlatformFontsForNode', { nodeId })).fonts
  } finally { await client.detach() }
}
// CDP capture deliberately does not wait for document.fonts.ready, so it can
// detect a painted fallback face while the real font is still downloading.
async function titlePixels(page) {
  const box = await page.locator(titleSelector).boundingBox()
  const client = await page.context().newCDPSession(page)
  try {
    const { data } = await client.send('Page.captureScreenshot', {
      format: 'png', clip: { x: box.x, y: box.y, width: box.width, height: box.height, scale: 1 },
    })
    return data
  } finally { await client.detach() }
}
async function hasPaintedText(page) {
  const visible = await titlePixels(page)
  await page.locator(titleSelector).evaluate(el => { el.style.color = 'transparent' })
  const background = await titlePixels(page)
  await page.locator(titleSelector).evaluate(el => el.style.removeProperty('color'))
  return visible !== background
}

;(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
  try {
    for (const route of ['/unconventional-affairs.html', '/faction-profile.html', '/imperial-knights.html']) {
      const context = await contextFor(browser)
      const page = await context.newPage()
      const requests = [], errors = []
      page.on('request', request => { if (request.resourceType() === 'font') requests.push(new URL(request.url()).pathname) })
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(base + route, { waitUntil: 'domcontentloaded' })
      await openPlayer(page); await fontsReady(page)
      assert.equal(requests.filter(url => url === critical).length, 1, 'Preload must be reused, not downloaded twice')
      assert(requests.every(url => fontSizes.has(url)), 'Every font remains locally managed')
      const bytes = [...new Set(requests)].reduce((n, url) => n + fontSizes.get(url), 0)
      assert(bytes < 160 * 1024, 'Faction font delivery must remain below 160 KiB')
      const fonts = await renderedFonts(page)
      assert(fonts.length && fonts.every(font => font.isCustomFont && font.familyName.includes('Noto Serif SC')))
      assert.deepEqual(errors, [])
      console.log(JSON.stringify({ route, fontRequests: requests.length, fontBytes: bytes }))
      await context.close()
    }

    const slow = await contextFor(browser)
    let release
    const gate = new Promise(resolve => { release = resolve })
    let held = 0
    await slow.route(url => url.pathname === critical, async route => { held++; await gate; await route.continue() })
    const page = await slow.newPage()
    await page.goto(base + '/unconventional-affairs.html', { waitUntil: 'domcontentloaded' })
    await openPlayer(page)
    assert.equal(held, 1)
    assert(await page.evaluate(() => [...document.fonts].some(face => face.family.includes('Noto Serif SC') && face.status === 'loading')))
    assert.equal(await hasPaintedText(page), true, 'Text must paint immediately while fonts are loading')
    assert(await page.locator('.affairs-profile__emblem').evaluate(el => el.complete && el.naturalWidth > 0), 'Artwork should be visible while the font loads')
    release(); await fontsReady(page)
    assert.equal(await hasPaintedText(page), true, 'Text must appear when the font is ready')
    assert((await renderedFonts(page)).every(font => font.isCustomFont))
    await slow.close()

    const failed = await contextFor(browser)
    await failed.route('**/fonts/**/*.woff2', route => route.abort())
    const fallbackPage = await failed.newPage()
    await fallbackPage.goto(base + '/unconventional-affairs.html', { waitUntil: 'domcontentloaded' })
    await openPlayer(fallbackPage); await fontsReady(fallbackPage)
    assert.equal(await hasPaintedText(fallbackPage), true, 'Failed downloads must never leave unreadable/hidden text')
    assert((await renderedFonts(fallbackPage)).some(font => !font.isCustomFont))
    await failed.close()
    console.log('Passed: cold-cache font budget, preload reuse, immediate readable fallback, artwork during loading, and readable failure fallback.')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
