// All five studies share the same silhouette and eclipse. Only the ornament changes.
const ink = '#101416'
const ivory = '#e8d8b5'
const point = (x,y,r,a) => `${(x+Math.cos(a)*r).toFixed(2)} ${(y+Math.sin(a)*r).toFixed(2)}`
const corners = markup => ['', 'translate(360 0) scale(-1 1)', 'translate(0 640) scale(1 -1)', 'translate(360 640) scale(-1 -1)'].map(t=>`<g transform="${t}">${markup}</g>`).join('')
const sides = markup => `<g>${markup}</g><g transform="translate(360 0) scale(-1 1)">${markup}</g>`
const diamond = (x,y,w,h,fill=ink) => `<path d="M${x} ${y-h}L${x+w} ${y}L${x} ${y+h}L${x-w} ${y}Z" fill="${fill}"/>`
function star(x,y,r=12){return `<path d="M${x} ${y-r}L${x+3} ${y-3}L${x+r} ${y}L${x+3} ${y+3}L${x} ${y+r}L${x-3} ${y+3}L${x-r} ${y}L${x-3} ${y-3}Z" fill="currentColor" stroke-width=".6"/>`}
function base(g){
  let rays='';for(let i=0;i<32;i++){const a=i*Math.PI/16;rays+=`M${point(180,18,25,a)}L${point(180,18,i%2?32:40,a)}`}
  return `<g fill="none" stroke="${g}" stroke-linejoin="round"><path d="M51 16H133M227 16H309Q348 16 348 55V582Q348 626 309 626H210M150 626H51Q12 626 12 582V55Q12 16 51 16" stroke-width="2"/><path d="M48 28H130M230 28H312Q336 28 336 52V588Q336 613 312 613H210M150 613H48Q24 613 24 588V52Q24 28 48 28" stroke-width=".75"/><path d="${rays}" stroke-width=".8"/><circle cx="180" cy="18" r="22" fill="${ink}" stroke-width="1.5"/><circle cx="180" cy="18" r="17" stroke-width=".5" opacity=".5"/></g>`
}
function wrap(g,markup){return `${base(g)}<g fill="none" stroke="${g}" stroke-width="1" stroke-linejoin="round">${markup}</g>`}

function stellar(g){
  const side=`<path d="M18 155L28 180V273L34 289V351L28 367V460L18 485L8 460V367L2 351V289L8 273V180Z" fill="${ink}"/><path d="M18 170V264M18 376V470M12 190V260M24 190V260M12 380V450M24 380V450" stroke-width=".7"/>${diamond(18,291,8,19)}${diamond(18,349,8,19)}${diamond(18,320,14,22)}${star(18,320,12)}<path d="M18 277V305M18 335V363" stroke="${ivory}" stroke-width=".6"/>`
  return wrap(g,`${sides(side)}<path d="M111 624L139 613L159 619M249 624L221 613L201 619M111 628L143 637L159 629M249 628L217 637L201 629"/>${diamond(180,625,24,24)}${diamond(180,625,16,16,g)}${star(180,625,26)}<path d="M180 604V646" stroke="${ivory}" stroke-width=".7"/>`)
}

function chapel(g){
  const corner=`<path d="M8 105V52Q8 10 51 10H105L94 23H51Q23 23 23 51V94Z" fill="${g}"/><path d="M15 88V50Q15 17 50 17H88" stroke="${ivory}" stroke-width=".65"/><path d="M27 72V47Q27 28 47 27H72Q68 54 54 68Z" fill="${ink}" stroke-width="1.1"/><path d="M35 58Q23 44 37 36Q34 20 49 27Q65 19 64 34Q79 42 65 52Q64 68 50 60Q40 73 35 58Z" fill="${ink}"/><circle cx="49" cy="44" r="7" stroke="${ivory}" stroke-width="1.3"/><path d="M49 30V37M49 51V58M35 44H42M56 44H63" stroke-width=".75"/><path d="M79 18V30M87 18V26M18 79H30M18 87H26"/>`
  let lancets='';for(let i=0;i<4;i++){const y=174+i*78;lancets+=`<path d="M10 ${y+48}V${y+14}Q10 ${y+3} 18 ${y-7}Q26 ${y+3} 26 ${y+14}V${y+48}Z" fill="${ink}"/><path d="M14 ${y+43}V${y+14}Q14 ${y+7} 18 ${y+1}Q22 ${y+7} 22 ${y+14}V${y+43}M18 ${y+8}V${y+43}" stroke-width=".6"/><path d="M7 ${y+51}H29M7 ${y+55}H29" stroke-width=".8"/>`}
  return wrap(g,`${corners(corner)}${sides(lancets)}<path d="M111 619H146L180 649L214 619H249M122 626H143L180 657L217 626H238" stroke-width="1.1"/><path d="M155 625Q155 610 180 598Q205 610 205 625L180 647Z" fill="${ink}"/><path d="M164 625Q164 616 180 607Q196 616 196 625L180 639Z" stroke="${ivory}" stroke-width=".65"/>${star(180,625,14)}`)
}

function feather(g){
  let fan='';for(let i=0;i<5;i++){const a=(-92+i*22)*Math.PI/180;const tip=point(44,44,47,a),left=point(44,44,19,a-.2),right=point(44,44,19,a+.2);fan+=`<path d="M44 44L${left}L${tip}L${right}Z" fill="${i%2?ink:g}"/><path d="M44 44L${tip}" stroke="${ivory}" stroke-width=".55"/>`}
  const corner=`<g transform="translate(0 5)">${fan}<path d="M10 101L25 78L35 51L44 44L51 35L78 25L101 10L91 30L65 39L55 55L39 65L30 91Z" fill="${ink}"/><path d="M17 87L31 76L41 52M87 17L76 31L52 41" stroke-width="1.6"/>${diamond(44,44,10,10,g)}<path d="M44 36V52M36 44H52" stroke="${ivory}" stroke-width=".6"/></g>`
  let quills='';for(let i=0;i<6;i++){const y=209+i*31;quills+=`<path d="M18 ${y+27}L4 ${y+8}L5 ${y-10}L18 ${y+10}L31 ${y-10}L32 ${y+8}Z" fill="${i%2?ink:g}"/><path d="M6 ${y-5}L18 ${y+18}L30 ${y-5}" stroke="${ivory}" stroke-width=".55"/>`}
  return wrap(g,`${corners(corner)}${sides(`<path d="M18 172V436" stroke-width="1.4"/>${quills}`)}<path d="M105 621L158 612L180 629L202 612L255 621L220 625L202 636L180 647L158 636L140 625Z" fill="${g}"/><path d="M120 620L158 620L180 638L202 620L240 620M143 625L158 628L180 644L202 628L217 625" stroke="${ivory}" stroke-width=".6"/>${star(180,626,25)}`)
}

function woven(g){
  const corner=`<path d="M8 100V43L43 8H101L84 21H48L21 48V84Z" fill="${g}"/><path d="M32 95V57L57 32H95L79 44H63L44 63V79Z" fill="${ink}"/><path d="M6 56L31 81L79 33L55 8L6 56Z" fill="${ink}" stroke-width="1.5"/><path d="M14 56L31 73L71 33L55 16Z" stroke="${ivory}" stroke-width="1.2"/><path d="M24 42L42 24L62 44L44 62Z" fill="${g}"/><path d="M24 42L44 62M42 24L62 44" stroke="${ivory}" stroke-width=".7"/><path d="M12 92V82M92 12H82" stroke-width="2"/>`
  let ribbon='';for(let i=0;i<5;i++){const y=185+i*53;ribbon+=`<path d="M7 ${y}L29 ${y+21}V${y+37}L7 ${y+16}Z" fill="${g}"/><path d="M29 ${y}L7 ${y+21}V${y+37}L29 ${y+16}Z" fill="${ink}"/><path d="M27 ${y+3}L10 ${y+21}V${y+31}" stroke="${ivory}" stroke-width=".7"/>`}
  return wrap(g,`${corners(corner)}${sides(`<path d="M5 170V466M31 170V466" stroke-width=".8"/>${ribbon}<path d="M5 170H31M5 466H31" stroke-width="2"/>`)}<path d="M108 621L141 608L171 631L193 612L222 638L252 625L231 616L222 624L193 599L169 619L141 596L108 610Z" fill="${g}"/><path d="M112 615L141 602L170 625L193 605L222 631L244 621" stroke="${ivory}" stroke-width=".7"/>${diamond(180,625,19,26)}${star(180,625,18)}`)
}

function seals(g){
  const corner=`<path d="M10 95V47Q10 12 46 12H95L85 23H49Q23 23 23 49V85Z" fill="${g}"/><path d="M5 35L20 20L35 5L53 10L62 30L50 50L30 62L10 53Z" fill="${ink}" stroke-width="1.2"/><circle cx="32" cy="32" r="19" stroke-width="1.3"/><circle cx="32" cy="32" r="15" stroke-width=".6"/><path d="M32 10V17M32 47V54M10 32H17M47 32H54M16 16L21 21M43 43L48 48M16 48L21 43M43 21L48 16" stroke-width=".6"/>${star(32,32,11)}<path d="M70 16L76 22L70 28L64 22Z" fill="${ivory}"/><path d="M16 70L22 76L28 70L22 64Z" fill="${ivory}"/>`
  let chain='';for(let i=0;i<12;i++){const y=153+i*28;chain+=`<rect x="12" y="${y}" width="12" height="23" rx="6" fill="${ink}" stroke-width="1.5"/><path d="M18 ${y+18}V${y+33}" stroke-width="2"/><path d="M15 ${y+6}V${y+14}" stroke="${ivory}" stroke-width=".5"/>`}
  const pendant=`<path d="M18 276L35 294V346L18 365L1 346V294Z" fill="${ink}" stroke-width="1.2"/><path d="M18 285L28 298V342L18 354L8 342V298Z" stroke-width=".65"/><circle cx="18" cy="320" r="11"/>${star(18,320,8)}<path d="M18 294V302M18 338V346" stroke="${ivory}"/>`
  return wrap(g,`${corners(corner)}${sides(chain+pendant)}<path d="M112 624H147M213 624H248" stroke-width="2"/><path d="M153 610L180 596L207 610V638L180 653L153 638Z" fill="${ink}" stroke-width="1.4"/><circle cx="180" cy="625" r="20"/><circle cx="180" cy="625" r="15" stroke-width=".6"/>${star(180,625,14)}<circle cx="144" cy="624" r="4" fill="${g}"/><circle cx="216" cy="624" r="4" fill="${g}"/>`)
}

export const designs = [
  {name:'星芒嵌金',english:'STELLAR INLAY',note:'菱晶侧饰 · 底部星徽',description:'双层细金框自然转过四角，侧边以长条菱晶镶饰连接；底部星徽与黑日形成对称轴。',draw:stellar},
  {name:'圣堂花窗',english:'CATHEDRAL TRACERY',note:'四叶窗格 · 连拱浮雕',description:'四叶花窗镂空护角，两侧排列细长尖拱窗格；像从圣堂门扉上取下的一圈金属雕饰。',draw:chapel},
  {name:'日冕羽饰',english:'CORONA PLUMAGE',note:'扇形羽片 · 叠羽金边',description:'把黑日的放射语汇延伸为四角扇形羽片，两侧叠羽收束，底部展开一枚宽幅翼状星饰。',draw:feather},
  {name:'圣典绶带',english:'WOVEN GOLD',note:'交织护角 · 连续编带',description:'用有宽度、有穿插关系的金属绶带构成角饰与侧边，黑底留空形成清晰的编织纹样。',draw:woven},
  {name:'星链封印',english:'CELESTIAL SEALS',note:'星章护角 · 链环垂饰',description:'星章固定四角，细密链环贯穿两侧，中段封印与底部六角星徽让边框像一件完整的仪式器物。',draw:seals},
]
