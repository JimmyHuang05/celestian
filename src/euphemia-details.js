import {createEuphemiaMotion} from './euphemia-motion-renderer.js'
const canvas=document.querySelector('#portrait')
const crystal=document.querySelector('#crystal'),halo=document.querySelector('#halo')
const reduced=matchMedia('(prefers-reduced-motion: reduce)')
let paused=reduced.matches,time=0,last=0
const toggle=document.querySelector('#pause')
function update(){toggle.textContent=paused?'继续播放':'暂停动态'}
toggle.onclick=()=>{paused=!paused;update()}
reduced.onchange=()=>{paused=reduced.matches;update()}
update()
const renderer=await createEuphemiaMotion(canvas,'/character-profile/redraws/euphemia-v1.webp')
const observer=new ResizeObserver(()=>renderer.resize());observer.observe(canvas)
function detail(target,x,y,w,h){
  const context=target.getContext('2d')
  context.clearRect(0,0,target.width,target.height)
  context.drawImage(canvas,(.03+x/1086*.94)*canvas.width,(.03+y/1448*.94)*canvas.height,w/1086*.94*canvas.width,h/1448*.94*canvas.height,0,0,target.width,target.height)
}
function tick(now){
  if(!paused&&!document.hidden&&last)time+=Math.min((now-last)/1000,.05)
  last=now;renderer.render(time)
  detail(crystal,744,124,190,152)
  detail(halo,302,-5,410,307.5)
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)
document.querySelector('#status').textContent='本地预览 · 圣环额外位移约 ±1.8 原图像素'
