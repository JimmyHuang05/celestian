import './identity-designs.css'
import {aDesigns,aVariantCSS,renderASignature} from './identity-a-variants.js'
import {designsRoundTwo,roundTwoCSS,renderRoundTwo} from './identity-a-round-two.js'
const isADerived=location.pathname.endsWith('/identity-a-designs.html')
const roundTwo=isADerived&&new URLSearchParams(location.search).get('round')!=='1'

const designs=isADerived?(roundTwo?designsRoundTwo:aDesigns):[
  {id:'a',name:'留白字标',description:'利落黑体与细小称号，靠字距和留白建立层次。'},
  {id:'b',name:'纹章铭牌',description:'个人徽章嵌入双线拱框，像一块古老的铭牌。'},
  {id:'c',name:'纵向题签',description:'名字纵向排布，称号伴在一侧，延续背景竖条。'},
  {id:'d',name:'双行印记',description:'名字拆为上下两行，暗金小印与称号并置。'},
  {id:'e',name:'切角档案',description:'称号在上、名字在下，半透明切角底板收拢信息。'},
  {id:'f',name:'星轨环题',description:'名字横穿一枚淡金星环，称号悬于下方。'}
]
const variantCSS=isADerived?(roundTwo?roundTwoCSS:aVariantCSS):`
.identity-signature{container-type:inline-size;position:relative;aspect-ratio:auto;font-family:'Microsoft YaHei',sans-serif;color:#e8e0cf}
.identity-signature .variant-name{margin:0!important;font-size:clamp(24px,15cqw,54px)!important;line-height:1.25!important;letter-spacing:.07em!important;font-weight:500!important;color:#e8e0cf!important;white-space:nowrap!important;transform:none!important;font-style:normal!important;text-shadow:0 2px 12px #08101b88!important}
.identity-signature .variant-title{margin:0;color:#bca57c;font-size:clamp(11px,4.5cqw,16px);line-height:1.8;letter-spacing:.15em;font-weight:400;overflow-wrap:anywhere}
.identity-signature .variant-art{position:absolute;pointer-events:none;width:100%;height:100%;inset:0;color:#b79a64;overflow:visible}
.identity-signature[data-variant=a]{padding-top:2px}
.identity-signature[data-variant=a] .variant-name{font-family:'Microsoft YaHei',sans-serif!important;font-weight:600!important;font-size:clamp(24px,14.8cqw,52px)!important;letter-spacing:.015em!important}
.identity-signature[data-variant=a] .variant-title{display:flex;align-items:center;gap:12px;margin-top:18px;letter-spacing:.22em;font-size:clamp(11px,4cqw,14px)}
.identity-signature[data-variant=a] .variant-title:before{content:'';width:15px;height:2px;flex:none;background:#b69d6b}
.identity-signature[data-variant=b]{text-align:center;padding:44px 16px 28px}
.identity-signature[data-variant=b] .variant-name{font-family:'Archive Serif',SimSun,serif!important;font-size:clamp(24px,12.8cqw,46px)!important;letter-spacing:.06em!important}
.identity-signature[data-variant=b] .variant-title{margin-top:12px;font-family:'Archive Serif',SimSun,serif;font-size:clamp(11px,4cqw,14px);letter-spacing:.1em}
.identity-signature .variant-emblem{position:absolute;width:24cqw;height:24cqw;object-fit:contain;left:38%;top:-10cqw;filter:brightness(0) saturate(100%) invert(71%) sepia(17%) saturate(762%) hue-rotate(1deg) brightness(89%) contrast(86%)}
.identity-signature[data-variant=c]{display:flex;align-items:flex-start;gap:20px;padding-left:7%;min-height:255px}
.identity-signature[data-variant=c] .variant-name{writing-mode:vertical-rl;font-family:'Archive Serif',SimSun,serif!important;font-size:clamp(26px,13.5cqw,48px)!important;letter-spacing:.14em!important;line-height:1.45!important}
.identity-signature[data-variant=c] .variant-title{writing-mode:vertical-rl;border-left:1px solid #bfa57066;padding-left:13px;margin-top:7px;letter-spacing:.27em;font-size:clamp(11px,4.3cqw,15px)}
.identity-signature[data-variant=d]{padding-left:20px;border-left:2px solid #a58b5b80}
.identity-signature[data-variant=d] .variant-name{white-space:normal!important;overflow-wrap:anywhere;max-width:2.4em;font-family:'Archive Serif',SimSun,serif!important;font-size:clamp(26px,16cqw,58px)!important;letter-spacing:.14em!important;line-height:1.3!important}
.identity-signature[data-variant=d] .variant-title{margin-top:18px;display:flex;align-items:center;gap:12px;font-size:clamp(11px,4.1cqw,14px);letter-spacing:.08em}
.identity-signature[data-variant=d] .variant-title:before{content:'✧';display:grid;place-items:center;border:1px solid #b39a6466;width:25px;height:28px;flex:none;color:#d2bc8e}
.identity-signature[data-variant=e]{padding:24px 18px 26px;background:linear-gradient(115deg,#28384cce,#19243522);clip-path:polygon(0 0,92% 0,100% 12%,100% 100%,0 100%);border-left:2px solid #b49b6b}
.identity-signature[data-variant=e] .variant-name{font-family:'Microsoft YaHei',sans-serif!important;font-size:clamp(24px,12.6cqw,45px)!important;font-weight:500!important;letter-spacing:.02em!important}
.identity-signature[data-variant=e] .variant-title{margin-bottom:16px;font-size:clamp(11px,4cqw,14px);letter-spacing:.14em}
.identity-signature[data-variant=e]:after{content:'';display:block;width:26px;height:2px;background:#bca272;margin-top:22px}
.identity-signature[data-variant=f]{padding:64px 0 38px;text-align:center}
.identity-signature[data-variant=f] .variant-name{font-family:'Microsoft YaHei',sans-serif!important;font-weight:400!important;font-size:clamp(24px,14cqw,50px)!important;letter-spacing:.1em!important}
.identity-signature[data-variant=f] .variant-title{margin-top:17px;font-size:clamp(11px,4.2cqw,15px);letter-spacing:.18em}
`
const style=document.createElement('style');style.textContent=variantCSS;document.head.append(style)
if(isADerived){
  document.title=roundTwo?'A 字标 · 第二轮设计':'A 字标 · 第一轮设计'
  document.querySelector('.demo-header h1').textContent=roundTwo?'A 字标 · 第二轮设计':'A 字标 · 第一轮设计'
  document.querySelector('.intro').textContent=roundTwo?'六种完整字标组合。切换角色比较，点击方案查看当前立绘比例下的完整效果。':'横排黑体，比较称号层级、字重与装饰。'
  const rounds=document.createElement('nav');rounds.className='design-rounds';rounds.setAttribute('aria-label','设计轮次')
  rounds.innerHTML='<a href="/identity-a-designs.html?round=1">第一轮 A1–A6</a><a href="/identity-a-designs.html">第二轮 A7–A12</a>'
  rounds.children[roundTwo?1:0].setAttribute('aria-current','page')
  document.querySelector('.intro').after(rounds)
}
const response=await fetch('/character-profile/characters.json')
if(!response.ok)throw new Error('角色档案暂时不可用')
const people=await response.json()
let current=2,chosen=designs[0].id
const picker=document.querySelector('#character-select')
people.forEach((person,i)=>picker.add(new Option(person.name,String(i),i===current,i===current)))
function signature(host,id,person,live=false){
  if(isADerived){(roundTwo?renderRoundTwo:renderASignature)(host,id,person,live);return}
  host.dataset.variant=id
  host.replaceChildren()
  if(live){const number=document.createElement('span');number.id='identity-number';number.hidden=true;host.append(number)}
  if(id==='b'||id==='f'){
    const decoration=document.createElement('div')
    decoration.innerHTML=id==='b'?`<svg class="variant-art" viewBox="0 0 320 180" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M8 180V32L37 8H117M203 8H283L312 32V180M8 175H312" stroke="currentColor" opacity=".65"/><path d="M15 166V36L40 15H115M205 15H280L305 36V166Z" stroke="currentColor" opacity=".25"/><path d="M152 175L160 170L168 175L160 180Z" fill="currentColor" opacity=".8"/></svg>`:`<svg class="variant-art" viewBox="0 0 320 230" fill="none" aria-hidden="true"><circle cx="160" cy="104" r="90" stroke="currentColor" opacity=".2"/><circle cx="160" cy="104" r="79" stroke="currentColor" stroke-dasharray="1 9" opacity=".45"/><path d="M90 35A98 98 0 0 1 230 173M64 122A98 98 0 0 1 126 11" stroke="currentColor" opacity=".5"/><path d="M160 3L163 12L172 15L163 18L160 27L157 18L148 15L157 12Z" fill="currentColor" opacity=".8"/><circle cx="74" cy="149" r="2" fill="currentColor"/><circle cx="247" cy="63" r="2" fill="currentColor"/></svg>`
    if(id==='b')decoration.querySelectorAll('path')[1].setAttribute('d','M115 15H40L15 36V166H305V36L280 15H205')
    host.append(...decoration.childNodes)
  }
  if(id==='b'){const emblem=document.createElement('img');emblem.className='variant-emblem';emblem.src=person.emblem;emblem.alt='';host.append(emblem)}
  const name=document.createElement(live?'h1':'h3');name.className='variant-name';name.textContent=person.name;if(live)name.id='name'
  const title=document.createElement('p');title.className='variant-title';title.textContent=person.title;if(live)title.id='profession'
  host.append(...(id==='e'?[title,name]:[name,title]))
}
const grid=document.querySelector('#design-grid')
for(const design of designs){
  const card=document.createElement('article');card.className='design-card'
  card.innerHTML=`<div class="design-stage"><img class="demo-portrait" alt=""><div class="identity-signature"></div></div><div class="design-info"><h2><b>${design.id.toUpperCase()}</b>${design.name}</h2><p>${design.description}</p><button class="preview-button">放入角色页 ↗</button></div>`
  card.querySelector('button').onclick=()=>openPreview(design.id)
  card.dataset.design=design.id;grid.append(card)
}
function render(){for(const card of grid.children){const person=people[current];card.querySelector('img').src=person.image;signature(card.querySelector('.identity-signature'),card.dataset.design,person)}}
picker.onchange=()=>{current=Number(picker.value);render()}
render()
const dialog=document.querySelector('#full-preview'),frame=document.querySelector('#preview-frame')
const tabs=document.querySelector('#preview-options')
designs.forEach(d=>{const button=document.createElement('button');button.textContent=d.id.toUpperCase();button.title=d.name;button.onclick=()=>{chosen=d.id;applyPreview()};button.dataset.design=d.id;tabs.append(button)})
let observer
function applyPreview(){
  const doc=frame.contentDocument,host=doc?.querySelector('.identity-signature')
  if(!host||!doc.querySelector('#portrait')?.getAttribute('src'))return
  const person=people.find(p=>doc.querySelector('#portrait').getAttribute('src')===p.image)??people[current]
  signature(host,chosen,person,true)
  const design=designs.find(d=>d.id===chosen)
  document.querySelector('#preview-title').textContent=`${chosen.toUpperCase()} · ${design.name}`
  for(const button of tabs.children)button.setAttribute('aria-pressed',String(button.dataset.design===chosen))
}
frame.onload=()=>{
  if(!frame.contentDocument?.querySelector('.profile'))return
  const doc=frame.contentDocument,sheet=doc.createElement('style');sheet.textContent=variantCSS+'\n.identity-crown,.identity-rule{display:none}.identity-signature{max-width:340px}.profile-sound-controls{display:none}'
  doc.head.append(sheet)
  let initialized=false
  observer?.disconnect()
  observer=new MutationObserver(()=>{
    if(!initialized&&doc.querySelectorAll('.operator').length===people.length){initialized=true;doc.querySelectorAll('.operator')[current].click()}
    applyPreview()
  })
  observer.observe(doc.querySelector('#portrait'),{attributes:true,attributeFilter:['src']})
  if(doc.querySelectorAll('.operator').length===people.length){initialized=true;doc.querySelectorAll('.operator')[current].click()}
  applyPreview()
}
function openPreview(id){chosen=id;dialog.showModal();frame.src='/character-profile.html?identity-preview=1'}
document.querySelector('#close-preview').onclick=()=>dialog.close()
dialog.addEventListener('close',()=>{observer?.disconnect();frame.src='about:blank'})
