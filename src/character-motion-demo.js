import './character-motion-demo.css'
import {mountProfileGalaxy} from './profile-galaxy.jsx'
import initInochi, {Inochi2dRuntime} from './vendor/inochi2d/inochi2d.js'

const $ = (id) => document.getElementById(id)
const canvas = $('puppet')
const host = $('canvas-host')
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
const state = {ready:false, paused:reducedMotion.matches, mode:'idle', strength:.35, time:0, last:0, blinkAt:2.5, blinkStart:-10, nodAt:-10, smileAt:-10, gazeX:0, gazeY:0, targetX:0, targetY:0, view:'full', frames:0}
let runtime, frameId, resizeObserver, disposed=false
const handles = new Map()
const cleanupGalaxy = mountProfileGalaxy($('sample-galaxy'))
const clamp = (n,min,max) => Math.min(max,Math.max(min,n))
const smooth = (a,b,dt) => a+(b-a)*(1-Math.exp(-dt*5))

function parameter(name,x,y=0,afterPhysics=false){
  const handle=handles.get(name)
  if(handle===undefined) return
  if(afterPhysics) runtime.set_post_physics_parameter_vec2_by_handle(handle,x,y)
  else runtime.set_parameter_vec2_by_handle(handle,x,y)
}

function setPaused(paused){
  state.paused=paused
  $('pause').setAttribute('aria-pressed',String(paused))
  $('pause').innerHTML=paused?'<span aria-hidden="true">▷</span> 继续，看看动态':'<span aria-hidden="true">Ⅱ</span> 暂停，看看静态'
  $('live-status').textContent=paused?'已暂停 · 静态对比':'动态运行中'
  $('live-status').classList.toggle('is-paused',paused)
  state.last=0
}

function resize(){
  if(!runtime || !state.ready) return
  const {width,height}=host.getBoundingClientRect()
  runtime.resize(Math.round(width),Math.round(height),Math.min(devicePixelRatio,1.25))
  const scale=state.view==='close' ? Math.min(height/2400,width/2300) : Math.min(height/5500,width/3000)
  runtime.set_camera_transform(-100,state.view==='close' ? 1400 : 60,scale)
  runtime.tick(state.time*1000)
}

function animate(now){
  if(disposed)return
  frameId=requestAnimationFrame(animate)
  if(!state.ready || state.paused || document.hidden){state.last=0;return}
  if(state.last && now-state.last<1000/60)return
  const dt=state.last?Math.min((now-state.last)/1000,.05):1/60
  state.last=now;state.time+=dt
  const t=state.time, a=state.strength
  const breathing=$('breathing').checked, secondary=$('secondary').checked
  const follow=state.mode==='follow'
  state.gazeX=smooth(state.gazeX,follow?state.targetX:Math.sin(t*.43)*.22,dt)
  state.gazeY=smooth(state.gazeY,follow?state.targetY:Math.sin(t*.31)*.10,dt)
  const nodPhase=(t-state.nodAt)/1.3
  const nod=nodPhase>=0&&nodPhase<1?Math.sin(nodPhase*Math.PI*2)*Math.sin(nodPhase*Math.PI)*.55:0
  parameter('Head:: Yaw-Pitch',state.gazeX*a*1.4,-state.gazeY*a*1.3+nod)
  parameter('Head:: Roll',breathing?Math.sin(t*.58)*.13*a:0)
  parameter('Body:: Yaw-Pitch',breathing?Math.sin(t*.43)*.16*a:0,breathing?Math.sin(t*.62)*.07*a:0)
  parameter('Body:: Roll',breathing?Math.sin(t*.58-.6)*.10*a:0)
  parameter('Breath',breathing?(.5+.5*Math.sin(t*1.38))*a:0)
  parameter('Eye:: Left:: Move',state.gazeX*a*1.6)
  parameter('Eye:: Right:: Move',state.gazeX*a*1.6)
  parameter('Eye:: Left:: Move Y',-state.gazeY*a*1.2)
  parameter('Eye:: Right:: Move Y',-state.gazeY*a*1.2)
  if($('blinking').checked && t>=state.blinkAt){state.blinkStart=t;state.blinkAt=t+3+Math.random()*3.2}
  const blinkPhase=(t-state.blinkStart)/.24
  const blink=blinkPhase>=0&&blinkPhase<1?Math.sin(blinkPhase*Math.PI):0
  parameter('Eye:: Left:: Blink',blink)
  parameter('Eye:: Right:: Blink',blink)
  const smilePhase=(t-state.smileAt)/2.8
  const smile=smilePhase>=0&&smilePhase<1?Math.sin(smilePhase*Math.PI):0
  parameter('Mouth:: Shape',1,smile*.35)
  parameter('Mouth:: Width',smile*.5)
  parameter('Brow:: Left:: Lift',smile*.14)
  parameter('Brow:: Right:: Lift',smile*.14)
  parameter('Tail:: Move',secondary?Math.sin(t*.8)*.35*a:0)
  parameter('Hair:: Ahoge:: Swing',secondary?Math.sin(t*1.1+.7)*.24*a:0)
  // Drive the actual rig's deform parameters; no whole-image CSS animation.
  for(const name of handles.keys()){
    if(!name.endsWith(':: Physics'))continue
    const phase=name.includes('Left')?.55:-.55
    const amount=secondary ? a*(name.includes('Hair')?.24:.15):0
    parameter(name,Math.sin(t*1.05+phase)*amount,Math.sin(t*.73+phase)*amount*.4,true)
  }
  runtime.tick(t*1000)
  state.frames++
}

function mode(value){
  state.mode=value
  $('idle-mode').setAttribute('aria-pressed',String(value==='idle'))
  $('follow-mode').setAttribute('aria-pressed',String(value==='follow'))
}
$('idle-mode').addEventListener('click',()=>mode('idle'))
$('follow-mode').addEventListener('click',()=>mode('follow'))
document.addEventListener('pointermove',event=>{
  const r=host.getBoundingClientRect()
  state.targetX=clamp((event.clientX-r.left-r.width*.5)/(r.width*.4),-1,1)
  state.targetY=clamp((event.clientY-r.top-r.height*.3)/(r.height*.4),-1,1)
})
document.documentElement.addEventListener('pointerleave',()=>{state.targetX=0;state.targetY=0})
$('pause').addEventListener('click',()=>setPaused(!state.paused))
$('intensity').addEventListener('input',event=>{
  state.strength=Number(event.target.value)/100
  $('intensity-value').value=`${state.strength<.5?'轻柔':'明显'} · ${event.target.value}%`
})
function react(type){if(!state.ready)return;setPaused(false);state[type]=state.time;if(type==='blinkStart')state.blinkAt=state.time+4}
$('blink-once').addEventListener('click',()=>react('blinkStart'))
$('nod-once').addEventListener('click',()=>react('nodAt'))
$('smile-once').addEventListener('click',()=>react('smileAt'))
canvas.addEventListener('click',()=>react('blinkStart'))
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
  state.view=button.dataset.view
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))
  resize()
}))
$('retry').addEventListener('click',()=>location.reload())

async function start(){
  try{
    await initInochi()
    if(disposed)return
    // The desktop renderer requests CLAMP_TO_BORDER, which WebGL does not expose.
    // Scope the compatibility mapping to this canvas, leaving the galaxy untouched.
    const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true})
    if(!gl)throw new Error('浏览器暂不支持 WebGL 2，请开启硬件加速后重试。')
    const texParameteri=gl.texParameteri.bind(gl)
    gl.texParameteri=(target,pname,param)=>texParameteri(target,pname,(pname===gl.TEXTURE_WRAP_S||pname===gl.TEXTURE_WRAP_T)&&param===0x812d?gl.CLAMP_TO_EDGE:param)
    // Preserve transparent borders instead of smearing edge pixels over the mesh.
    const shaderSource=gl.shaderSource.bind(gl)
    gl.shaderSource=(shader,source)=>{
      if(source.includes('in vec2 texUVs;'))source=source.replace('void main() {','void main() {\n  if (any(lessThan(texUVs, vec2(0.0))) || any(greaterThan(texUVs, vec2(1.0)))) discard;')
      shaderSource(shader,source)
    }
    runtime=new Inochi2dRuntime(canvas)
    const response=await fetch('/inochi-sample/Aka.inx')
    if(!response.ok)throw new Error(`模型加载失败（${response.status}）`)
    const bytes=new Uint8Array(await response.arrayBuffer())
    if(disposed)return
    const length=new DataView(bytes.buffer).getUint32(8,false)
    const model=JSON.parse(new TextDecoder().decode(bytes.subarray(12,12+length)))
    runtime.load_model(bytes)
    for(const p of model.param){
      handles.set(p.name,runtime.resolve_parameter_handle_by_name(p.name))
      parameter(p.name,p.defaults?.[0]||0,p.defaults?.[1]||0)
    }
    parameter('Mouth:: Shape',1,0)
    state.ready=true
    resize()
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host)
    $('loading').hidden=true;$('controls').disabled=false
    setPaused(state.paused)
    // Expose read-only diagnostics for the local sample's rendering checks.
    window.motionSample={get state(){return {...state}},snapshot:()=>runtime.get_frame_snapshot_summary()}
    frameId=requestAnimationFrame(animate)
  }catch(error){
    console.error('Dynamic portrait sample:',error)
    $('loading-text').textContent=error.message||String(error)
    $('retry').hidden=false;$('live-status').textContent='加载失败'
    runtime?.free();runtime=null
  }
}
function dispose(){disposed=true;cancelAnimationFrame(frameId);resizeObserver?.disconnect();runtime?.free();runtime=null;cleanupGalaxy()}
window.addEventListener('pagehide',event=>{if(!event.persisted)dispose()},{once:true})
if(import.meta.hot)import.meta.hot.dispose(dispose)
start()
