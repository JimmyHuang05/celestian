import clipping from 'polygon-clipping'
import {preparePoliticalCoast,coastalPolygons} from './political-coast.js'
import {countryPolygons} from './political-assignment.js'
import {ringArea} from './political-vector.js'

export const EARTH_LAND_KM2 = 148940000
export const unionLandPolygons = polygons => polygons.length?clipping.union(...polygons):[]
export const formatLandArea = km2 => km2>0&&km2<50000?'不足 100,000 平方公里':`约 ${(Math.round(km2/100000)*100000).toLocaleString('en-US')} 平方公里`
export const sphericalArea = polygons => polygons.reduce((sum,p)=>sum+p.reduce((a,r,i)=>a+(i?-1:1)*ringArea(r),0),0)
let loading
export function landAreaModel(){
 loading??=(async()=>{
  await preparePoliticalCoast()
  const frame=[[0,0],[2048,0],[2048,1024],[0,1024]]
  const gross=coastalPolygons([frame],'area-world')
  // User's accounting convention includes inland lakes; only oceans are excluded.
  const dry=gross
  const total=sphericalArea(dry)
  if(!(total>0))throw Error('陆地面积核算：全球陆地为空')
  const measure=(geometry,key)=>{
   if(!geometry.length)return {polygons:[],km2:0}
   const polygons=coastalPolygons(geometry.flat(),key,geometry)
   return {polygons,km2:sphericalArea(polygons)/total*EARTH_LAND_KM2}
  }
  return {total,dry,measure}
 })().catch(e=>{loading=null;throw e})
 return loading
}
export async function applyLandAreas(rows,draft){
 const model=await landAreaModel()
 for(const row of rows){
  const {km2}=model.measure(countryPolygons(draft,row.region_id),'area-'+row.region_id)
  row.landAreaKm2=km2
  row.countryOverview={...row.countryOverview,territory:km2>0?formatLandArea(km2):null}
 }
}
