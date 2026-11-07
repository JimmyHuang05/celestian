const { chromium } = require('C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const assert = require('node:assert/strict')
const base = 'http://127.0.0.1:5173'
const playerSelector = '#celestian-music-player'
const discSelector = '.celestian-player__disc'
const playSelector = '.celestian-player__play'

;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const errors = [], media = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (/\.(mp3|opus|m4a)(?:\?|$)/.test(request.url())) media.push(request.url()) })
    await page.addInitScript(() => {
      if (window === window.top) {
        localStorage.setItem('celestian-music-enabled', 'false')
        sessionStorage.setItem('hasSeenIntro', 'true')
      }
    })
    await page.goto(base + '/encyclopedia/')
    const player = page.locator(playerSelector)
    await player.waitFor()
    assert.equal(await player.getAttribute('data-open'), 'false')
    assert.equal(await player.locator('.celestian-player__panel').evaluate(el => el.inert), true)
    assert.equal(media.length, 0, 'muted first screen does not download BGM')
    assert(await player.evaluate(el => {
      const box = el.getBoundingClientRect()
      return !el.contains(document.elementFromPoint(box.right - 10, box.y + box.height / 2))
    }), 'collapsed panel must not intercept the page')

    await player.locator(discSelector).focus()
    assert.equal(await player.getAttribute('data-open'), 'true')
    await page.keyboard.press('Tab')
    assert(await player.locator(playSelector).evaluate(el => el === document.activeElement), 'disabled seek is skipped')
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => window.__celestianMusicManager.getSnapshot().playing)
    await player.locator('.celestian-player__seek').fill('410')
    assert(await page.evaluate(() => {
      const s = window.__celestianMusicManager.getSnapshot()
      return Math.abs(s.position / s.duration - .41) < .02
    }))
    await page.keyboard.press('Escape')
    assert.equal(await player.getAttribute('data-open'), 'false')
    await page.evaluate(() => {
      window.savedPlayer = document.querySelector('[data-music-player]')
      window.savedAudio = window.__celestianMusicManager.getAudio('encyclopedia')
      window.__celestianMusicNavigation.navigate('/character-profile.html')
    })
    const frame = page.frameLocator('#music-page-frame')
    await frame.locator('.page-action--close').waitFor()
    assert.equal(await frame.locator('[data-music-player]').count(), 0)
    assert(await page.evaluate(() => savedPlayer === document.querySelector('[data-music-player]') && savedAudio === window.__celestianMusicManager.getAudio('encyclopedia')))
    assert.equal(await player.locator('.celestian-player__record').evaluate(el => getComputedStyle(el).animationPlayState), 'running')
    await player.locator(discSelector).hover()
    await player.locator(playSelector).click()
    await page.waitForFunction(() => !window.__celestianMusicManager.getSnapshot().playing)
    await page.evaluate(() => window.__celestianMusicNavigation.navigate('/map'))
    await page.waitForFunction(() => window.__celestianMusicManager.getSnapshot().pageId === 'map')
  assert.equal(await player.locator('.celestian-player__title').innerText(), '星海拾遗')
    assert.equal(await player.getAttribute('data-playing'), 'false')
    await frame.locator('[data-music-player]').count().then(count => assert.equal(count, 0))
    assert.deepEqual(errors, [])

    await player.locator(discSelector).click()
    await page.waitForFunction(() => window.__celestianMusicManager.getSnapshot().playing)
    assert.equal(await player.locator(discSelector).getAttribute('aria-label'), '暂停背景音乐')
    await player.locator(discSelector).click()
    await page.waitForFunction(() => !window.__celestianMusicManager.getSnapshot().playing)
    assert.equal(await player.locator(discSelector).getAttribute('aria-label'), '播放背景音乐')
    await player.locator(discSelector).focus()
    await page.keyboard.press('Space')
    await page.waitForFunction(() => window.__celestianMusicManager.getSnapshot().playing)
    await page.keyboard.press('Space')
    await page.waitForFunction(() => !window.__celestianMusicManager.getSnapshot().playing)

    const touch = await browser.newPage({ viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true })
    await touch.addInitScript(() => { if (window === window.top) localStorage.setItem('celestian-music-enabled', 'false') })
    await touch.goto(base + '/imperial-knights.html')
    const touchPlayer = touch.locator(playerSelector)
    await touchPlayer.locator(discSelector).tap()
    assert.equal(await touchPlayer.getAttribute('data-open'), 'true')
    await touch.waitForFunction(() => window.__celestianMusicManager.getSnapshot().playing)
    const box = await touchPlayer.boundingBox()
    assert(box.x >= 0 && box.x + box.width <= 320)
    await touch.locator('body').tap({ position: { x: 200, y: 180 } })
    assert.equal(await touchPlayer.getAttribute('data-open'), 'false')
    await touchPlayer.locator(discSelector).tap()
    await touch.waitForFunction(() => !window.__celestianMusicManager.getSnapshot().playing)
    await touchPlayer.locator(playSelector).tap()
    await touch.waitForFunction(() => window.__celestianMusicManager.getSnapshot().playing)
    await touch.evaluate(() => window.__celestianMusicNavigation.navigate('/unconventional-affairs.html'))
    await touch.waitForFunction(() => window.__celestianMusicManager.getSnapshot().pageId === 'unconventional-affairs')
    await touchPlayer.locator(discSelector).tap()
    await touch.frameLocator('#music-page-frame').locator('body').tap({ position: { x: 200, y: 180 } })
    assert.equal(await touchPlayer.getAttribute('data-open'), 'false', 'touch outside inside a child frame closes the parent player')

    const blocked = await browser.newPage()
    await blocked.addInitScript(() => {
      localStorage.setItem('celestian-music-enabled', 'true')
      const play = HTMLMediaElement.prototype.play
      let first = true
      HTMLMediaElement.prototype.play = function () {
        if (first) { first = false; return Promise.reject(new DOMException('Autoplay denied', 'NotAllowedError')) }
        return play.call(this)
      }
    })
    await blocked.goto(base + '/imperial-knights.html')
    await blocked.waitForFunction(() => window.__celestianMusicManager?.getSnapshot().blocked)
    await blocked.locator(discSelector).hover()
    assert.equal(await blocked.locator(playSelector).getAttribute('aria-label'), '重试播放背景音乐')
    assert.equal(await blocked.locator(discSelector).getAttribute('aria-label'), '重试播放背景音乐')
    await blocked.locator(discSelector).click()
    await blocked.waitForFunction(() => window.__celestianMusicManager.getSnapshot().playing)
    console.log('Global player: lazy media, collapsed hit testing, keyboard, seek, inherited tracks, persistent iframe player, touch and autoplay recovery passed.')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
