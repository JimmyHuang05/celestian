import {curvePoint} from './route-node-geometry.js'
const englishNames={spice:'Spice and Iris Coastal Route',amber:'Amber Sea Feeder Route',victoria:'Victoria Intercontinental Route',colonial:'New World Grain and Timber Route',south:'Southern Colonies Supply Route'}

// Labels use the map's 21600 x 10800 artboard. Split at seams and suppressed
// shared segments, so lettering never jumps across the map or repeats a trunk.
export function routeLabels(routes,isWater){
 const groups=new Map(),occupied=[],labels=[]
 for(const r of routes){
  if(!r.curves?.length)continue
  const key=r.labelSeparate?r.id:(r.family||r.id)
  const name=r.name.split('：')[0]
  const english=r.englishName||englishNames[r.family]||(/^新航线\s*(\d+)$/.test(name)?name.replace(/^新航线\s*/, 'New Route '):'Maritime Route')
  if(!groups.has(key))groups.set(key,{name,english,runs:[]})
  if(r.labelRegion)groups.get(key).region=r.labelRegion
  let run=[],lastTile=null
  const flush=()=>{if(run.length>1){run.pairedOffset=r.pairedDirection?(r.pairedOffset??36):0;groups.get(key).runs.push(run)}run=[]}
  r.curves.forEach((c,i)=>{
   if(r.hiddenCurves?.includes(i)){flush();return}
   const length=c.slice(1).reduce((s,p,j)=>s+Math.hypot((p[0]-c[j][0])*21600,(p[1]-c[j][1])*10800),0),n=Math.max(8,Math.ceil(length/16))
   for(let j=0;j<n;j++){const p=curvePoint(c,j/n),tile=Math.floor(p[0]);if(tile!==lastTile)flush();lastTile=tile;run.push([(p[0]-tile)*21600,p[1]*10800])}
   const p=c[3],tile=Math.floor(p[0]);if(tile===lastTile)run.push([(p[0]-tile)*21600,p[1]*10800])
  });flush()
 }
 for(const [family,{name,english,runs,region}] of groups){
  let best=null
  const candidateRuns=region?runs.flatMap(run=>{
    const segments=[];let part=[]
    const flush=()=>{if(part.length>1){part.pairedOffset=run.pairedOffset;segments.push(part)}part=[]}
    for(const p of run){if(p[0]>=region[0]*21600&&p[0]<=region[2]*21600&&p[1]>=region[1]*10800&&p[1]<=region[3]*10800)part.push(p);else flush()}
    flush();return segments
  }):runs
  for(const run of candidateRuns){
   const distance=[0];for(let i=1;i<run.length;i++)distance.push(distance[i-1]+Math.hypot(run[i][0]-run[i-1][0],run[i][1]-run[i-1][1]))
   const length=distance.at(-1)
   const shortRoute=family==='spice-0'
   const coastalLabel=family==='amber-1'
   const supplyLabel=family==='3bb4d3a6-ebb8-4b6b-83d3-57b137145a73'
   for(const font of [82,70,58,50,42,34,26,22,18]){
   for(const zhSpacing of [3,2.4,1.8,1.2,.8,.45]){
   if(coastalLabel&&zhSpacing<1.2)continue
   const enSpacing=.22+(zhSpacing-.45)/2.55*.98
   const units=Math.max(name.length*(1+zhSpacing),english.length*(.55+enSpacing)*.52)
   if(font>length/(units+(shortRoute?1:5)))continue
   const span=(units+(shortRoute?.3:2))*font
   const margin=font*(shortRoute?.25:1)
   for(let center=span/2+margin;center<length-span/2-margin;center+=shortRoute?12:80){
    let points=run.filter((_,i)=>distance[i]>=center-span/2&&distance[i]<=center+span/2)
    if(points.length<4)continue
    const reversed=points.at(-1)[0]<points[0][0]
    if(reversed)points=points.toReversed()
    // Reversing the lettering path reverses the sign of its normal.
    const separation=(run.pairedOffset||0)*(reversed?-1:1)
    const upper=Math.min(0,separation),lower=Math.max(0,separation)
    const zhDy=upper-font*.65,enDy=lower+font*.95
    let turn=0,previous=null,safe=true,above=true,below=true
    for(let i=1;i<points.length;i++){
     const p=points[i],a=points[i-1],dx=p[0]-a[0],dy=p[1]-a[1],d=Math.hypot(dx,dy);if(!d)continue
     const angle=Math.atan2(dy,dx);if(Math.abs(angle)>(coastalLabel||supplyLabel||region?2.3:shortRoute?1.85:1.4)){safe=false;break}
     if(previous!==null)turn+=Math.abs(Math.atan2(Math.sin(angle-previous),Math.cos(angle-previous)));previous=angle
     for(const offset of [.65,1.2,1.7])if(isWater&&!isWater([(p[0]+dy/d*(font*offset-upper))/21600,(p[1]-dx/d*(font*offset-upper))/10800]))above=false
     for(const offset of [-.45,-.9,-1.4])if(isWater&&!isWater([(p[0]+dy/d*(font*offset-lower))/21600,(p[1]-dx/d*(font*offset-lower))/10800]))below=false
    }
    if(!safe||!above||!below||turn>(coastalLabel?1.7:1.1))continue
    const padding=Math.abs(separation)
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),box=[Math.min(...xs)-font-padding,Math.min(...ys)-2*font-padding,Math.max(...xs)+font+padding,Math.max(...ys)+font+padding]
    if(box[0]<0||box[2]>21600||occupied.some(b=>box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1]))continue
    const score=font*100+zhSpacing*100-turn*80-Math.abs(center-length/2)*.02
    if(!best||score>best.score)best={family,name,english,font,box,score,points,dy:zhDy/font,enDy,separation,zhSpacing,enSpacing}
   }
   }
   }
  }
  if(best){labels.push(best);occupied.push(best.box)}
 }
 return labels
}

export function appendRouteLabels(svg,routes,metadata,isWater){
 const ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs'),group=document.createElementNS(ns,'g')
 group.setAttribute('transform',`scale(${metadata.width/21600} ${metadata.height/10800})`)
 group.setAttribute('class','map-route-names');group.setAttribute('pointer-events','none')
 for(const label of routeLabels(routes,isWater)){
  const id=`route-name-${label.family}`,path=document.createElementNS(ns,'path')
  path.id=id;path.setAttribute('d',label.points.map((p,i)=>`${i?'L':'M'}${p.map(v=>v.toFixed(2)).join(' ')}`).join(' '));defs.append(path)
  const text=document.createElementNS(ns,'text'),textPath=document.createElementNS(ns,'textPath')
  text.setAttribute('font-family','CelestianAtlasZh, serif');text.setAttribute('font-size',String(label.font));text.setAttribute('letter-spacing','.45em');text.setAttribute('fill','#8c795d');text.setAttribute('font-weight','400');text.setAttribute('dy',`${label.dy}em`);text.setAttribute('text-anchor','middle')
  textPath.setAttribute('href',`#${id}`);textPath.setAttribute('startOffset','50%');textPath.textContent=label.name;text.append(textPath);group.append(text)
  text.setAttribute('letter-spacing',`${label.zhSpacing}em`)
  const en=document.createElementNS(ns,'text'),enPath=document.createElementNS(ns,'textPath')
  en.setAttribute('font-family','CelestianAtlasEn, Georgia, serif');en.setAttribute('font-size',String(label.font*.52));en.setAttribute('letter-spacing','.22em');en.setAttribute('fill','#8c795d');en.setAttribute('dy',String(label.enDy));en.setAttribute('text-anchor','middle')
  enPath.setAttribute('href',`#${id}`);enPath.setAttribute('startOffset','50%');enPath.textContent=label.english;en.append(enPath);group.append(en)
  en.setAttribute('letter-spacing',`${label.enSpacing}em`)
 }
 svg.append(defs,group)
}
