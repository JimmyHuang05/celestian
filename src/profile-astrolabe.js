import './profile-astrolabe.css'

const polar=(radius,angle)=>{
  const radians=angle*Math.PI/180
  return [500+Math.cos(radians)*radius,500+Math.sin(radians)*radius]
}
const xy=values=>values.map(n=>n.toFixed(2)).join(' ')
const point=(radius,angle)=>xy(polar(radius,angle))
const circle=(radius,extra='')=>`<circle cx="500" cy="500" r="${radius}" ${extra}/>`
const arc=(radius,start,end)=>`M${point(radius,start)}A${radius} ${radius} 0 ${Math.abs(end-start)>180?1:0} 1 ${point(radius,end)}`
const diamond=(radius,angle,size=7)=>`<path d="M${point(radius-size,angle)}L${point(radius,angle-size*.13)}L${point(radius+size,angle)}L${point(radius,angle+size*.13)}Z"/>`
const spark=(x,y,size)=>`M${x-size} ${y}Q${x} ${y} ${x} ${y-size}Q${x} ${y} ${x+size} ${y}Q${x} ${y} ${x} ${y+size}Q${x} ${y} ${x-size} ${y}Z`

// Batch engraved ticks into three paths instead of hundreds of SVG elements.
function ruler(count,inside,outside,majorEvery=30,mediumEvery=5){
  const paths=['','','']
  for(let i=0;i<count;i++){
    const level=i%majorEvery===0?2:i%mediumEvery===0?1:0
    const start=outside-(outside-inside)*[.3,.58,1][level]
    paths[level]+=`M${point(start,i*360/count)}L${point(outside,i*360/count)}`
  }
  return paths.map((d,i)=>`<path d="${d}" opacity="${[.2,.4,.72][i]}" stroke-width="${[.55,.7,1.2][i]}"/>`).join('')
}

function comet(radius,reverse=false){
  const tail=Array.from({length:22},(_,i)=>{
    const alpha=(i+1)/22
    return `<path d="${arc(radius,-19+i*19/22,-19+(i+1)*19/22)}" opacity="${(alpha**1.8*.85).toFixed(3)}" stroke-width="${(.4+alpha*.8).toFixed(2)}"/>`
  }).join('')
  const drawing=`<path d="${arc(radius,-9,0)}" stroke-width="4" opacity=".07"/>${tail}
    <circle cx="${500+radius}" cy="500" r="10" fill="url(#roster-star-halo)" stroke="none"/>
    <circle cx="${500+radius}" cy="500" r="1.8" fill="#f8e6bf" stroke="none"/>`
  return reverse?`<g transform="translate(0 1000) scale(1 -1)">${drawing}</g>`:drawing
}

export function mountRosterAstrolabe(host){
  const numerals=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI']
  const chapterRing=numerals.map((number,i)=>`<g transform="rotate(${i*30} 500 500)">
    <text x="500" y="34" text-anchor="middle" class="dial-roman">${number}</text>
    <path d="M487 24L493 21M507 21L513 24M500 12V18" opacity=".4" stroke-width=".65"/>
    <path d="M500 20L502 24L500 28L498 24Z" fill="#c7b07b26" stroke-width=".6"/>
    <path d="M478 30Q500 17 522 30" opacity=".15" stroke-width=".5"/>
  </g>`).join('')
  const interlace=Array.from({length:120},(_,i)=>{
    if(i%10<2||i%10>7)return ''
    const a=i*3-90
    return `M${point(468,a)}Q${point(475,a+1.5)} ${point(468,a+3)}M${point(475,a)}Q${point(468,a+1.5)} ${point(475,a+3)}`
  }).join('')
  const degrees=Array.from({length:36},(_,i)=>`<g transform="rotate(${i*10} 500 500)">
    <text x="500" y="72" text-anchor="middle" class="dial-degree">${String(i*10).padStart(3,'0')}</text>
  </g>`).join('')
  const compass=Array.from({length:16},(_,i)=>{
    const radius=i%4===0?239:i%2===0?188:145,angle=i*22.5
    return `<path d="M${point(30,angle-22)}L${point(radius,angle)}L${point(30,angle+22)}L500 500Z" fill="${i%2===0?'#b69b6513':'#b69b6505'}" opacity=".45" stroke-width=".65"/>
      <path d="M500 500L${point(radius,angle)}" opacity=".2" stroke-width=".55"/>`
  }).join('')
  const cartouches=Array.from({length:24},(_,i)=>`<g transform="rotate(${i*15} 500 500)" opacity="${i%2?.24:.48}">
    <path d="M495 236L500 228L505 236L500 244ZM490 236H494M506 236H510" stroke-width=".6"/>
    ${i%2?'':'<circle cx="500" cy="236" r="1.4" fill="currentColor" stroke="none"/><path d="M500 220V224M500 248V252" stroke-width=".7"/>'}
  </g>`).join('')
  const constellations=Array.from({length:12},(_,i)=>{
    const angle=i*30+15
    const coords=[[299,-8],[323,-5],[310,1],[340,5],[325,9]].map(([r,a],j)=>polar(r+Math.sin(i*2+j)*9,angle+a))
    return `<g class="dial-constellation"><path d="M${coords.map(xy).join('L')}" opacity=".24" stroke-width=".65"/>
      ${coords.map(([x,y],j)=>`<g class="dial-star dial-animated" style="--star-period:${5+(i+j)%6}s;--star-delay:${-(i*1.3+j)}s">
        <circle cx="${x}" cy="${y}" r="${j===2?7:4}" fill="url(#roster-star-halo)" stroke="none"/>
        <circle cx="${x}" cy="${y}" r="${j===2?1.6:1}" fill="#ceb98b" stroke="none"/>
        ${j===2?`<path d="${spark(x,y,4.5)}" stroke-width=".45" opacity=".65"/>`:''}
      </g>`).join('')}
    </g>`
  }).join('')
  const reticles=Array.from({length:8},(_,i)=>{
    const [x,y]=polar(388,i*45+22.5)
    return `<g transform="translate(${x} ${y})" opacity=".3"><circle r="7" stroke-width=".5"/><circle r="2" stroke-width=".6"/><path d="M-11 0H-5M5 0H11M0 -11V-5M0 5V11" stroke-width=".6"/></g>`
  }).join('')

  host.innerHTML=`<svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" stroke-width="1" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="roster-dial-depth"><stop stop-color="#17253b" stop-opacity=".55"/><stop offset=".65" stop-color="#101c2e" stop-opacity=".28"/><stop offset="1" stop-color="#0a1220" stop-opacity="0"/></radialGradient>
      <radialGradient id="roster-star-halo"><stop stop-color="#edd5a0" stop-opacity=".42"/><stop offset=".3" stop-color="#c9ad76" stop-opacity=".16"/><stop offset="1" stop-color="#c9ad76" stop-opacity="0"/></radialGradient>
      <clipPath id="roster-dial-boundary">${circle(494)}</clipPath>
    </defs>
    ${circle(488,'fill="url(#roster-dial-depth)" stroke="none"')}
    <g class="dial-rim">
      ${circle(489,'opacity=".16" stroke-width=".5"')}${circle(484,'opacity=".42" stroke-width=".65"')}
      ${circle(478,'opacity=".62" stroke-width="1.1"')}${circle(463,'opacity=".22" stroke-width=".55"')}
      ${circle(435,'opacity=".32" stroke-width=".6"')}${circle(419,'opacity=".25" stroke-width=".5"')}
      ${circle(411,'opacity=".18" stroke-width=".5" stroke-dasharray=".5 5"')}
      ${[-83,58,97,238].map(a=>`<path d="${arc(484,a,a+25)}" opacity=".28" stroke-width="1.8"/>`).join('')}
    </g>
    <g data-dial-rotor>
      <g class="dial-clockwork dial-animated">${ruler(360,438,458)}${degrees}</g>
      <g class="dial-chapters dial-animated">${chapterRing}<path d="${interlace}" opacity=".2" stroke-width=".5"/></g>
    </g>
    <g class="dial-filigree dial-animated" opacity=".6">
      ${circle(272,'opacity=".35" stroke-width=".6"')}${circle(264,'opacity=".5" stroke-width=".7"')}
      ${circle(256,'opacity=".2" stroke-width=".5"')}${cartouches}${ruler(180,247,252,15,5)}
    </g>
    <g class="dial-sky dial-animated">${constellations}${reticles}
      ${circle(358,'opacity=".1" stroke-width=".5" stroke-dasharray="1 12"')}
      ${[18,96,198,284].map(a=>`<path d="${arc(370,a,a+32)}" opacity=".12" stroke-width=".65"/>`).join('')}
    </g>
    <g opacity=".42">${circle(320,'data-avatar-orbit stroke-width=".7"')}${circle(313,'data-avatar-orbit-inner stroke-width=".65"')}
      ${circle(308,'data-avatar-orbit-engraving stroke-width=".5" stroke-dasharray=".5 4" opacity=".5"')}
    </g>
    <g opacity=".66">${compass}${circle(126,'opacity=".3" stroke-width=".6"')}${circle(118,'opacity=".24" stroke-dasharray="1 4" stroke-width=".65"')}
      ${ruler(72,101,109,6,3)}${circle(49,'opacity=".6"')}${circle(40,'opacity=".3" stroke-width=".6"')}
      <path d="${spark(500,500,31)}" fill="#c2ad801c" stroke-width=".8"/>
      <circle cx="500" cy="500" r="9" stroke-width=".65"/>
    </g>
    <g data-dial-stations></g>
    <g clip-path="url(#roster-dial-boundary)" class="dial-comets" stroke="#eed6a3" stroke-linecap="round">
      <g class="dial-comet dial-animated" style="--comet-delay:1s">${comet(481)}</g>
      <g class="dial-comet dial-comet-inner dial-animated" style="--comet-delay:9s" data-inner-comet>${comet(286,true)}</g>
    </g>
    <g class="dial-index">
      <path d="M980 500H997M984 495L991 500L984 505" opacity=".75" stroke-width=".75"/>
      <circle class="dial-index-light dial-animated" cx="990" cy="500" r="8" fill="url(#roster-star-halo)" stroke="none"/>
      <path d="M977 500L983 494L989 500L983 506Z" opacity=".65" stroke-width=".65"/>
    </g>
  </svg>`

  const rotor=host.querySelector('[data-dial-rotor]')
  const pause=()=>host.toggleAttribute('data-paused',document.hidden)
  document.addEventListener('visibilitychange',pause)
  pause()
  return {
    rotate:angle=>rotor.setAttribute('transform',`rotate(${angle} 500 500)`),
    setOrbitRadius:(radius,halfDepth=0,step=38)=>{
      host.querySelector('[data-avatar-orbit]').setAttribute('r',radius+halfDepth)
      host.querySelector('[data-avatar-orbit-inner]').setAttribute('r',radius-halfDepth)
      host.querySelector('[data-avatar-orbit-engraving]').setAttribute('r',radius-halfDepth-5)
      host.querySelector('[data-inner-comet]').innerHTML=comet(Math.max(130,radius-halfDepth-11),true)
      host.querySelector('[data-dial-stations]').innerHTML=[-step,0,step].map(angle=>`<g opacity="${angle===0?.75:.4}">
        <path d="M${point(464,angle)}L${point(477,angle)}" stroke-width=".8"/>${diamond(483,angle,3.5)}
      </g>`).join('')
    },
    destroy:()=>document.removeEventListener('visibilitychange',pause)
  }
}
