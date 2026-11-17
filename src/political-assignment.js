import clipping from 'polygon-clipping'
export function countryPolygons(d,country){
 const rings=d.rings.filter(r=>r.country===country)
 return rings.filter(r=>!r.hole).map(r=>[r.nodes.map(n=>d.nodes[n]),...rings.filter(h=>h.hole&&h.polygon===r.polygon).map(h=>h.nodes.map(n=>d.nodes[n]))])
}
// The selected area replaces previous ownership; rebuild coincident vertices once.
export function assignArea(d,points,country){
 const selection=[[points]],byCountry=new Map()
 for(const id of new Set(d.rings.map(r=>r.country))){
  const geometry=countryPolygons(d,id)
  byCountry.set(id,id===country?clipping.union(geometry,selection):clipping.difference(geometry,selection))
 }
 if(!byCountry.has(country))byCountry.set(country,clipping.union(selection))
 const next={...d,nodes:{},rings:[]},shared=new Map();let count=0,group=0
 for(const [id,polygons] of byCountry)for(const polygon of polygons){
  const polygonId=`p${++group}`
  polygon.forEach((ring,index)=>{
   const nodes=ring.slice(0,-1).map(p=>{const key=p.map(x=>x.toFixed(8)).join(',');if(!shared.has(key)){const node=`v${++count}`;shared.set(key,node);next.nodes[node]=p}return shared.get(key)})
   next.rings.push({country:id,nodes,polygon:polygonId,hole:index>0})
  })
 }
 return next
}
