// Every window uses the same radii as the dial. Only the image stays upright.
export function mountSectorPortrait(button,entry,index,frame){
  const clip=`roster-window-${index}`
  button.classList.add('sector-operator')
  button.innerHTML=`<svg class="sector-art" aria-hidden="true" overflow="visible">
    <defs>
      <clipPath id="${clip}" clipPathUnits="userSpaceOnUse"><path/></clipPath>
      <linearGradient id="${clip}-depth" x2="0" y2="1"><stop stop-color="#18263a"/><stop offset="1" stop-color="#0d1625"/></linearGradient>
      <linearGradient id="${clip}-shade" x2="0" y2="1"><stop offset=".55" stop-color="#09111e" stop-opacity="0"/><stop offset="1" stop-color="#09111e" stop-opacity=".65"/></linearGradient>
    </defs>
    <path class="sector-bed" fill="url(#${clip}-depth)"/>
    <g clip-path="url(#${clip})">
      <image class="sector-portrait" preserveAspectRatio="xMidYMid meet"/>
      <path class="sector-shade" fill="url(#${clip}-shade)"/>
    </g>
    <path class="sector-edge"/><path class="sector-inlay"/>
    <path class="sector-accent"/><path class="sector-joints"/>
    <g class="sector-caption"><path class="sector-leader"/><circle class="sector-pin" r="2"/>
      <text class="sector-name"></text><text class="sector-number">${String(index+1).padStart(2,'0')}</text>
    </g>
  </svg>`
  const svg=button.querySelector('svg')
  const nodes=Object.fromEntries(['bed','shade','portrait','edge','inlay','accent','joints','leader','pin','name','number'].map(key=>[key,svg.querySelector(`.sector-${key}`)]))
  const clipPath=svg.querySelector('clipPath path')
  nodes.portrait.setAttribute('href',entry.image)
  nodes.name.textContent=entry.name
  const point=(radius,angle)=>[radius*Math.cos(angle),radius*Math.sin(angle)]
  const xy=point=>point.map(value=>value.toFixed(2)).join(' ')

  return ({radius,depth,spread,outerRadius},angle)=>{
    const center=point(radius,angle),inner=radius-depth/2,outer=radius+depth/2
    const at=(r,a)=>point(r,a).map((v,i)=>v-center[i])
    const sector=(r1,r2,half)=>`M${xy(at(r1,angle-half))}L${xy(at(r2,angle-half))}A${r2} ${r2} 0 0 1 ${xy(at(r2,angle+half))}L${xy(at(r1,angle+half))}A${r1} ${r1} 0 0 0 ${xy(at(r1,angle-half))}Z`
    // Symmetric local bounds keep the button's centre on the circular trajectory.
    const corners=[at(inner,angle-spread),at(outer,angle-spread),at(inner,angle+spread),at(outer,angle+spread),at(outer,angle)]
    const width=2*Math.max(...corners.map(p=>Math.abs(p[0])))+16
    const height=2*Math.max(...corners.map(p=>Math.abs(p[1])))+16
    button.style.setProperty('--sector-width',`${width}px`)
    button.style.setProperty('--sector-height',`${height}px`)
    svg.setAttribute('viewBox',`${-width/2} ${-height/2} ${width} ${height}`)
    const outline=sector(inner,outer,spread)
    for(const node of [clipPath,nodes.bed,nodes.shade,nodes.edge])node.setAttribute('d',outline)
    nodes.inlay.setAttribute('d',sector(inner+5,outer-5,spread-5/radius))
    nodes.accent.setAttribute('d',`M${xy(at(outer+4,angle-spread*.68))}A${outer+4} ${outer+4} 0 0 1 ${xy(at(outer+4,angle+spread*.68))}`)
    nodes.joints.setAttribute('d',[-1,1].map(side=>{
      const a=angle+spread*side
      return `M${xy(at(inner-4,a))}L${xy(at(inner+12,a))}M${xy(at(outer-12,a))}L${xy(at(outer+4,a))}`
    }).join(''))
    const imageWidth=depth*2.3,imageHeight=imageWidth*4/3
    nodes.portrait.setAttribute('width',imageWidth)
    nodes.portrait.setAttribute('height',imageHeight)
    nodes.portrait.setAttribute('x',-imageWidth*(frame?.faceX??.5))
    nodes.portrait.setAttribute('y',-radius*Math.sin(spread)*.28-imageHeight*(frame?.eye??.15))

    // Horizontal names sit just outside the dial, with a fine index line.
    const edgeX=Math.sqrt(Math.max(0,outer**2-center[1]**2))-center[0]
    const labelX=Math.sqrt(Math.max(0,outerRadius**2-center[1]**2))-center[0]+14
    nodes.leader.setAttribute('d',`M${edgeX+7} 0H${labelX+10}`)
    nodes.pin.setAttribute('cx',labelX)
    nodes.pin.setAttribute('cy',0)
    for(const node of [nodes.name,nodes.number])node.setAttribute('x',labelX+10)
    nodes.name.setAttribute('y',-9)
    nodes.number.setAttribute('y',16)
  }
}
