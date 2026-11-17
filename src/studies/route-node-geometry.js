const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t)
export function splitCurve(c,t){const a=mix(c[0],c[1],t),b=mix(c[1],c[2],t),d=mix(c[2],c[3],t),e=mix(a,b,t),f=mix(b,d,t),p=mix(e,f,t);return [[c[0],a,e,p],[p,f,d,c[3]]]}
export const curvePoint=(c,t)=>splitCurve(c,t)[0][3]
// Work in map space (2:1), not square normalized coordinates. A shared,
// length-limited tangent at each knot keeps both sides smooth even when
// neighbouring nodes have very different spacing.
export function smoothNodes(points){
 const p=points.map(([x,y])=>[x*2,y]),sub=(a,b)=>a.map((v,k)=>v-b[k]),len=v=>Math.hypot(...v)
 const tangents=p.map((v,i)=>{
  const a=i?sub(v,p[i-1]):sub(p[1]||v,v),b=i<p.length-1?sub(p[i+1],v):a
  const la=len(a),lb=len(b)
  if(la<1e-10||lb<1e-10)return [0,0]
  const direction=a.map((n,k)=>n/la+b[k]/lb),size=len(direction)
  if(size<1e-8)return [0,0]
  let reach=Math.min(la,lb)/3
  const unit=direction.map(n=>n/size)
  // Keep control points inside the supported map coordinates.
  for(let k=0;k<2;k++)if(Math.abs(unit[k])>1e-10){
   const low=k===0?-2:0,high=k===0?4:1
   reach=Math.min(reach,(v[k]-low)/Math.abs(unit[k]),(high-v[k])/Math.abs(unit[k]))
  }
  return unit.map(n=>n*Math.max(0,reach))
 })
 const normal=v=>[v[0]/2,v[1]]
 return p.slice(1).map((b,i)=>[normal(p[i]),normal(p[i].map((v,k)=>v+tangents[i][k])),normal(b.map((v,k)=>v-tangents[i+1][k])),normal(b)])
}
export const nodesOf=r=>r.curves?.length?[r.curves[0][0],...r.curves.map(c=>c[3])]:r.points
export const nodeIdsOf=r=>r.nodeIds?.length===nodesOf(r).length?r.nodeIds:nodesOf(r).map((_,i)=>`${r.id}:node:${i}`)
export function routeCurves(r){
 if(r.curves?.length)return r.curves
 return smoothNodes(r.points)
}
export function withCurves(r,curves,hidden=r.hiddenCurves||[]){const old=nodesOf(r),ids=nodeIdsOf(r),nodes=curves.length?[curves[0][0],...curves.map(c=>c[3])]:r.points;return {...r,curves,nodeIds:nodes.map(p=>{const i=old.findIndex(q=>q.every((v,k)=>Math.abs(v-p[k])<1e-12));return i<0?crypto.randomUUID():ids[i]}),hiddenCurves:hidden.filter(i=>i<curves.length),points:nodes.filter((_,i)=>i%Math.max(1,Math.ceil(nodes.length/300))===0).map(([x,y])=>[((x%1)+1)%1,y])}}
export function insertNode(r,i,t){const cs=routeCurves(r),next=withCurves(r,[...cs.slice(0,i),...splitCurve(cs[i],t),...cs.slice(i+1)],(r.hiddenCurves||[]).flatMap(j=>j===i?[i,i+1]:[j>i?j+1:j]));next.nodeIds=[...nodeIdsOf(r).slice(0,i+1),crypto.randomUUID(),...nodeIdsOf(r).slice(i+1)];return next}
export function moveNode(r,i,p,local=false){
 const nodes=nodesOf(r).map((v,j)=>j===i?p:v),nodeIds=nodeIdsOf(r)
 if(nodes.length<2)return {...r,points:nodes,nodeIds}
 let cs=smoothNodes(nodes)
 if(local){const generated=cs;cs=structuredClone(routeCurves(r));for(let j=Math.max(0,i-1);j<=Math.min(nodes.length-1,i+1);j++){if(j>0){cs[j-1][2]=generated[j-1][2];cs[j-1][3]=nodes[j]}if(j<cs.length){cs[j][0]=nodes[j];cs[j][1]=generated[j][1]}}}
 return {...withCurves(r,cs,(r.hiddenCurves||[]).filter(j=>j<i-2||j>i+1)),nodeIds}
}
export function deleteNode(r,i){
 const cs=routeCurves(r),hidden=r.hiddenCurves||[]
 if(cs.length<2)return r
 const smooth=smoothNodes(nodesOf(r).filter((_,j)=>j!==i))
 if(i===0)return withCurves(r,smooth,hidden.filter(j=>j>1).map(j=>j-1))
 if(i===cs.length)return withCurves(r,smooth,hidden.filter(j=>j<cs.length-2))
 const kept=hidden.filter(j=>j!==i-1&&j!==i).map(j=>j>i?j-1:j)
 if(hidden.includes(i-1)&&hidden.includes(i))kept.push(i-1)
 return withCurves(r,smooth,kept.filter(j=>j<i-2||j>i))
}
