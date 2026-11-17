import {rebuildRegions} from './political-region-graph.js'

export function createCoastalGraph(rings){
 const coasts=rings.map(({points})=>{
  const p=points.slice();if(p.length>1&&Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])<1e-8)p.pop()
  const lengths=[0];for(let i=0;i<p.length;i++)lengths.push(lengths.at(-1)+Math.hypot(p[(i+1)%p.length][0]-p[i][0],p[(i+1)%p.length][1]-p[i][1]))
  return {points:p,lengths,total:lengths.at(-1)}
 })
 const contacts=new Map()
 function contact(p){
  const key=p.join(',');if(contacts.has(key))return contacts.get(key)
  let found=null,best=.015**2
  coasts.forEach((c,index)=>{for(let i=0;i<c.points.length;i++){
   const a=c.points[i],b=c.points[(i+1)%c.points.length],dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len)):0
   const q=[a[0]+t*dx,a[1]+t*dy],dist=(q[0]-p[0])**2+(q[1]-p[1])**2
   if(dist<best){best=dist;found={coast:index,segment:i,s:c.lengths[i]+t*Math.sqrt(len),point:q}}
  }})
  if(contacts.size>20000)contacts.clear();contacts.set(key,found);return found
 }
 function forward(a,b){
  const c=coasts[a.coast],end=b.s<=a.s?b.s+c.total:b.s,points=[a.point]
  for(let k=1;k<=c.points.length;k++){const index=(a.segment+k)%c.points.length,s=c.lengths[index]+(a.segment+k>=c.points.length?c.total:0);if(s<=a.s+1e-8)continue;if(s>=end-1e-8)break;points.push(c.points[index])}
  points.push(b.point);return points
 }
 const shortest=(a,b)=>{const c=coasts[a.coast],length=(b.s-a.s+c.total)%c.total;return length<=c.total/2?forward(a,b):forward(b,a).reverse()}
 return function rebuild(d){
  const sourceIds=new Set(d.edges.flat()),derived=new Set(d.derivedNodes||[])
  const nodes=Object.fromEntries(Object.entries(d.nodes).filter(([id])=>!id.startsWith('vshore-')&&(!derived.has(id)||sourceIds.has(id))))
  const temp={...d,nodes:{...nodes},edges:[]},byNode=new Map(),groups=new Map(),routes=[]
  for(const [id,p] of Object.entries(nodes)){const c=contact(p);if(c){nodes[id]=c.point;temp.nodes[id]=c.point;byNode.set(id,c);if(!groups.has(c.coast))groups.set(c.coast,[]);groups.get(c.coast).push({id,...c})}}
  const coordinate=new Map(Object.entries(nodes).map(([id,p])=>[p.map(n=>n.toFixed(7)).join(','),id]))
  function append(a,b,points){
   let previous=a
   for(let i=1;i<points.length;i++){
    const p=points[i],key=p.map(n=>n.toFixed(7)).join(',');let id=i===points.length-1?b:coordinate.get(key)
    if(!id){id='vshore-'+key.replaceAll('-','m').replaceAll('.','d').replace(',','-');coordinate.set(key,id);temp.nodes[id]=p}
    if(previous!==id)temp.edges.push([previous,id]);previous=id
   }
  }
  for(const [a,b] of d.edges){if(!nodes[a]||!nodes[b])continue;const ca=byNode.get(a),cb=byNode.get(b),points=ca&&cb&&ca.coast===cb.coast?shortest(ca,cb):[nodes[a],nodes[b]];routes.push({a,b,points});append(a,b,points)}
  // Coast contacts implicitly close inland strokes. Omit the longest unused arc
  // rather than claiming the whole continent around a small local drawing.
  for(const group of groups.values()){
   if(group.length<2)continue;group.sort((a,b)=>a.s-b.s);const total=coasts[group[0].coast].total
   const lengths=group.map((a,i)=>(group[(i+1)%group.length].s-a.s+total)%total),skip=lengths.indexOf(Math.max(...lengths))
   for(let i=0;i<group.length;i++){if(i===skip)continue;const a=group[i],b=group[(i+1)%group.length];if(Math.abs(a.s-b.s)<1e-7)continue;const points=forward(a,b);routes.push({a:a.id,b:b.id,points});append(a.id,b.id,points)}
  }
  rebuildRegions(temp)
  // Intersections between a near-coastal stroke and the sampled shoreline can
  // create wedges with no intentional control geometry. Merge their internal
  // seams, rather than assigning numbers to sampling artifacts.
  const key=(a,b)=>[a,b].sort().join('|'),incidence=new Map()
  for(const r of temp.rings.filter(r=>!r.hole))for(let i=0;i<r.nodes.length;i++){const k=key(r.nodes[i],r.nodes[(i+1)%r.nodes.length]);incidence.set(k,(incidence.get(k)||0)+1)}
  const seams=new Set()
  for(const r of temp.rings.filter(r=>!r.hole&&r.nodes.filter(id=>sourceIds.has(id)).length<2))for(let i=0;i<r.nodes.length;i++){
   const a=r.nodes[i],b=r.nodes[(i+1)%r.nodes.length],k=key(a,b),p=temp.nodes[a],q=temp.nodes[b]
   if(incidence.get(k)>1&&!contact([(p[0]+q[0])/2,(p[1]+q[1])/2]))seams.add(k)
  }
  if(seams.size){temp.edges=temp.edges.filter(([a,b])=>!seams.has(key(a,b)));rebuildRegions(temp)}
  const accepted=new Set(temp.rings.filter(r=>!r.hole&&r.nodes.filter(id=>sourceIds.has(id)).length>=2).map(r=>r.regionNumber))
  temp.rings=temp.rings.filter(r=>accepted.has(r.regionNumber))
  const remaining=new Map(Object.entries(temp.nodes).map(([id,p])=>[p.map(n=>n.toFixed(7)).join(','),id]))
  const resolved=id=>temp.nodes[id]?id:remaining.get(nodes[id]?.map(n=>n.toFixed(7)).join(','))
  d.edges=d.edges.map(e=>e.map(resolved)).filter(e=>e.every(Boolean)&&e[0]!==e[1])
  d.nodes=temp.nodes;d.rings=temp.rings;d.nextRegion=temp.nextRegion;d.activeNode=temp.activeNode
  d.derivedNodes=Object.keys(temp.nodes).filter(id=>!Object.hasOwn(nodes,id))
  d.displayEdges=temp.edges;d.edgeRoutes=routes
  return d
 }
}
