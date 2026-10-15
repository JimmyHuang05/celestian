import './profile-portrait-motion.css'

const factories={
  '2a9bf85c-f975-4054-9597-5f4f11414983':()=>import('./elowen-motion-renderer.js').then(module=>module.createElowenMotion),
  'bf217625-407b-4cff-ae92-4f1ba3ba8cca':()=>import('./sylvia-motion-renderer.js').then(module=>module.createSylviaMotion),
  '4ea0b64e-1c59-43a5-a082-caf6c6a5a790':()=>import('./euphemia-motion-renderer.js').then(module=>module.createEuphemiaMotion),
  '5bf8f6ab-da96-4cc6-a715-45050f289dd5':()=>import('./xianna-motion-renderer.js').then(module=>module.createXiannaMotion),
  'ec561630-2810-41a0-8524-857bfa8365e1':()=>import('./day-fourteen-motion-renderer.js').then(module=>module.createDayFourteenMotion),
}

export function mountPortraitMotion(portrait){
  const host=portrait.parentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)')
  const cache=new Map()
  let active,entry,version=0,disposed=false,raf=0,last=0,time=0,frames=0,inspectionPaused=false

  function stop(){cancelAnimationFrame(raf);raf=0;last=0}
  function layout(){
    if(!active?.renderer||active.failed||disposed)return
    const box=portrait.getBoundingClientRect(),parent=host.getBoundingClientRect()
    if(!box.width||!box.height)return
    // Undo the renderer's 3% safety margin in CSS. The face/feet landmarks
    // match the approved static portrait exactly, while free tips get bleed.
    const width=box.width/.94,height=box.height/.94
    Object.assign(active.canvas.style,{
      width:`${width}px`,height:`${height}px`,
      left:`${box.left-parent.left-(width-box.width)/2}px`,
      top:`${box.top-parent.top-(height-box.height)/2}px`,
      filter:getComputedStyle(portrait).filter,
    })
    active.renderer.resize()
  }
  function tick(now){
    if(disposed||!active?.renderer||active.failed||document.hidden||reduced.matches||inspectionPaused){stop();return}
    raf=requestAnimationFrame(tick)
    if(last&&now-last<1000/60)return
    time+=last?Math.min((now-last)/1000,.05):0
    last=now;active.renderer.render(time);frames++
  }
  function start(){stop();if(active&&!document.hidden&&!reduced.matches&&!inspectionPaused)raf=requestAnimationFrame(tick)}
  function load(character){
    if(cache.has(character.id))return cache.get(character.id)
    const canvas=document.createElement('canvas')
    canvas.className='portrait-motion';canvas.hidden=true;canvas.setAttribute('aria-hidden','true')
    canvas.dataset.characterId=character.id
    host.append(canvas)
    const item={canvas,renderer:null,failed:false,promise:null}
    cache.set(character.id,item)
    canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();item.failed=true;canvas.hidden=true
      if(active===item){stop();active=null;portrait.classList.remove('has-motion')}
    })
    item.promise=factories[character.id]().then(factory=>factory(canvas,character.image)).then(renderer=>{
      if(disposed){renderer.destroy();canvas.getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext();return null}
      item.renderer=renderer;return item
    }).catch(error=>{item.failed=true;console.warn(`${character.name}动态暂不可用，保留原立绘。`,error);return null})
    return item
  }
  async function select(character){
    entry=character;const request=++version
    stop();active=null;time=0;inspectionPaused=false
    portrait.classList.remove('has-motion')
    cache.forEach(item=>{item.canvas.hidden=true})
    if(disposed||reduced.matches||!factories[character.id])return
    const item=load(character)
    const [ready]=await Promise.all([item.promise,portrait.decode().catch(()=>null)])
    if(disposed||request!==version||!ready||ready.failed)return
    active=ready;ready.canvas.hidden=false;layout();ready.renderer.render(0)
    portrait.classList.add('has-motion');start()
  }
  const observer=new ResizeObserver(layout)
  observer.observe(portrait);observer.observe(host)
  function onPreference(){if(entry)void select(entry)}
  function onVisibility(){if(document.hidden)stop();else start()}
  reduced.addEventListener('change',onPreference)
  document.addEventListener('visibilitychange',onVisibility)
  function destroy(){
    if(disposed)return
    disposed=true;++version;stop();observer.disconnect()
    reduced.removeEventListener('change',onPreference)
    document.removeEventListener('visibilitychange',onVisibility)
    portrait.classList.remove('has-motion')
    cache.forEach(item=>{item.renderer?.destroy();item.canvas.getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext();item.canvas.remove()})
    cache.clear()
    window.removeEventListener('pagehide',onPageHide)
  }
  function onPageHide(event){if(!event.persisted)destroy()}
  window.addEventListener('pagehide',onPageHide)
  if(new URLSearchParams(location.search).has('inspect'))window.profileMotion={
    get state(){return {id:entry?.id,ready:Boolean(active),time,frames,contexts:cache.size}},
    frameAt(seconds){inspectionPaused=true;stop();time=seconds;active?.renderer?.render(time)},
  }
  return {select,destroy}
}
