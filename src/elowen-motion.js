import './elowen-motion.css'
import {mountProfileGalaxy} from './profile-galaxy.jsx'
import {createElowenMotion} from './elowen-motion-renderer.js'

const root=document.querySelector('.elowen-study')
const canvas=document.querySelector('#elowen-canvas')
const fallback=document.querySelector('#elowen-fallback')
const status=document.querySelector('#motion-status')
const pauseButton=document.querySelector('#motion-toggle')
const originalButton=document.querySelector('#original-toggle')
const reduced=matchMedia('(prefers-reduced-motion: reduce)')
const unmountSky=mountProfileGalaxy(document.querySelector('#elowen-sky'))
let renderer,observer,raf,disposed=false,ready=false
let paused=reduced.matches,original=false,time=0,last=0,renderedFrames=0

function updateStatus(){
  root.classList.toggle('is-still',paused||original)
  status.textContent=original?'原图对比':paused?'画面已暂停':'自动循环 · 12 秒'
  pauseButton.textContent=paused?'继续播放':'暂停'
  pauseButton.setAttribute('aria-pressed',String(paused))
  originalButton.textContent=original?'返回动态':'对比原图'
  originalButton.setAttribute('aria-pressed',String(original))
}
function draw(){renderer?.render(time,original?0:1);renderedFrames++}
function tick(now){
  if(disposed)return
  raf=requestAnimationFrame(tick)
  if(!ready||document.hidden||paused||original){last=0;return}
  if(last && now-last<1000/60)return
  time+=(last?Math.min((now-last)/1000,.05):0)
  last=now;draw()
}
pauseButton.addEventListener('click',()=>{paused=!paused;last=0;updateStatus()})
originalButton.addEventListener('click',()=>{original=!original;last=0;draw();updateStatus()})
function onReducedChange(event){paused=event.matches;last=0;if(ready)updateStatus()}
reduced.addEventListener('change',onReducedChange)
canvas.addEventListener('webglcontextlost',event=>{
  event.preventDefault();ready=false;canvas.hidden=true;fallback.hidden=false
  status.textContent='暂时显示原图，刷新可恢复动态'
  pauseButton.disabled=true;originalButton.disabled=true
})

async function start(){
  try{
    renderer=await createElowenMotion(canvas,fallback.src)
    if(disposed){renderer.destroy();return}
    observer=new ResizeObserver(()=>renderer.resize())
    observer.observe(canvas.parentElement)
    canvas.hidden=false;fallback.hidden=true;ready=true
    pauseButton.disabled=false;originalButton.disabled=false
    renderer.resize();draw();updateStatus();raf=requestAnimationFrame(tick)
    window.elowenMotion={
      get state(){return {ready,paused,original,time,renderedFrames}},
      // Deterministic frame inspection is only enabled on the local QA URL.
      ...(new URLSearchParams(location.search).has('inspect')?{frameAt(seconds){paused=true;original=false;time=seconds;draw();updateStatus()}}:{}),
    }
  }catch(error){
    console.error('Elowen motion preview:',error)
    status.textContent='动态暂不可用 · 当前显示原图'
  }
}
function dispose(){
  if(disposed)return
  disposed=true;ready=false;cancelAnimationFrame(raf);observer?.disconnect()
  renderer?.destroy();unmountSky();reduced.removeEventListener('change',onReducedChange)
}
window.addEventListener('pagehide',event=>{if(!event.persisted)dispose()})
if(import.meta.hot)import.meta.hot.dispose(dispose)
start()
