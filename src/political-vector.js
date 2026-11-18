import {coastalPolygons} from './political-coast.js'
import {countryPolygons} from './political-assignment.js'
export const emptyDraft=()=>({version:1,nodes:{},rings:[]})
export function validateDraft(d,ids){
 if(d?.countries!==undefined&&(!Array.isArray(d.countries)||d.countries.length>200||!d.countries.every(c=>/^custom-[\w-]+$/.test(c.region_id)&&typeof c.title==='string'&&c.title.trim().length>0&&c.title.length<=80&&/^#[0-9a-f]{6}$/i.test(c.politicalColor))||new Set(d.countries.map(c=>c.region_id)).size!==d.countries.length))return false
 ids=new Set([...ids,...(d?.countries||[]).map(c=>c.region_id)])
 if(!d||d.version!==1||!d.nodes||Array.isArray(d.nodes)||!Array.isArray(d.rings)||d.rings.length>2000||Object.keys(d.nodes).length>100000)return false
 if(!Object.entries(d.nodes).every(([id,p])=>/^v[\w-]+$/.test(id)&&Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=2048&&p[1]>=0&&p[1]<=1024))return false
 if(d.edges!==undefined&&(!Array.isArray(d.edges)||d.edges.length>100000||!d.edges.every(e=>Array.isArray(e)&&e.length===2&&e.every(n=>Object.hasOwn(d.nodes,n)))))return false
 if(d.activeNode!=null&&!Object.hasOwn(d.nodes,d.activeNode))return false
 return d.rings.every(r=>(r.country===null||ids.has(r.country))&&Array.isArray(r.nodes)&&r.nodes.length>=3&&r.nodes.length<=50000&&new Set(r.nodes).size>=3&&r.nodes.every(id=>Object.hasOwn(d.nodes,id))&&(r.regionNumber===undefined||(Number.isSafeInteger(r.regionNumber)&&r.regionNumber>0))&&(r.hole===undefined||typeof r.hole==='boolean')&&(r.polygon===undefined||typeof r.polygon==='string')&&(!r.hole||d.rings.some(o=>!o.hole&&o.country===r.country&&o.polygon===r.polygon)))
}
export function splitEdge(d,a,b,id,point){
 d.nodes[id]=point
 for(const r of d.rings)for(let i=r.nodes.length-1;i>=0;i--){const x=r.nodes[i],y=r.nodes[(i+1)%r.nodes.length];if((x===a&&y===b)||(x===b&&y===a))r.nodes.splice(i+1,0,id)}
}
export function removeNode(d,id){
 const rings=d.rings.filter(r=>r.nodes.includes(id))
 if(rings.some(r=>new Set(r.nodes.filter(n=>n!==id)).size<3))return false
 rings.forEach(r=>{r.nodes=r.nodes.filter(n=>n!==id)});delete d.nodes[id];return true
}
export function ringArea(points){
 let sum=0
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];sum+=(b[0]-a[0])*(Math.sin(Math.PI/2-a[1]*Math.PI/1024)+Math.sin(Math.PI/2-b[1]*Math.PI/1024))}
 return Math.abs(sum)*1024/(2*Math.PI)
}
export function politicalGeometry(d,countries){
 return countries.map(c=>{
 const rings=d.rings.filter(r=>r.country===c.region_id)
 const polygons=coastalPolygons(rings.map(r=>r.nodes.map(id=>d.nodes[id])),c.region_id,countryPolygons(d,c.region_id))
 c.liveArea=polygons.reduce((sum,p)=>sum+p.reduce((n,r,i)=>n+(i?-1:1)*ringArea(r),0),0)
 const color=/^#[0-9a-f]{6}$/i.test(c.politicalColor)?c.politicalColor:'#888888'
 return {id:c.region_id,color,polygons}
 })
}
export function politicalSVG(geometry, compact=false){
 const paths=geometry.map(({id,color,polygons})=>{
 const path=polygons.flat().map(r=>{
  if(!compact)return r.map((p,i)=>`${i?'L':'M'}${p.join(',')}`).join(' ')+'Z'
  // Keep shared vertices coincident. At maximum zoom this grid is ~0.1 CSS px.
  const points=r.map(p=>p.map(n=>Math.round(n*100)/100).join(','))
  const unique=points.filter((p,i)=>i===0||p!==points[i-1])
  if(unique.length>1&&unique[0]===unique.at(-1))unique.pop()
  return unique.length>=3?`M${unique.join('L')}Z`:''
 }).join(compact?'':' ')
 return `<path id="${id}" data-region-id="${id}" fill-rule="evenodd" fill="${color}" fill-opacity="0.28" stroke="${color}" stroke-width="0.55" d="${path}"/>`
 }).join('')
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 1024">${paths}</svg>`
}
export function vectorSVG(d,countries){
 return politicalSVG(politicalGeometry(d,countries))
}
