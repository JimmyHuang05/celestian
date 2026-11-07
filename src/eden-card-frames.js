import { mountRosterAstrolabe } from './profile-astrolabe.js'

const cards = [
  { title: '百科全书', image: '/images/cards/encyclopedia-dark-tower.webp' },
  { title: '海陆图志', image: '/images/cards/map-deep-sea.webp' },
  { title: '有求必应', image: '/images/cards/functions-gifted-star.webp' },
]
const designs = [
  { name: '星仪刻度', english: 'ASTRAL INSTRUMENT', description: '切角铜框、细密刻度与四隅星轴。像一件校准过的古代天文仪器。', clip: 'M28 8H332L352 28V612L332 632H28L8 612V28Z', draw: instrument },
  { name: '哥特圣龛', english: 'GOTHIC RELIQUARY', description: '尖拱、束柱与三叶窗饰，让每张插画成为圣堂中的一扇窗。', clip: 'M180 14C248 47 333 101 338 173V612H22V173C27 101 112 47 180 14Z', draw: gothic },
  { name: '圣典封装', english: 'ILLUMINATED CODEX', description: '米白书页、烫金压线与金属护角。增加暖色面积，像珍藏的圣典封面。', clip: 'M30 27H330V613H30Z', draw: codex },
  { name: '碎金遗迹', english: 'GILDED FRAGMENTS', description: '不对称的金属残片与断开的细线。让边框也带着文明遗迹的痕迹。', clip: 'M31 12H334L350 34V598L321 629H18L9 603V43Z', draw: fragments },
  { name: '黑日冠冕', english: 'CROWN OF THE ECLIPSE', description: '黑日居于冠顶，双层细金边勾勒轮廓；底部以星芒收束，呼应开屏的黑日与星空。', clip: 'M35 19H325Q345 19 345 40V600Q345 623 324 623H36Q15 623 15 600V40Q15 19 35 19Z', draw: crown },
]

function star(x,y,r=9){return `<path d="M${x} ${y-r}L${x+2} ${y-2}L${x+r} ${y}L${x+2} ${y+2}L${x} ${y+r}L${x-2} ${y+2}L${x-r} ${y}L${x-2} ${y-2}Z" fill="currentColor" stroke-width=".5"/>`}
function fourCorners(markup){return ['','translate(360 0) scale(-1 1)','translate(0 640) scale(1 -1)','translate(360 640) scale(-1 -1)'].map(t=>`<g transform="${t}">${markup}</g>`).join('')}
function sides(markup){return `<g>${markup}</g><g transform="translate(360 0) scale(-1 1)">${markup}</g>`}

function instrument(g){
  const corner=`<path d="M7 74V28L28 7H74M15 65V32L32 15H65" stroke-width="1.7"/><circle cx="30" cy="30" r="11" fill="#111615"/><circle cx="30" cy="30" r="7" stroke-width=".5"/><path d="M30 14V46M14 30H46" stroke-width=".6"/>${star(30,30,7)}<path d="M48 11H59M11 48V59" stroke-width="3"/>`
  let ticks='';for(let i=0;i<39;i++){const y=85+i*12;const len=i%5===0?7:3;ticks+=`M12 ${y}H${12+len}M348 ${y}H${348-len}`}
  return `<g stroke="${g}" fill="none"><path d="M28 5H332L355 28V612L332 635H28L5 612V28Z" stroke-width="1.8"/><path d="M40 23H320L337 40V600L320 617H40L23 600V40Z" stroke-width=".65" opacity=".7"/><path d="${ticks}" stroke-width=".6" opacity=".65"/>${fourCorners(corner)}<path d="M83 11H151M209 11H277M83 629H151M209 629H277"/><g class="frame-light">${star(180,12,9)}${star(180,628,9)}</g><path d="M161 12H169M191 12H199M161 628H169M191 628H199" stroke-width=".6"/></g>`
}

function gothic(g){
  const outer='M180 4C263 45 349 106 350 181V623H10V181C11 106 97 45 180 4Z'
  const inner='M180 30C248 64 322 112 326 183V603H34V183C38 112 112 64 180 30Z'
  const column=`<path d="M12 210V599H26V210M19 215V592" stroke-width="1.2"/><path d="M6 603H32V616H6ZM7 196H31V207H7Z" fill="#211e18"/><path d="M5 188L19 169L33 188M10 183L19 147L28 183"/><path d="M19 128V155" stroke-width="1.5"/><path d="M5 616H33M8 621H30" stroke-width="2"/>`
  return `<g stroke="${g}" fill="none"><path d="${outer}" stroke-width="4"/><path d="${inner}" stroke-width="1.4"/><path d="M180 16C255 54 335 111 338 182V612H22V182C25 111 105 54 180 16Z" stroke-width=".7"/>${sides(column)}<path d="M73 100Q95 59 125 58Q145 46 180 17Q215 46 235 58Q265 59 287 100" stroke-width="1"/><path d="M135 50Q137 84 160 89Q180 61 180 24Q180 61 200 89Q223 84 225 50" stroke-width=".9"/><circle cx="180" cy="75" r="20" fill="#111410"/><path d="M180 58C165 47 158 67 168 74C151 80 166 96 178 85C190 100 207 83 191 75C203 62 188 47 180 58Z" stroke-width="1"/>${star(180,75,7)}<path d="M80 620H147L159 630H201L213 620H280" stroke-width="1.5"/><path d="M162 619L180 607L198 619L180 633Z" fill="#111410"/>${star(180,620,8)}</g>`
}

function codex(g){
  const corner=`<path d="M7 75V9H72L59 22H23V59Z" fill="${g}" stroke="#4d3d29"/><path d="M12 62V14H61M19 49V21H48" stroke="#f2ddb2" stroke-width=".75"/><path d="M19 19L34 34M28 19L19 28" stroke="#644d2b" stroke-width=".8"/><circle cx="15" cy="15" r="2.5" fill="#312820" stroke="#e5c990"/>`
  return `<g fill="none"><path d="M18 7H342V633H18Z M31 28V612H329V28Z" fill="#cbbd9b" fill-rule="evenodd"/><path d="M22 13H338V627H22Z" stroke="#f4e3bd" stroke-width="1"/><path d="M27 22H333V618H27Z" stroke="#756447" stroke-width="1"/><path d="M31 29H329V611H31Z" stroke="${g}" stroke-width="2"/><path d="M37 35H323V605H37Z" stroke="#d4be8e" stroke-width=".65" opacity=".7"/><path d="M22 90V550M338 90V550" stroke="#81704d" stroke-width=".6" stroke-dasharray="2 6"/>${fourCorners(corner)}<g stroke="${g}"><path d="M139 7L148 -1H212L221 7L212 17H148Z" fill="#29251e"/><path d="M149 7H168M192 7H211" stroke-width=".7"/>${star(180,7,7)}<path d="M141 632L150 623H210L219 632L210 642H150Z" fill="#29251e"/><path d="M158 632H170M190 632H202"/>${star(180,632,6)}</g></g>`
}

function fragments(g){
  return `<g fill="none" stroke="${g}"><path d="M31 11H244M271 11H334L350 34V252M350 286V598L321 629H113M84 629H18L9 603V384M9 356V43Z" stroke-width="1.1"/><path d="M38 25H321L336 42V589L312 615H30L22 595V49Z" stroke-width=".6" opacity=".55"/><path d="M25 4L98 4L82 12L75 23L36 27L18 57L5 90L2 47Z" fill="${g}" stroke="#685132"/><path d="M24 13L16 41L31 31L35 17L63 12M29 24L24 41L15 55" stroke="#f2d6a1" stroke-width=".8"/><path d="M350 145L359 184L350 271L343 247L348 211L342 198Z" fill="${g}"/><path d="M328 636L256 636L275 622L305 614L329 587L355 559L355 603Z" fill="${g}" stroke="#685132"/><path d="M346 586L333 609L310 624L281 630M335 600L322 614" stroke="#f3d7a4" stroke-width=".8"/><path d="M4 435L14 459L10 514L3 539L0 483Z" fill="${g}"/><path d="M104 8L133 7M150 8L156 8M224 630L245 630" stroke-width="3"/><path d="M249 11L258 16L263 7L271 11M9 356L16 366L7 376L9 384M350 252L341 265L355 273L350 286M84 629L96 621L104 634L113 629" stroke-width=".6" opacity=".8"/><g class="frame-light">${star(34,71,5)}${star(326,565,5)}</g></g>`
}

function crown(g){
  let rays='';for(let i=0;i<32;i++){const a=i*Math.PI/16;const x=180+Math.cos(a)*23,y=18+Math.sin(a)*23;const r=i%2?30:37;rays+=`M${x.toFixed(2)} ${y.toFixed(2)}L${(180+Math.cos(a)*r).toFixed(2)} ${(18+Math.sin(a)*r).toFixed(2)}`}
  return `<g fill="none" stroke="${g}"><path d="M51 16H133M227 16H309Q348 16 348 55V582Q348 626 309 626H210M150 626H51Q12 626 12 582V55Q12 16 51 16" stroke-width="2"/><path d="M48 28H130M230 28H312Q336 28 336 52V588Q336 613 312 613H210M150 613H48Q24 613 24 588V52Q24 28 48 28" stroke-width=".65"/><path d="${rays}" stroke-width=".8"/><circle cx="180" cy="18" r="22" fill="#0b1012" stroke-width="1.5"/><circle cx="180" cy="18" r="17" stroke-width=".5" opacity=".5"/><path d="M166 18H194M180 4V32" stroke-width=".4" opacity=".4"/><path d="M122 620Q157 604 180 626Q203 604 238 620M146 631Q165 650 180 632Q195 650 214 631"/>${star(180,627,17)}</g>`
}

function renderCard(card,index,design){
  const p=`frame-${selected}-${index}`,gold=`url(#${p}-gold)`
  return `<button type="button" class="frame-card" aria-label="${card.title}，点击固定高亮" aria-pressed="false">
    <svg viewBox="0 0 360 640" aria-hidden="true"><defs>
      <linearGradient id="${p}-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6c512c"/><stop offset=".2" stop-color="#dec28a"/><stop offset=".42" stop-color="#a88951"/><stop offset=".66" stop-color="#6e542f"/><stop offset=".84" stop-color="#ddc18d"/><stop offset="1" stop-color="#9c7944"/></linearGradient>
      <radialGradient id="${p}-shade"><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
      <clipPath id="${p}-clip"><path d="${design.clip}"/></clipPath>
    </defs><g clip-path="url(#${p}-clip)"><rect width="360" height="640" fill="#101314"/><image class="card-image" href="${card.image}" width="360" height="640" preserveAspectRatio="xMidYMid slice"/><rect class="card-shade" width="360" height="640" fill="#070707"/><rect class="card-vignette" width="360" height="640" fill="url(#${p}-shade)"/></g><g class="frame-metal" color="#ccb27a">${design.draw(gold)}</g></svg>
    <span class="card-title">${card.title}</span><span class="card-label">${card.title}</span>
  </button>`
}

const stage=document.getElementById('stage')
const picker=document.getElementById('design-picker')
let selected=Math.max(0,Math.min(4,(Number(new URL(location.href).searchParams.get('design'))||1)-1))
picker.innerHTML=designs.map((d,i)=>`<button class="design-tab" type="button" data-design="${i}" aria-controls="stage" aria-pressed="false"><span>0${i+1}</span><div><strong>${d.name}</strong><small>${d.english}</small></div></button>`).join('')
function render(){
  const design=designs[selected]
  stage.innerHTML=cards.map((card,i)=>renderCard(card,i,design)).join('')
  document.getElementById('design-number').textContent=`0${selected+1}`
  document.getElementById('design-title').textContent=design.name
  document.getElementById('design-description').textContent=design.description
  stage.setAttribute('aria-label',`${design.name}边框预览`)
  picker.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(selected===i)))
  const url=new URL(location.href);url.searchParams.set('design',String(selected+1));history.replaceState(null,'',url)
}
picker.addEventListener('click',event=>{const button=event.target.closest('[data-design]');if(button){selected=Number(button.dataset.design);render()}})
stage.addEventListener('click',event=>{const card=event.target.closest('.frame-card');if(card)card.setAttribute('aria-pressed',String(card.getAttribute('aria-pressed')!=='true'))})
document.getElementById('highlight').addEventListener('change',event=>stage.classList.toggle('all-highlight',event.target.checked))
document.getElementById('outline-only').addEventListener('change',event=>stage.classList.toggle('outline-only',event.target.checked))
render()
const astrolabe=mountRosterAstrolabe(document.getElementById('dial'))
window.addEventListener('pagehide',()=>astrolabe.destroy(),{once:true})
