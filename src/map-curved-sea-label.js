export const defaultCurve={enabled:true,width:14,bend:3,rise:5,gap:1.8,foreignScale:.68}
export function hasLabelCurve(row){return row.curve?.enabled ?? /格[莱萊]德之海$/.test(row.title)}
export function curveSeaLabel(group, row, f, x, y) {
  if (!hasLabelCurve(row)) return null
  const ns='http://www.w3.org/2000/svg'
  group.dataset.curvedSea='true'
  const defs=document.createElementNS(ns,'defs')
  let lines=[
    {points:[[-9,6],[-6,.5],[0,-1.8],[5,-1.8]],length:13.2},
    {points:[[-5,4.6],[-2,1.6],[1,.5],[3.8,.4]],length:7.4},
  ]
  if(Number.isFinite(row.curve?.curvature)){
    // A symmetric arc keeps its midpoint at the label anchor. The subtitle
    // follows the same curvature below it; spacing is derived from the names.
    const k=Math.max(-100,Math.min(100,row.curve.curvature))/100
    const foreign=row.foreignTitle||row.foreign_title||''
    const spread=Number.isFinite(row.curve.spread)?Math.max(.8,Math.min(8,row.curve.spread)):1
    const width=Math.max(4,Math.min(48,Math.max([...row.title].length*1.4,foreign.length*.24)*spread))
    const ratio=Number.isFinite(row.curve.foreignScale)?Math.max(.35,Math.min(1,row.curve.foreignScale)):Math.min(.85,Math.max(.62,foreign.length*.27/width))
    // Straight baselines are .7f apart; curved labels use 1.1 times that gap.
    const gap=Number.isFinite(row.curve.foreignGap)?Math.max(.5,Math.min(6,row.curve.foreignGap)):.7*1.1
    lines=[1,ratio].map((scale,i)=>{
      const w=width*scale,h=k*width*.25*scale*scale,g=i*gap
      return {points:[[-w/2,h+g],[-w/6,-h/3+g],[w/6,-h/3+g],[w/2,h+g]],length:w*.96}
    })
  } else if(row.curve){
    const c={...defaultCurve,...row.curve}
    const clamp=(v,a,b,fallback)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):fallback
    const width=clamp(c.width,4,24,14),bend=clamp(c.bend,-8,8,3),rise=clamp(c.rise,-12,12,5),gap=clamp(c.gap,.5,6,1.8),ratio=clamp(c.foreignScale,.35,1,.68)
    lines=[1,ratio].map((scale,i)=>{
      const w=width*scale,r=rise*scale,g=i*gap
      return {points:[[-w/2,r/2+g],[-w/6,r/6-bend*scale+g],[w/6,-r/6-bend*scale+g],[w/2,-r/2+g]],length:w*.92}
    })
  }
  for(const [i,text] of [...group.querySelectorAll('text')].entries()) {
    const line=lines[i];if(!line)continue
    const id=`${group.id}-arc-${i}`,path=document.createElementNS(ns,'path')
    const p=line.points.map(([a,b])=>`${a*f} ${b*f}`)
    path.id=id;path.setAttribute('d',`M${p[0]} C${p.slice(1).join(' ')}`);defs.append(path)
    const content=text.textContent,tp=document.createElementNS(ns,'textPath')
    tp.setAttribute('href',`#${id}`);tp.setAttribute('startOffset','50%')
    tp.setAttribute('textLength',String(line.length*f));tp.setAttribute('lengthAdjust','spacing')
    tp.textContent=content;text.replaceChildren(tp);text.removeAttribute('y')
  }
  group.prepend(defs)
  // Conservative bounds include both curves and glyph ascenders.
  const angle=Number(group.dataset.rotation||0)*Math.PI/180
  const points=lines.flatMap(l=>l.points).map(([a,b])=>[a*Math.cos(angle)-b*Math.sin(angle),a*Math.sin(angle)+b*Math.cos(angle)])
  return [x+(Math.min(...points.map(p=>p[0]))-1.5)*f,y+(Math.min(...points.map(p=>p[1]))-1.5)*f,x+(Math.max(...points.map(p=>p[0]))+1.5)*f,y+(Math.max(...points.map(p=>p[1]))+1.5)*f]
}
