export const designsRoundTwo=[
  {id:'a7',name:'星芒引线',description:'星芒作为起笔，名字与称号沿同一条轴线展开。'},
  {id:'a8',name:'薄金题签',description:'宽字距名字，搭配轻薄的半透明金色称号签。'},
  {id:'a9',name:'重影字标',description:'淡金轮廓字退后，象牙白实字在前，形成纵深。'},
  {id:'a10',name:'轻重对读',description:'同一行名字分出轻重节奏，下方用短刻度收尾。'},
  {id:'a11',name:'星章题头',description:'个人徽记化作小型星章，名字与称号组成完整题头。'},
  {id:'a12',name:'断角铭刻',description:'两枚不闭合的金色断角，托住利落的横排名字。'}
]

export const roundTwoCSS=`
.identity-signature[data-variant^="a"]{position:relative;container-type:inline-size;aspect-ratio:auto;width:100%;max-width:340px;text-align:left;font-family:'Microsoft YaHei','Noto Sans SC',sans-serif;color:#e9e2d1;isolation:isolate}
.identity-signature .r2-name{position:relative;z-index:1;margin:0;padding:0;font-family:inherit;font-size:clamp(25px,15cqw,54px);font-weight:600;line-height:1.25;letter-spacing:.025em;white-space:nowrap;font-style:normal;text-shadow:0 3px 16px #07101c80}
.identity-signature .r2-title{position:relative;z-index:1;display:flex;align-items:center;width:max-content;max-width:100%;margin:16px 0 0;padding:0;font-family:inherit;font-size:clamp(11px,4cqw,14px);font-weight:400;line-height:1.8;letter-spacing:.16em;color:#c4b18a;white-space:normal}
.identity-signature .r2-ornament{position:absolute;overflow:visible;color:#bea574;pointer-events:none}
.identity-signature[data-variant=a7]{padding:9px 0 6px 23px}
.identity-signature[data-variant=a7] .r2-name{font-size:clamp(24px,14.5cqw,52px);font-weight:500;letter-spacing:.05em}
.identity-signature[data-variant=a7] .r2-ornament{left:-8px;top:5px;width:22px;height:108px}
.identity-signature[data-variant=a7] .r2-title{margin-top:19px;gap:12px;font-size:clamp(11px,4.2cqw,15px);letter-spacing:.1em}
.identity-signature[data-variant=a7] .r2-title:after{content:'';width:35px;height:1px;flex:none;background:linear-gradient(90deg,#bda47480,transparent)}
.identity-signature[data-variant=a8]{padding:5px 0 0}
.identity-signature[data-variant=a8] .r2-name{font-size:clamp(25px,14.6cqw,53px);letter-spacing:.08em;font-weight:500}
.identity-signature[data-variant=a8] .r2-title{padding:4px 19px 4px 16px;margin:15px 0 0 -6px;background:linear-gradient(100deg,#b2986045,#b2986008);border-left:2px solid #ceb583;border-top:1px solid #b69b6855;clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%);letter-spacing:.14em;color:#e0d0aa}
.identity-signature[data-variant=a9]{padding-top:33px}
.identity-signature[data-variant=a9] .r2-name{font-size:clamp(26px,15.7cqw,55px);font-weight:700;letter-spacing:-.015em}
.identity-signature .r2-outline{position:absolute;left:8px;top:0;font-size:clamp(29px,17cqw,59px);line-height:1.25;font-weight:700;letter-spacing:-.015em;color:transparent;-webkit-text-stroke:1px #bc9d6645;white-space:nowrap;mask-image:linear-gradient(#0009,transparent 90%);pointer-events:none}
.identity-signature[data-variant=a9] .r2-title{margin-top:13px;letter-spacing:.25em;gap:10px}
.identity-signature[data-variant=a9] .r2-title:before{content:'';height:2px;width:25px;background:#b59a66}
.identity-signature[data-variant=a10] .r2-name{font-size:clamp(25px,15cqw,54px);font-weight:400;letter-spacing:.03em}
.identity-signature .r2-heavy{font-weight:700;color:#ece5d4;margin-right:.04em}
.identity-signature .r2-light{font-weight:400;color:#cbb78f}
.identity-signature[data-variant=a10] .r2-title{padding-top:17px;margin-top:18px;width:88%;border-top:1px solid #baa06d4d;justify-content:space-between;gap:12px;letter-spacing:.1em}
.identity-signature[data-variant=a10] .r2-title:before{content:'';position:absolute;left:0;top:-1px;width:32px;height:2px;background:#c5ab77}
.identity-signature[data-variant=a10] .r2-title:after{content:'';width:19px;height:8px;flex:none;border-left:1px solid #bda574;border-right:1px solid #bda574;transform:skew(-30deg);opacity:.55}
.identity-signature[data-variant=a11]{padding-top:52px}
.identity-signature[data-variant=a11] .r2-name{font-size:clamp(25px,14.6cqw,52px);font-weight:600;letter-spacing:.06em}
.identity-signature .r2-crest{position:absolute;top:0;left:0;width:116px;height:40px;display:flex;align-items:center;gap:13px}
.identity-signature .r2-crest img{width:38px;height:38px;object-fit:contain;filter:brightness(0) saturate(100%) invert(71%) sepia(17%) saturate(762%) hue-rotate(1deg) brightness(89%) contrast(86%)}
.identity-signature .r2-crest svg{width:64px;height:18px;color:#b9a072;overflow:visible}
.identity-signature[data-variant=a11] .r2-title{margin-top:13px;letter-spacing:.16em;gap:10px}
.identity-signature[data-variant=a11] .r2-title:after{content:'·';font:20px Georgia,serif;color:#b69d6b}
.identity-signature[data-variant=a12]{padding:20px 16px 18px}
.identity-signature[data-variant=a12]:before{content:'';position:absolute;left:0;top:0;width:28px;height:20px;border-left:1px solid #b69d6b;border-top:1px solid #b69d6b}
.identity-signature[data-variant=a12]:after{content:'';position:absolute;right:12px;bottom:0;width:48px;height:15px;border-right:1px solid #b69d6b80;border-bottom:1px solid #b69d6b80}
.identity-signature[data-variant=a12] .r2-name{font-size:clamp(24px,14.8cqw,52px);font-weight:600;letter-spacing:.04em}
.identity-signature[data-variant=a12] .r2-title{margin-top:14px;gap:10px;letter-spacing:.08em}
.identity-signature[data-variant=a12] .r2-title:before{content:'';width:4px;height:4px;flex:none;border:1px solid #c9af7a;transform:rotate(45deg)}
`

export function renderRoundTwo(host,id,person,live){
  host.dataset.variant=id
  host.replaceChildren()
  if(live){const number=document.createElement('span');number.id='identity-number';number.hidden=true;host.append(number)}
  const name=document.createElement(live?'h1':'h3');name.className='r2-name';name.textContent=person.name;if(live)name.id='name'
  const title=document.createElement('p');title.className='r2-title';title.textContent=person.title;if(live)title.id='profession'
  if(id==='a7'){
    const art=document.createElement('div')
    art.innerHTML='<svg class="r2-ornament" viewBox="0 0 22 108" fill="none" aria-hidden="true"><path d="M11 0V16M11 44V98" stroke="currentColor" opacity=".4"/><path d="M11 17L13.5 27.5L22 30L13.5 32.5L11 43L8.5 32.5L0 30L8.5 27.5Z" fill="currentColor"/><circle cx="11" cy="104" r="2" stroke="currentColor" opacity=".7"/></svg>'
    host.append(...art.childNodes)
  }
  if(id==='a9'){const shadow=document.createElement('span');shadow.className='r2-outline';shadow.setAttribute('aria-hidden','true');shadow.textContent=person.name;host.append(shadow)}
  if(id==='a10'){
    const split=person.name.length===3?1:2
    const heavy=document.createElement('span'),light=document.createElement('span')
    heavy.className='r2-heavy';heavy.textContent=person.name.slice(0,split)
    light.className='r2-light';light.textContent=person.name.slice(split)
    name.replaceChildren(heavy,light)
  }
  if(id==='a11'){
    const crest=document.createElement('div');crest.className='r2-crest';crest.setAttribute('aria-hidden','true')
    const emblem=document.createElement('img');emblem.alt='';emblem.src=person.emblem
    crest.innerHTML='<svg viewBox="0 0 64 18" fill="none"><path d="M0 9H25M35 9H64" stroke="currentColor" opacity=".5"/><path d="M30 4L35 9L30 14L25 9Z" stroke="currentColor" stroke-width=".8"/><path d="M30 0V18" stroke="currentColor" opacity=".4"/></svg>'
    crest.prepend(emblem);host.append(crest)
  }
  host.append(name,title)
}
