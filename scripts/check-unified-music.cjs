const { chromium } = require('C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      if (window === window.top) {
        localStorage.setItem('celestian-music-enabled', 'false');
        sessionStorage.setItem('hasSeenIntro', 'true');
      }
    });
    const settled = id => page.waitForFunction(id => {
      const m = window.__celestianMusicManager, t = m?.controller.tracks[id];
      return m?.controller.target === id && t && !t.audio.paused && t.audio.volume === t.volume;
    }, id, { timeout: 40000 });
    await page.goto('http://127.0.0.1:5173/faction-profile.html', { waitUntil: 'domcontentloaded' });
    const player = page.locator('#celestian-music-player');
    assert.equal(await player.count(), 1);
    assert.equal(await player.getAttribute('data-open'), 'false');
    assert.equal(await page.locator('.page-action--sound').count(), 0);
    await player.locator('.celestian-player__disc').hover();
    await player.locator('.celestian-player__play').click();
    await settled('eternal-astrology');
    await page.evaluate(() => {
      window.initialManager = window.__celestianMusicManager;
      window.initialAudio = initialManager.getAudio('eternal-astrology');
      window.initialPlayer = document.querySelector('[data-music-player]');
      window.overlaps = [];
      window.sampleMusic = setInterval(() => {
        const playing = Object.entries(initialManager.controller.tracks)
          .filter(([, t]) => !t.audio.paused && t.audio.volume > .001)
          .map(([id]) => id);
        if (playing.length > 1) overlaps.push(playing);
      }, 50);
    });
    await page.getByRole('button', { name: '下一个势力：非常规事务署', exact: true }).click();
    await settled('unconventional-affairs');
    assert(page.url().endsWith('/unconventional-affairs.html'));
    assert(await page.evaluate(() => overlaps.some(ids => ids.includes('eternal-astrology') && ids.includes('unconventional-affairs'))));
    const frame = page.frameLocator('#music-page-frame');
    assert(await frame.locator('body').evaluate(() => window.__celestianMusicManager === undefined && window.parent.__celestianMusicManager.getAudio('unconventional-affairs').volume === .2));
    assert.equal(await frame.locator('[data-music-player],.page-action--sound').count(), 0);
  assert.equal(await player.locator('.celestian-player__title').innerText(), '一切皆如常');
    assert.equal(await player.evaluate(el => el.inert), false);
    assert.equal(await player.locator('.celestian-player__record').evaluate(el => getComputedStyle(el).animationPlayState), 'running');
    await frame.getByRole('button', { name: '上一个势力：永恒不灭的占星会', exact: true }).click();
    await settled('eternal-astrology');
    assert.equal(await page.locator('#music-page-frame').count(), 0);
    assert(await page.evaluate(() => initialAudio === initialManager.getAudio('eternal-astrology')));
    await page.goBack();
    await settled('unconventional-affairs');
    await page.goBack();
    await settled('eternal-astrology');
    await page.goForward();
    await settled('unconventional-affairs');
    console.log('Standalone faction transitions and Back/Forward preserve the same player and overlap.');
    await player.locator('.celestian-player__disc').hover();
    await player.locator('.celestian-player__play').click();
    await page.waitForFunction(() => Object.values(initialManager.controller.tracks).every(t => t.audio.paused));
    await frame.getByRole('link', { name: '关闭并返回百科', exact: true }).click();
    await frame.locator('#encyclopedia-app').waitFor();
    assert.equal(await page.evaluate(() => initialManager.enabled), false);
    await player.locator('.celestian-player__disc').hover();
    await player.locator('.celestian-player__play').click();
    await settled('encyclopedia');
    await frame.getByRole('button', { name: '返回主页', exact: true }).click();
    await settled('home');
    assert.equal(new URL(page.url()).pathname, '/');
    // The real React page can transition again without constructing a player.
    await frame.locator('a[href="/functions/"],a[href="/functions"]').first().click();
    await settled('functions');
    assert.equal(await page.evaluate(() => initialManager.controller.tracks.functions.volume), .1);
    assert(await page.evaluate(() => initialManager === window.__celestianMusicManager));
    assert(await page.evaluate(() => initialPlayer === document.querySelector('[data-music-player]')));
    assert.deepEqual(errors, []);
    await page.evaluate(() => clearInterval(sampleMusic));
    console.log('All five tracks share one player; mute persists; React routes inside the standalone host stay in sync.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
