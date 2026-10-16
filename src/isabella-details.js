import {createIsabellaMotion} from './isabella-motion-renderer.js'
import {isabellaHairStrands} from './isabella-hair-rig.js'

const canvas=document.querySelector('#portrait'),overlay=document.querySelector('#hair-overlay')
const pause=document.querySelector('#pause'),regions=document.querySelector('#regions'),still=document.querySelector('#still')
const selector=document.querySelector('#strand'),legend=document.querySelector('#legend')
const reduced=matchMedia('(prefers-reduced-motion: reduce)')
let paused=reduced.matches,staticMode=false,time=0,last=0,raf=0
const renderer=await createIsabellaMotion(canvas,'/character-profile/redraws/isabella-a-v6.webp')
function updatePause(){pause.textContent=paused?'继续播放':'暂停动态';pause.setAttribute('aria-pressed',String(paused))}
updatePause()
pause.onclick=()=>{paused=!paused;updatePause()}
still.onclick=()=>{staticMode=!staticMode;still.setAttribute('aria-pressed',String(staticMode))}
function showRegions(show){overlay.toggleAttribute('hidden',!show);regions.setAttribute('aria-pressed',String(show))}
regions.onclick=()=>showRegions(overlay.hasAttribute('hidden'))
for(const [i,strand] of isabellaHairStrands.entries()){
  const polygon=document.createElementNS('http://www.w3.org/2000/svg','polygon')
  polygon.setAttribute('points',strand.boundary.map(p=>p.join(',')).join(' '))
  polygon.setAttribute('fill',strand.color);polygon.setAttribute('fill-opacity','.16');polygon.setAttribute('stroke',strand.color);polygon.dataset.strand=strand.id;overlay.append(polygon)
  const option=document.createElement('option');option.value=strand.id;option.textContent=`${String(i+1).padStart(2,'0')} · ${strand.name}`;selector.append(option)
  const label=document.createElement('div'),swatch=document.createElement('i');swatch.className='swatch';swatch.style.background=strand.color;label.append(swatch,` ${i+1} ${strand.name}`);legend.append(label)
}
selector.onchange=()=>{showRegions(true);overlay.querySelectorAll('polygon').forEach(p=>{p.style.display=selector.value==='all'||selector.value===p.dataset.strand?'':'none'})}
const observer=new ResizeObserver(()=>renderer.resize());observer.observe(canvas)
function detail(id,x,y,w,h){
  const target=document.querySelector(id),ctx=target.getContext('2d')
  ctx.clearRect(0,0,target.width,target.height)
  ctx.drawImage(canvas,(.03+x/896*.94)*canvas.width,(.03+y/1152*.94)*canvas.height,w/896*.94*canvas.width,h/1152*.94*canvas.height,0,0,target.width,target.height)
}
function tick(now){
  if(last&&!paused&&!document.hidden)time+=Math.min((now-last)/1000,.05)
  last=now;renderer.render(time,staticMode?0:1)
  detail('#crown',393,105,190,190);detail('#hand',226,435,120,77.5)
  raf=requestAnimationFrame(tick)
}
raf=requestAnimationFrame(tick)
document.querySelector('#status').textContent='本地预览 · 无损立绘 · 自然幅度 · 未发布'
function onReduced(){paused=reduced.matches;updatePause()}
reduced.addEventListener('change',onReduced)
function destroy(){cancelAnimationFrame(raf);observer.disconnect();renderer.destroy();reduced.removeEventListener('change',onReduced)}
window.addEventListener('pagehide',event=>{if(!event.persisted)destroy()},{once:true})
if(import.meta.hot)import.meta.hot.dispose(destroy)
