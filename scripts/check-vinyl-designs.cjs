const {chromium}=require('C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:950}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto('http://127.0.0.1:5173/vinyl-player-designs.html');
  assert.equal(await page.locator('.design-card').count(),6);
  assert.equal(await page.locator('audio').count(),0,'no audio fetched before an explicit interaction');
  for(const player of await page.locator('.design-stage .vinyl-player').all()){
   const disc=await player.locator('.vinyl-disc').boundingBox(),sleeve=await player.locator('.vinyl-sleeve').boundingBox();
   assert(disc.height>sleeve.height*1.4,'disc visibly taller than sleeve');
   assert(Math.abs((sleeve.x-disc.x)-disc.width/2)<2,'sleeve starts at centre of disc');
  }
  await page.locator('.design-card').first().locator('.play-control').click();
  await page.waitForFunction(()=>{const m=window.__celestianMusicManager,a=m.getAudio('imperial-knights');return !a.paused&&a.currentTime>0&&Math.abs(a.volume-.2)<.001});
  assert.equal(await page.locator('.design-stage .vinyl-player[data-playing=true]').count(),6);
  await page.locator('.design-card').first().locator('.seek-control').fill('400');
  const ratio=await page.evaluate(()=>{const a=window.__celestianMusicManager.getAudio('imperial-knights');return a.currentTime/a.duration});assert(Math.abs(ratio-.4)<.015);
  await page.locator('.design-card').nth(3).locator('.mute-control').click();
  assert(await page.evaluate(()=>window.__celestianMusicManager.getAudio('imperial-knights').muted));
  await page.locator('.design-card').first().locator('.mute-control').click();
  await page.locator('#preview-track').selectOption('unconventional-affairs');
  await page.waitForFunction(()=>{const m=window.__celestianMusicManager;return m.controller.target==='unconventional-affairs'&&!m.getAudio('unconventional-affairs').paused&&m.getAudio('imperial-knights').paused});
  assert.equal(await page.locator('.design-stage .track-title').first().innerText(),'一切皆如常');
  await page.locator('.design-card').nth(1).locator('.play-control').click();
  await page.waitForFunction(()=>window.__celestianMusicManager.getAudio('unconventional-affairs').paused);
  await page.locator('[data-mode=hover]').click();
  const first=page.locator('.design-stage .vinyl-player').first();
  await first.locator('.vinyl-disc').hover();await page.waitForTimeout(450);assert.equal(await first.getAttribute('data-open'),'true');
  await page.locator('h1').hover();await page.waitForTimeout(650);assert.equal(await first.getAttribute('data-open'),'false');
  await page.locator('.scene-button').nth(4).click();
  await page.locator('.scene-dialog').waitFor();
  assert.equal(await page.locator('.scene-design-name').innerText(),'银雾玻璃');
  await page.locator('.scene-player-slot .vinyl-disc').hover();await page.waitForTimeout(450);
  await page.screenshot({path:path.resolve(__dirname,'../../audit/vinyl-designs-in-scene.png')});
  await page.locator('.scene-next').click();assert.equal(await page.locator('.scene-design-name').innerText(),'暗红封蜡');
  await page.locator('#scene-select').selectOption('astrology');
  assert.equal(await page.locator('.scene-caption>p').innerText(),'永恒不灭的占星会');
  await page.locator('.scene-close').click();
  assert.equal(await page.locator('.scene-dialog').isVisible(),false);
  await page.setViewportSize({width:320,height:740});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('.scene-button').first().click();
  await page.locator('.scene-player-slot .vinyl-disc').click();
  const player=await page.locator('.scene-player-slot .vinyl-player').boundingBox();assert(player.x>=0&&player.x+player.width<=320);
  await page.locator('.scene-close').click();
  assert.deepEqual(errors,[]);
  console.log('Six reference-matching silhouettes; shared audio, seek, mute, pause, crossfade, hover collapse, scene preview and 320px layout passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
