import { mountRosterAstrolabe } from './profile-astrolabe.js'

const cards = [
  { title: '百科全书', image: '/images/cards/encyclopedia-dark-tower.webp' },
  { title: '海陆图志', image: '/images/cards/map-deep-sea.webp' },
  { title: '有求必应', image: '/images/cards/functions-gifted-star.webp' },
]
import { designs } from './eden-crown-ornaments.js'

const roman = ['I', 'II', 'III', 'IV', 'V']
const clip = 'M51 20H309Q344 20 344 55V584Q344 622 307 622H53Q16 622 16 584V55Q16 20 51 20Z'

function renderCard(card,index,design,designIndex){
  const p=`crown-${designIndex}-${index}`,gold=`url(#${p}-gold)`
  return `<button type="button" class="frame-card" aria-label="${design.name} · ${card.title}，点击固定高亮" aria-pressed="false"><svg viewBox="0 0 360 640" aria-hidden="true"><defs>
    <linearGradient id="${p}-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8c6b3a"/><stop offset=".23" stop-color="#e5cc92"/><stop offset=".45" stop-color="#ad8c4d"/><stop offset=".68" stop-color="#75603b"/><stop offset=".86" stop-color="#dfc68e"/><stop offset="1" stop-color="#a98448"/></linearGradient>
    <radialGradient id="${p}-shade"><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
    <clipPath id="${p}-clip"><path d="${clip}"/></clipPath></defs>
    <g clip-path="url(#${p}-clip)"><rect width="360" height="640" fill="#101314"/><image class="card-image" href="${card.image}" width="360" height="640" preserveAspectRatio="xMidYMid slice"/><rect class="card-shade" width="360" height="640" fill="#070707"/><rect class="card-vignette" width="360" height="640" fill="url(#${p}-shade)"/></g><g class="frame-metal" color="#dec28a">${design.draw(gold)}</g></svg>
    <span class="card-title">${card.title}</span><span class="card-label">${card.title}</span></button>`
}

const stage=document.getElementById('stage')
const picker=document.getElementById('design-picker')
const url=new URL(location.href)
const initial=Number(url.searchParams.get('design'))
let selected=Number.isInteger(initial)&&initial>=1&&initial<=5?initial-1:0
let compare=url.searchParams.get('view')!=='scene'
picker.innerHTML=designs.map((d,i)=>`<button class="design-tab" type="button" data-design="${i}" aria-controls="stage" aria-pressed="false"><span>0${i+1}</span><div><strong>${d.name}</strong><small>${d.english}</small></div></button>`).join('')
function render(){
  const design=designs[selected]
  stage.classList.toggle('comparison',compare)
  stage.innerHTML=compare?designs.map((d,i)=>`<figure class="study-item">${renderCard(cards[0],i,d,i)}<figcaption><span>${roman[i]} / 0${i+1}</span><strong>${d.name}</strong><small>${d.note}</small></figcaption></figure>`).join(''):cards.map((c,i)=>renderCard(c,i,design,selected)).join('')
  document.getElementById('design-number').textContent=compare?'I–V':`0${selected+1}`
  document.getElementById('design-title').textContent=compare?'同一冠冕，五种纹饰':design.name
  document.getElementById('design-description').textContent=compare?'相同黑日与外轮廓，比较护角、侧饰和底部星徽。选择下方款式查看三卡实景。':design.description
  stage.setAttribute('aria-label',compare?'五版黑日冠冕对比':`${design.name}三张卡实景`)
  document.getElementById('compare-view').setAttribute('aria-pressed',String(compare))
  document.getElementById('scene-view').setAttribute('aria-pressed',String(!compare))
  picker.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(!compare&&selected===i)))
  const next=new URL(location.href);next.searchParams.set('design',String(selected+1));next.searchParams.set('view',compare?'compare':'scene');history.replaceState(null,'',next)
}
picker.addEventListener('click',event=>{const button=event.target.closest('[data-design]');if(button){selected=Number(button.dataset.design);compare=false;render()}})
document.getElementById('compare-view').addEventListener('click',()=>{compare=true;render()})
document.getElementById('scene-view').addEventListener('click',()=>{compare=false;render()})
stage.addEventListener('click',event=>{const card=event.target.closest('.frame-card');if(card)card.setAttribute('aria-pressed',String(card.getAttribute('aria-pressed')!=='true'))})
document.getElementById('highlight').addEventListener('change',event=>stage.classList.toggle('all-highlight',event.target.checked))
document.getElementById('outline-only').addEventListener('change',event=>stage.classList.toggle('outline-only',event.target.checked))
render()
const astrolabe=mountRosterAstrolabe(document.getElementById('dial'))
window.addEventListener('pagehide',()=>astrolabe.destroy(),{once:true})
