const edgeKey=(a,b)=>[a,b].sort().join('|')
const area=(ids,nodes)=>ids.reduce((s,id,i)=>{const a=nodes[id],b=nodes[ids[(i+1)%ids.length]];return s+a[0]*b[1]-b[0]*a[1]},0)/2
const boundaryEdges = nodes => nodes.map((id, i) => JSON.stringify([id, nodes[(i + 1) % nodes.length]]))

function matchPreviousFaces(faces, previous, aliases) {
 const matches = new Map(), used = new Set(), candidates = []
 const oldFaces = previous.map(ring => {
  const nodes = ring.nodes.map(id => aliases.get(id) || id).filter((id, i, ids) => id !== ids[(i + 1) % ids.length])
  return {ring, vertices: new Set(nodes), edges: new Set(boundaryEdges(nodes))}
 })
 const claim = (index, old) => {
  matches.set(index, old.ring)
  used.add(old)
 }
 // Reserve intact boundaries before a split or merge can claim their IDs.
 for (const [index, nodes] of faces.entries()) {
  const edges = boundaryEdges(nodes)
  for (const old of oldFaces) {
   const sharedEdges = edges.filter(edge => old.edges.has(edge)).length
   if (sharedEdges === edges.length && sharedEdges === old.edges.size && !used.has(old)) {
    claim(index, old)
    break
   }
   const sharedVertices = nodes.filter(id => old.vertices.has(id)).length
   if (sharedEdges || sharedVertices >= 2) candidates.push({index, old, sharedEdges, sharedVertices})
  }
 }
 // Resolve changed faces in order of boundary continuity, independent of walk order.
 candidates.sort((a, b) => b.sharedEdges - a.sharedEdges || b.sharedVertices - a.sharedVertices || a.old.ring.regionNumber - b.old.ring.regionNumber)
 for (const {index, old} of candidates) {
  if (!matches.has(index) && !used.has(old)) claim(index, old)
 }
 return matches
}
export function initializeGraph(d){
 const result=structuredClone(d)
 if(!result.edges){const edges=new Map();for(const r of result.rings)for(let i=0;i<r.nodes.length;i++){const a=r.nodes[i],b=r.nodes[(i+1)%r.nodes.length];if(a!==b)edges.set(edgeKey(a,b),[a,b])}result.edges=[...edges.values()]}
 if(typeof result.drawing!=='boolean')result.drawing=Boolean(result.activeNode&&result.nodes[result.activeNode]&&result.edges.filter(e=>e.includes(result.activeNode)).length<=1)
 result.nextRegion=Math.max(result.nextRegion||1,...result.rings.map(r=>(r.regionNumber||0)+1))
 return result
}
export function splitGraphEdge(d,a,b,id,p){
 d.nodes[id]=p;d.edges=d.edges.filter(e=>edgeKey(...e)!==edgeKey(a,b));d.edges.push([a,id],[id,b])
}
export function removeGraphNode(d,id){
 const neighbors=d.edges.filter(e=>e.includes(id)).map(e=>e.find(n=>n!==id))
 d.edges=d.edges.filter(e=>!e.includes(id));if(neighbors.length===2)d.edges.push(neighbors)
 delete d.nodes[id];if(d.activeNode===id)d.activeNode=null
}
export function removeGraphLine(d,a,b){
 const adjacency=new Map()
 for(const [x,y] of d.edges){if(!adjacency.has(x))adjacency.set(x,[]);if(!adjacency.has(y))adjacency.set(y,[]);adjacency.get(x).push(y);adjacency.get(y).push(x)}
 const removed=new Set([edgeKey(a,b)])
 for(const [start,previous] of [[a,b],[b,a]]){
  let current=start,prev=previous
  while(adjacency.get(current)?.length===2){const next=adjacency.get(current).find(n=>n!==prev),key=edgeKey(current,next);if(removed.has(key))break;removed.add(key);prev=current;current=next}
 }
 d.edges=d.edges.filter(e=>!removed.has(edgeKey(...e)))
 const used=new Set(d.edges.flat())
 for(const id of adjacency.keys())if(!used.has(id)){delete d.nodes[id];if(d.activeNode===id)d.activeNode=null}
}
export function rebuildRegions(d){
 const welded=new Map(),aliases=new Map()
 for(const [id,p] of Object.entries(d.nodes)){const key=p.map(v=>v.toFixed(7)).join(',');if(welded.has(key))aliases.set(id,welded.get(key));else welded.set(key,id)}
 d.edges=d.edges.map(e=>e.map(id=>aliases.get(id)||id))
 if(aliases.has(d.activeNode))d.activeNode=aliases.get(d.activeNode)
 for(const id of aliases.keys())delete d.nodes[id]
 // Split crossings and T junctions so every enclosed face can be walked.
 const edges=d.edges.filter(([a,b])=>a!==b&&d.nodes[a]&&d.nodes[b]),cuts=edges.map(([a,b])=>[{t:0,id:a},{t:1,id:b}])
 const coord=new Map(Object.entries(d.nodes).map(([id,p])=>[p.map(n=>n.toFixed(7)).join(','),id]))
 const node=p=>{const k=p.map(n=>n.toFixed(7)).join(',');if(!coord.has(k)){const id=`v${crypto.randomUUID()}`;d.nodes[id]=p;coord.set(k,id)}return coord.get(k)}
 const sweep=edges.map(([a,b],i)=>({i,min:Math.min(d.nodes[a][0],d.nodes[b][0]),max:Math.max(d.nodes[a][0],d.nodes[b][0])})).sort((a,b)=>a.min-b.min)
 for(let si=0;si<sweep.length;si++)for(let sj=si+1;sj<sweep.length;sj++){
  if(sweep[sj].min>sweep[si].max+1e-8)break
  const i=sweep[si].i,j=sweep[sj].i
  const pi=d.nodes[edges[i][0]],qi=d.nodes[edges[i][1]],pj=d.nodes[edges[j][0]],qj=d.nodes[edges[j][1]]
  if(Math.max(pi[0],qi[0])+1e-8<Math.min(pj[0],qj[0])||Math.max(pj[0],qj[0])+1e-8<Math.min(pi[0],qi[0])||Math.max(pi[1],qi[1])+1e-8<Math.min(pj[1],qj[1])||Math.max(pj[1],qj[1])+1e-8<Math.min(pi[1],qi[1]))continue
  const [a,b]=edges[i].map(id=>d.nodes[id]),[c,e]=edges[j].map(id=>d.nodes[id]),u=[b[0]-a[0],b[1]-a[1]],v=[e[0]-c[0],e[1]-c[1]],w=[c[0]-a[0],c[1]-a[1]],cross=(x,y)=>x[0]*y[1]-x[1]*y[0],den=cross(u,v)
  if(Math.abs(den)<1e-10){
   for(const [index,p,id] of [[i,c,edges[j][0]],[i,e,edges[j][1]],[j,a,edges[i][0]],[j,b,edges[i][1]]]){
    const [s,t]=edges[index].map(n=>d.nodes[n]),dx=t[0]-s[0],dy=t[1]-s[1],length=dx*dx+dy*dy,q=((p[0]-s[0])*dx+(p[1]-s[1])*dy)/length
    if(q>0&&q<1&&Math.abs((p[0]-s[0])*dy-(p[1]-s[1])*dx)<1e-7)cuts[index].push({t:q,id})
   }continue
  }
  const t=cross(w,v)/den,q=cross(w,u)/den
  if(t>=-1e-9&&t<=1+1e-9&&q>=-1e-9&&q<=1+1e-9){const id=node([a[0]+t*u[0],a[1]+t*u[1]]);cuts[i].push({t:Math.max(0,Math.min(1,t)),id});cuts[j].push({t:Math.max(0,Math.min(1,q)),id})}
 }
 const unique=new Map()
 for(const cut of cuts){cut.sort((a,b)=>a.t-b.t);for(let i=1;i<cut.length;i++){const a=cut[i-1].id,b=cut[i].id;if(a!==b&&Math.abs(cut[i].t-cut[i-1].t)>1e-9)unique.set(edgeKey(a,b),[a,b])}}
 d.edges=[...unique.values()]
 const adjacent=new Map();for(const [a,b] of d.edges){if(!adjacent.has(a))adjacent.set(a,[]);if(!adjacent.has(b))adjacent.set(b,[]);adjacent.get(a).push(b);adjacent.get(b).push(a)}
 for(const [id,list] of adjacent){const p=d.nodes[id];list.sort((a,b)=>Math.atan2(d.nodes[a][1]-p[1],d.nodes[a][0]-p[0])-Math.atan2(d.nodes[b][1]-p[1],d.nodes[b][0]-p[0]))}
 const visited=new Set(),faces=[]
 for(const [start,list] of adjacent)for(const end of list){
  if(visited.has(`${start}>${end}`))continue
  const ring=[];let a=start,b=end
  for(let count=0;count<=d.edges.length*2;count++){
   const key=`${a}>${b}`;if(visited.has(key))break;visited.add(key);ring.push(a)
   const next=adjacent.get(b),c=next[(next.indexOf(a)-1+next.length)%next.length];a=b;b=c
   if(a===start&&b===end){
    let clean=ring,changed=true
    while(changed&&clean.length>2){changed=false;for(let i=0;i<clean.length;i++)if(clean[(i+clean.length-1)%clean.length]===clean[(i+1)%clean.length]){clean=clean.filter((_,j)=>j!==i&&j!==(i+1)%clean.length);changed=true;break}}
    if(clean.length>=3&&area(clean,d.nodes)>1e-7)faces.push(clean);break
   }
  }
 }
 const matches=matchPreviousFaces(faces,d.rings.filter(r=>!r.hole),aliases)
 d.rings=faces.map((nodes,index)=>{
  const previous=matches.get(index)
  const number=previous?.regionNumber||d.nextRegion++
  return {nodes,regionNumber:number,polygon:'region-'+number,country:previous?.country??null}
 })
 // Disconnected loops inside a face are holes in the surrounding region,
 // while remaining independently numbered regions themselves.
 const contains=(ring,p)=>{let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=d.nodes[ring[i]],b=d.nodes[ring[j]];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside}
 const outer=[...d.rings]
 for(const inner of outer){
  const parents=outer.filter(r=>r!==inner&&!r.nodes.some(n=>inner.nodes.includes(n))&&contains(r.nodes,d.nodes[inner.nodes[0]])).sort((a,b)=>area(a.nodes,d.nodes)-area(b.nodes,d.nodes))
  if(parents.length){const parent=parents[0];d.rings.push({...parent,nodes:[...inner.nodes].reverse(),hole:true})}
 }
 return d
}
