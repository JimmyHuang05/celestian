const { chromium } = require('C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless:true, args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport:{width:1440,height:900} });
    const errors = [];
    page.on('pageerror', e=>errors.push(e.message));
    page.on('response', r=>{if(r.status()>=400) errors.push(`${r.status()} ${r.url()}`)});
    page.on('console', m=>{if(m.type()==='warning' || m.type()==='error') console.log(m.text().slice(0,200))});
    await page.addInitScript(()=>localStorage.setItem('celestian-music-enabled','false'));
    await page.goto('http://127.0.0.1:5173/imperial-knights.html');
    await page.waitForFunction(()=>document.querySelector('.standards')?.dataset.cloth==='ready',{},{timeout:45000});
    assert.equal(await page.locator('.standard-button[data-cloth="ready"]').count(),5);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>document.querySelector('.standards-cloth-canvas')?.dataset.motion==='paused');
    await page.screenshot({path:path.resolve(__dirname,'../../audit/faction-performance/after-imperial-webgl.png')});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForFunction(()=>document.querySelector('.standards-cloth-canvas')?.dataset.motion==='playing');
    await page.getByRole('button',{name:'下一个势力：永恒不灭的占星会',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.standards-cloth-canvas')?.dataset.motion==='paused');
    const frame=page.frameLocator('#music-page-frame');
    await frame.locator('.astrology-chaos-canvas[data-ready="true"][data-artwork="loaded"]').waitFor({timeout:45000});
    await page.goBack();
    await page.waitForFunction(()=>!document.getElementById('music-page-frame')&&document.querySelector('.standards-cloth-canvas')?.dataset.motion==='playing');
    assert.deepEqual(errors,[]);
    console.log('All five WebGL flags render; reduced motion and covered-page pause/resume pass; astrology effects load after artwork.');
  } finally { await browser.close() }
})().catch(e=>{console.error(e);process.exitCode=1});
