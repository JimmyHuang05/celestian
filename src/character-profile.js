import './character-profile.css'
import './character-profile-theme.css'
import './character-dossier.css'
import './profile-roster-sectors.css'
import './profile-desktop-scale.css'
import './profile-identity.css'
import {mountRosterAstrolabe} from './profile-astrolabe.js'
import {mountSectorPortrait} from './profile-roster-sectors.js'
import {renderDossier} from './profile-content.js'
import {mountProfileGalaxy} from './profile-galaxy.jsx'
import {mountProfileSound} from './profile-sound.js'
import {mountPortraitMotion} from './profile-portrait-motion.js'
import {connectProfileNavigation} from './profile-navigation.js'

connectProfileNavigation()

const unmountGalaxy=mountProfileGalaxy(document.querySelector('#profile-galaxy'))
if(import.meta.hot)import.meta.hot.dispose(unmountGalaxy)

async function init(){
  const response=await fetch('/character-profile/characters.json?v=3')
  if(!response.ok)throw new Error('Unable to load character archive')
  const operators=await response.json()
  if(!Array.isArray(operators)||!operators.length)throw new Error('Empty character archive')
  const roster=document.querySelector('.roster')
  const astrolabe=document.querySelector('.roster-astrolabe')
  const {rotate:turnAstrolabe,setOrbitRadius,destroy:destroyAstrolabe}=mountRosterAstrolabe(astrolabe)
  if(import.meta.hot)import.meta.hot.dispose(destroyAstrolabe)
  const story=document.querySelector('#story')
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)')
  const initialId=new URLSearchParams(location.search).get('id')
  let active=Math.max(0,operators.findIndex(entry=>entry.id===initialId)),rotating=false,wheelTimer,dialAngle=0,wheelGeometry
  let requested=active
  let backdropVersion=0
  const backdrop=document.querySelector('#identity-portrait')
  const sound=mountProfileSound(()=>operators[active].id)
  if(import.meta.hot)import.meta.hot.dispose(sound.destroy)
  const portraitMotion=mountPortraitMotion(document.querySelector('#portrait'))
  if(import.meta.hot)import.meta.hot.dispose(portraitMotion.destroy)
  const wrap=index=>(index%operators.length+operators.length)%operators.length
  const half=Math.floor(operators.length/2)
  const slotOf=index=>wrap(index-active+half)-half
  // Align the actual face and foot/robe landmarks, rather than tall props or transparent padding.
  const portraitFrames={
    '2a9bf85c-f975-4054-9597-5f4f11414983':{eye:.12,sole:.985,anchor:50,faceX:.52},
    'bf217625-407b-4cff-ae92-4f1ba3ba8cca':{eye:.17,sole:.985,anchor:49,faceX:.5},
    '4ea0b64e-1c59-43a5-a082-caf6c6a5a790':{eye:.20,sole:.985,anchor:53,faceX:.53},
    '5bf8f6ab-da96-4cc6-a715-45050f289dd5':{eye:.147,sole:.99,anchor:53,faceX:.53},
    'ec561630-2810-41a0-8524-857bfa8365e1':{eye:.15,sole:.987,anchor:60,faceX:.60}
  }
  const sectorLayouts=[]
  const cards=operators.map((entry,i)=>{
    const button=document.createElement('button')
    button.className='operator'
    button.dataset.kind=i
    button.setAttribute('aria-label',`选择${entry.name}`)
    sectorLayouts.push(mountSectorPortrait(button,entry,i,portraitFrames[entry.id]))
    button.onclick=()=>select(i)
    roster.appendChild(button)
    return button
  })

  function resizeWheel(){
    const width=roster.clientWidth,height=roster.clientHeight
    const oldAngle=54*Math.PI/180
    const dx=.71*width*(1-Math.cos(oldAngle))
    const dy=.297*height*Math.sin(oldAngle)
    const radius=(dx*dx+dy*dy)/(2*dx)
    const centerX=.6*width-radius
    const step=Math.atan2(dy,radius-dx)*180/Math.PI
    const depth=Math.min(width*.54,height*.165)
    const spread=Math.min(step*.34*Math.PI/180,Math.atan(height*.09/radius))
    // Leave a gap between the windows and the outer tick band.
    const diameter=(radius+depth/2+14)/.432
    wheelGeometry={width,height,radius,centerX,step,depth,spread,outerRadius:diameter*.478}
    astrolabe.style.left=`${centerX}px`
    astrolabe.style.width=`${diameter}px`
    setOrbitRadius(radius/diameter*1000,(depth/2+7)/diameter*1000,step)
    if(!rotating)settleWheel()
  }

  function placeCard(card,slot){
    const {width,height,radius,centerX,step}=wheelGeometry
    const angle=slot*step*Math.PI/180
    const distance=Math.abs(slot),prominence=Math.max(0,1-distance)
    card.style.setProperty('--x',`${(centerX+radius*Math.cos(angle))/width*100}%`)
    card.style.setProperty('--y',`${49+radius*Math.sin(angle)/height*100}%`)
    sectorLayouts[Number(card.dataset.kind)](wheelGeometry,angle)
    card.style.opacity=Math.max(0,Math.min(1,2-distance))
    card.style.zIndex=String(Math.round(10+10*prominence))
    card.classList.toggle('active',distance<.5)
    card.setAttribute('aria-hidden',distance>=2?'true':'false')
    card.tabIndex=distance<=1.01?0:-1
  }

  function settleWheel(){
    cards.forEach((card,i)=>placeCard(card,slotOf(i)))
  }

  function select(index){
    sound.unlock()
    if(wrap(index)!==requested)sound.cancel()
    requested=wrap(index)
    if(rotating||requested===active)return
    if(reducedMotion.matches){
      let distance=wrap(requested-active)
      if(distance>half)distance-=operators.length
      dialAngle-=distance*wheelGeometry.step
      turnAstrolabe(dialAngle)
      commitSelection(requested,true)
      settleWheel()
    }else rotateStep()
  }

  function rotateStep(){
    rotating=true
    roster.classList.add('is-rotating')
    const direction=wrap(requested-active)<=half?1:-1
    const target=wrap(active+direction)
    const startAngle=dialAngle
    const slots=cards.map((_,i)=>slotOf(i))
    let started
    function frame(now){
      started??=now
      const progress=reducedMotion.matches?1:Math.min(1,(now-started)/620)
      const eased=progress<.5?4*progress**3:1-(-2*progress+2)**3/2
      turnAstrolabe(startAngle-direction*wheelGeometry.step*eased)
      cards.forEach((card,i)=>placeCard(card,slots[i]-direction*eased))
      if(progress<1){requestAnimationFrame(frame);return}
      dialAngle=startAngle-direction*wheelGeometry.step
      commitSelection(target,true)
      settleWheel()
      rotating=false
      roster.classList.remove('is-rotating')
      if(requested!==active)rotateStep()
    }
    requestAnimationFrame(frame)
  }

  function updateReadingHint(){
    const overflow=story.scrollHeight>story.clientHeight+2
    const bottom=story.scrollTop+story.clientHeight>=story.scrollHeight-3
    document.querySelector('#reading-hint').hidden=!overflow
    document.querySelector('#reading-hint').textContent=bottom?'已读至末尾':'滚动阅读 ↓'
  }

  function commitSelection(index,playSound=false){
    active=index
    const entry=operators[index]
    const url=new URL(location.href)
    url.searchParams.set('id',entry.id)
    history.replaceState(null,'',url)
    if(window.parent!==window)window.parent.postMessage({type:'profile:selection',id:entry.id},location.origin)
    document.title=`${entry.name} · 众生录`
    document.querySelector('#name').textContent=entry.name
    document.querySelector('#profession').textContent=entry.title
    document.querySelector('#identity-number').textContent=['I','II','III','IV','V'][index]??String(index+1)
    const portrait=document.querySelector('#portrait')
    portrait.fetchPriority='high'
    const frame=portraitFrames[entry.id]
    const height=(frame?(.95-.25)/(frame.sole-frame.eye):.90)*1.1
    portrait.style.setProperty('--portrait-height',`${height*100}%`)
    portrait.style.setProperty('--portrait-top',`${(frame ? .95-frame.sole*height : .95-height)*100}%`)
    portrait.style.setProperty('--portrait-anchor',`${frame?.anchor??50}%`)
    void portraitMotion.select(entry)
    // Reuse the current portrait download, but keep this enlarged backdrop still.
    // Clear it immediately so a slow response never shows the previous person.
    const backdropRequest=++backdropVersion
    backdrop.hidden=true
    backdrop.style.setProperty('--backdrop-top',`${(0.28-(frame?.eye??.15)*1.65)*100}%`)
    backdrop.style.setProperty('--backdrop-anchor',`${-(frame?.faceX??.5)*100}%`)
    backdrop.src=entry.image
    backdrop.decode().then(()=>{
      if(backdropRequest===backdropVersion)backdrop.hidden=false
    }).catch(()=>{/* Decorative backdrop stays hidden if the portrait fails. */})
    const emblem=document.querySelector('#emblem')
    document.querySelector('.dossier-subtitle').textContent=entry.dossierSubtitle||'权柄的织者'
    emblem.src=entry.emblem
    emblem.alt=`${entry.name}的档案徽章`
    emblem.hidden=!entry.emblem
    document.querySelector('#archive-index').textContent=String(index+1).padStart(2,'0')
    document.querySelector('#archive-total').textContent=String(operators.length).padStart(2,'0')
    cards.forEach((card,i)=>card.setAttribute('aria-pressed',i===active))
    renderDossier(entry)
    if(playSound&&index===requested)sound.schedule(entry.id)
    requestAnimationFrame(updateReadingHint)
  }

  roster.addEventListener('wheel',event=>{
    if(Math.abs(event.deltaY)<3)return
    event.preventDefault()
    if(wheelTimer)return
    select(requested+(event.deltaY>0?1:-1))
    wheelTimer=setTimeout(()=>{wheelTimer=undefined},680)
  },{passive:false})
  document.querySelector('#previous-character').onclick=()=>select(requested-1)
  document.querySelector('#next-character').onclick=()=>select(requested+1)
  document.addEventListener('keydown',event=>{
    // Reading the story with arrow keys should never switch the selected person.
    if(event.target.closest('.story-scroll'))return
    if(event.key==='ArrowUp'||event.key==='ArrowDown'){
      event.preventDefault()
      select(requested+(event.key==='ArrowDown'?1:-1))
    }
  })
  story.addEventListener('scroll',updateReadingHint,{passive:true})
  new ResizeObserver(updateReadingHint).observe(story)
  new ResizeObserver(resizeWheel).observe(roster)
  resizeWheel()
  commitSelection(active)
  settleWheel()
}

init().catch(error=>{
  console.error(error)
  const story=document.querySelector('#story')
  story.replaceChildren()
  const message=document.createElement('p')
  message.className='dossier-error'
  message.textContent='档案暂时无法展开，请刷新页面重试。'
  story.append(message)
  document.querySelector('#reading-hint').hidden=true
  document.querySelectorAll('.archive-switch button').forEach(button=>button.disabled=true)
})
