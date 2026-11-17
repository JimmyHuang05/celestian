let sampleRequest
export async function estimateCountries(svg,rows,draft,sha){
 sampleRequest??=fetch('/mapplus/country-demography.json').then(r=>{if(!r.ok)throw Error('人口估算数据无法加载');return r.json()}).catch(e=>{sampleRequest=null;throw e})
 const model=await sampleRequest
 if(model.coordinateSystemSha256!==sha)throw Error('人口估算数据与地图坐标不匹配')
 const reference=rows.find(c=>c.region_id==='political-1')
 // SVG hit testing requires a rendered viewport in Chromium. Keep this copy
 // offscreen while sampling, independent of whether the map layer is mounted.
 const sampling=svg.cloneNode(true);sampling.style.cssText='position:fixed;left:-10000px;top:0;width:2048px;height:1024px;visibility:hidden;pointer-events:none';document.body.append(sampling)
 const scores=new Map(),point=sampling.createSVGPoint()
 try{
 for(const row of rows){
  if(!(row.liveArea>0))continue
  const path=sampling.querySelector(`[data-region-id="${row.region_id}"]`)
  let total=0,weight=0
  for(const [x,y,w,score] of model.samples){point.x=x;point.y=y;if(path.isPointInFill(point)){total+=w*score;weight+=w}}
  if(!weight){
   // Very small islands may fall between native mesh samples. Use their nearest
   // land sample rather than implying a zero population.
   const ring=draft.rings.find(r=>!r.hole&&r.country===row.region_id),p=draft.nodes[ring.nodes[0]]
   let distance=Infinity
   for(const [x,y,,score] of model.samples){const d=(x-p[0])**2+(y-p[1])**2;if(d<distance){distance=d;total=score;weight=1}}
  }
  scores.set(row.region_id,total/weight)
 }
 }finally{sampling.remove()}
 for(const row of rows){
  row.countryOverview={...row.countryOverview}
  if(!row.liveArea||!reference?.liveArea){delete row.countryOverview.territory;delete row.countryOverview.population;continue}
  const area=row.liveArea/reference.liveArea*9500000
  const population=137000000*(area/9500000)*(scores.get(row.region_id)/scores.get(reference.region_id))
  const rounded=(value,unit)=>Math.max(1,Math.round(value/unit))*unit
  row.countryOverview.population=`约 ${rounded(population/10000,population>=10000000?100:population>=1000000?10:1).toLocaleString('en-US')} 万人`
 }
}
