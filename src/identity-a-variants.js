export const aDesigns=[
  {id:'a1',name:'紧凑字标',description:'加重名字、收紧行距，短金线点到即止。'},
  {id:'a2',name:'称号前置',description:'细小称号先行，名字落在下方，像人物海报的题头。'},
  {id:'a3',name:'侧线锚定',description:'一根短金线贯穿两层文字，强调左侧秩序。'},
  {id:'a4',name:'横线落款',description:'名字舒展，细线延伸，称号靠右形成错落。'},
  {id:'a5',name:'徽记伴名',description:'名字右侧配专属徽记，保留简洁的称号。'},
  {id:'a6',name:'双色轻字',description:'首字暗金，其余象牙白，以轻字重和星点收尾。'}
]

export const aVariantCSS=`
.identity-signature[data-variant^="a"]{container-type:inline-size;position:relative;aspect-ratio:auto;text-align:left;max-width:340px;color:#e8e0cf;font-family:'Microsoft YaHei','Noto Sans SC',sans-serif}
.identity-signature .a-name{margin:0;font-family:'Microsoft YaHei','Noto Sans SC',sans-serif;font-size:clamp(24px,14.8cqw,52px);line-height:1.25;font-weight:600;letter-spacing:.015em;white-space:nowrap;font-style:normal;text-shadow:0 2px 12px #08101b88}
.identity-signature .a-title{display:flex;align-items:center;gap:12px;margin:18px 0 0;padding:0;font-family:'Microsoft YaHei','Noto Sans SC',sans-serif;font-size:clamp(11px,4cqw,14px);line-height:1.8;font-weight:400;letter-spacing:.18em;color:#bca57c;white-space:normal}
.identity-signature[data-variant=a1] .a-name{font-weight:700;letter-spacing:-.035em;font-size:clamp(25px,15.4cqw,54px)}
.identity-signature[data-variant=a1] .a-title{margin-top:12px;letter-spacing:.08em}
.identity-signature[data-variant=a1] .a-title:before{content:'';width:16px;height:2px;background:#b69d6b;flex:none}
.identity-signature[data-variant=a2] .a-title{margin:0 0 14px;letter-spacing:.25em;font-size:clamp(10px,3.7cqw,13px)}
.identity-signature[data-variant=a2] .a-title:after{content:'';width:36px;height:1px;flex:none;background:linear-gradient(90deg,#b69d6b90,transparent)}
.identity-signature[data-variant=a2] .a-name{font-weight:500;letter-spacing:.045em}
.identity-signature[data-variant=a3]{padding-left:18px;border-left:2px solid #ad936560}
.identity-signature[data-variant=a3]:before{content:'';position:absolute;left:-2px;top:0;width:2px;height:24px;background:#ccb384}
.identity-signature[data-variant=a3] .a-title{margin-top:15px;letter-spacing:.13em}
.identity-signature[data-variant=a3] .a-name{font-weight:500;letter-spacing:.045em}
.identity-signature[data-variant=a4] .a-name{font-weight:500;letter-spacing:.07em}
.identity-signature[data-variant=a4] .a-title{position:relative;justify-content:flex-end;max-width:90%;margin-top:19px;padding-top:13px;letter-spacing:.15em;font-size:clamp(10px,3.8cqw,13px)}
.identity-signature[data-variant=a4] .a-title:before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,#c6ad7b,#c6ad7b30)}
.identity-signature[data-variant=a4] .a-title:after{content:'';position:absolute;right:0;top:-1px;width:3px;height:3px;background:#bca57c;transform:rotate(45deg)}
.identity-signature .a-name-and-emblem{display:flex;align-items:center;gap:12px}
.identity-signature[data-variant=a5] .a-name{font-weight:600;font-size:clamp(23px,13.8cqw,49px)}
.identity-signature .a-emblem{width:12cqw;height:14cqw;max-width:42px;max-height:49px;object-fit:contain;flex:none;filter:brightness(0) saturate(100%) invert(71%) sepia(17%) saturate(762%) hue-rotate(1deg) brightness(89%) contrast(86%);opacity:.8}
.identity-signature[data-variant=a5] .a-title{margin-top:16px;letter-spacing:.18em}
.identity-signature[data-variant=a6] .a-name{font-weight:400;letter-spacing:.1em;font-size:clamp(24px,14.4cqw,51px)}
.identity-signature[data-variant=a6] .a-name:first-letter{color:#c1a877}
.identity-signature[data-variant=a6] .a-title{gap:10px;letter-spacing:.17em}
.identity-signature[data-variant=a6] .a-title:after{content:'✦';font-size:9px;color:#b89d6b;opacity:.8}
`

export function renderASignature(host,id,person,live){
  host.dataset.variant=id
  host.replaceChildren()
  if(live){const number=document.createElement('span');number.id='identity-number';number.hidden=true;host.append(number)}
  const name=document.createElement(live?'h1':'h3');name.className='a-name';name.textContent=person.name;if(live)name.id='name'
  const title=document.createElement('p');title.className='a-title';title.textContent=person.title;if(live)title.id='profession'
  if(id==='a5'){
    const row=document.createElement('div');row.className='a-name-and-emblem'
    const emblem=document.createElement('img');emblem.className='a-emblem';emblem.alt='';emblem.src=person.emblem
    row.append(name,emblem);host.append(row,title)
  }else host.append(...(id==='a2'?[title,name]:[name,title]))
}
