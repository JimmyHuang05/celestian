// Keep this breakpoint aligned with profile-mobile.css.
export const COMPACT_PROFILE_QUERY='(max-width: 1180px)'

const ns='http://www.w3.org/2000/svg'

export function mountMobileProfile(entries,frames,onSelect){
  const profile=document.querySelector('.profile')
  const sky=document.createElement('div')
  sky.className='mobile-sky'
  sky.setAttribute('aria-hidden','true')
  const stars=document.createElementNS(ns,'svg')
  stars.setAttribute('viewBox','0 0 440 1000')
  stars.setAttribute('preserveAspectRatio','xMidYMin slice')
  // Deterministic positions avoid a changing pattern on character selection.
  stars.innerHTML=Array.from({length:155},(_,i)=>{
    const x=(i*137.508+19)%440,y=(i*71.717+37)%1000
    const radius=i%17===0?1.3:i%5===0?.8:.45
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${i%5===0?'#dfc58e':'#c6d6f2'}" opacity="${.18+(i%7)*.07}"/>`
  }).join('')+'<path d="M26 257L71 223L99 273L59 324M342 452L376 482L364 546L403 566" fill="none" stroke="#cfb67c" stroke-width=".5" opacity=".22"/>'
  sky.append(stars)
  profile.prepend(sky)
  const nav=document.createElement('nav')
  nav.className='mobile-archive'
  nav.setAttribute('aria-label','选择角色')
  nav.innerHTML='<div class="mobile-archive-heading"><span>CELESTIAN <i> / </i> 人物图鉴</span><span class="mobile-archive-count"></span></div><div class="mobile-portraits"></div><span class="mobile-swipe-hint" aria-hidden="true">滑动选角 ↔</span>'
  const track=nav.querySelector('.mobile-portraits')
  const buttons=entries.map((entry,i)=>{
    const button=document.createElement('button')
    button.type='button'
    button.className='mobile-character'
    button.setAttribute('aria-label',`选择${entry.name}`)
    const face=document.createElement('span')
    face.className='mobile-avatar'
    const img=document.createElement('img')
    img.src=entry.avatar??entry.image
    img.alt=''
    img.decoding='async'
    const frame=frames[entry.id]
    // The existing avatar assets retain the complete portrait's proportions.
    img.style.left=`${50-(frame?.faceX??.5)*225}%`
    img.style.top=`${27-(frame?.eye??.15)*300}%`
    face.append(img)
    const name=document.createElement('span')
    name.className='mobile-character-name'
    name.textContent=entry.name
    button.append(face,name)
    button.onclick=()=>onSelect(i)
    track.append(button)
    return button
  })
  document.querySelector('.identity').before(nav)
  const stage=document.querySelector('.portrait-area')
  const caption=document.createElement('div')
  caption.className='mobile-portrait-caption'
  caption.setAttribute('aria-hidden','true')
  caption.innerHTML='<span>PERSONAE</span><span class="mobile-portrait-index"></span>'
  stage.append(caption)
  return {
    update(index){
      buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)))
      nav.querySelector('.mobile-archive-count').textContent=`${String(index+1).padStart(2,'0')} / ${String(entries.length).padStart(2,'0')}`
      caption.querySelector('.mobile-portrait-index').textContent=`— ${String(index+1).padStart(2,'0')} —`
      if(matchMedia(COMPACT_PROFILE_QUERY).matches){
        const button=buttons[index]
        track.scrollTo({left:button.offsetLeft-track.offsetLeft-(track.clientWidth-button.offsetWidth)/2,behavior:'instant'})
      }
    },
    destroy(){sky.remove();nav.remove();caption.remove()},
  }
}
