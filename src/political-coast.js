import polygonClipping from 'polygon-clipping'
import {snapToCoast} from './coast-snap.js'
import {createCoastalGraph} from './coastal-region-graph.js'
import {coastalGeometryText} from './map-coastal-resource.js'
let rebuildCoastal
export function rebuildCoastalRegions(d){
 if(!land)throw Error('海岸线尚未加载')
 rebuildCoastal??=createCoastalGraph(land)
 return rebuildCoastal(d)
}
export const snapOceanNode=point=>land?snapToCoast(point,land):point
let land, loading
const cache=new Map()
export function flattenCoast(d){
 const tokens=d.match(/[MLQZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi)||[]
 const rings=[];let ring=[],p=[0,0],i=0
 while(i<tokens.length){
  const command=tokens[i++]
  if(command==='M'){if(ring.length>2)rings.push(ring);p=[+tokens[i++],+tokens[i++]];ring=[p]}
  else if(command==='L'){p=[+tokens[i++],+tokens[i++]];ring.push(p)}
  else if(command==='Q'){
   const control=[+tokens[i++],+tokens[i++]],end=[+tokens[i++],+tokens[i++]],start=p
   const steps=Math.max(2,Math.min(32,Math.ceil((Math.hypot(control[0]-p[0],control[1]-p[1])+Math.hypot(end[0]-control[0],end[1]-control[1]))/2)))
   for(let j=1;j<=steps;j++){const t=j/steps,u=1-t;ring.push([u*u*start[0]+2*u*t*control[0]+t*t*end[0],u*u*start[1]+2*u*t*control[1]+t*t*end[1]])}p=end
  }else if(command==='Z'){if(ring.length>2)rings.push(ring);ring=[]}
  else throw Error('不支持的海岸线路径')
 }
 if(ring.length>2)rings.push(ring)
 return rings
}
const bbox=points=>points.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[Infinity,Infinity,-Infinity,-Infinity])
export async function preparePoliticalCoast(){
 if(land)return
 loading??=coastalGeometryText().then(source=>{
  const doc=new DOMParser().parseFromString(source,'image/svg+xml')
  const path=doc.querySelector('#mapplus-land-shape').getAttribute('d')
  const offsets=[...doc.querySelectorAll('#mapplus-land-clip use')].map(n=>Number(n.getAttribute('transform').match(/translate\(([-\d.]+)/)[1]))
  setPoliticalCoast(path,offsets)
 }).catch(e=>{loading=null;throw e})
 await loading
}
export function setPoliticalCoast(path,offsets){
 const rings=flattenCoast(path)
 // Each enclosed outline is filled independently: inland lakes remain claimable.
 land=offsets.flatMap(dx=>rings.map(r=>{const points=r.map(([x,y])=>[x+dx,y]);return {points,box:bbox(points)}})).filter(r=>r.box[2]>=0&&r.box[0]<=2048)
 rebuildCoastal=null
 cache.clear()
}
export function coastalPolygons(rings,key,geometry=rings.map(r=>[r])){
 if(!rings.length)return []
 if(!land)return geometry
 const signature=JSON.stringify(geometry),previous=cache.get(key)
 if(previous?.signature===signature)return previous.polygons
 const box=bbox(rings.flat()),near=land.filter(r=>r.box[0]<=box[2]&&r.box[2]>=box[0]&&r.box[1]<=box[3]&&r.box[3]>=box[1])
 const polygons=near.length?polygonClipping.intersection(geometry,near.map(r=>[r.points])):[]
 cache.set(key,{signature,polygons});return polygons
}
