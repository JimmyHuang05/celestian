let sampleRequest
export function countryDemography(){
 sampleRequest??=fetch('/mapplus/country-demography.json',{priority:'low'}).then(r=>{if(!r.ok)throw Error('人口估算数据无法加载');return r.json()}).catch(e=>{sampleRequest=null;throw e})
 return sampleRequest
}
function indexRing(points){
 let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity
 for(const [x,y] of points){
  left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)
 }
 return {points,left,top,right,bottom}
}
function contains({points,left,top,right,bottom},x,y){
 if(x<left||x>right||y<top||y>bottom)return false
 let inside=false
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [ax,ay]=points[j],[bx,by]=points[i]
  if(ax===bx&&ay===by)continue
  if((x-ax)*(by-ay)===(y-ay)*(bx-ax)&&x>=Math.min(ax,bx)&&x<=Math.max(ax,bx)&&y>=Math.min(ay,by)&&y<=Math.max(ay,by))return true
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside
 }
 return inside
}
export function estimateCountries(geometry,rows,draft,sha,model){
 if(model.coordinateSystemSha256!==sha)throw Error('人口估算数据与地图坐标不匹配')
 const reference=rows.find(c=>c.region_id==='political-1')
 const scores=new Map()
 const byID=new Map(geometry.map(({id,polygons})=>[id,polygons.flat().map(indexRing)]))
 for(const row of rows){
  if(!(row.liveArea>0))continue
  const rings=byID.get(row.region_id)
  let total=0,weight=0
  for(const [x,y,w,score] of model.samples){
   let inside=false
   for(const ring of rings)if(contains(ring,x,y))inside=!inside
   if(inside){total+=w*score;weight+=w}
  }
  if(!weight){
   // Very small islands may fall between native mesh samples. Use their nearest
   // land sample rather than implying a zero population.
   const ring=draft.rings.find(r=>!r.hole&&r.country===row.region_id),p=draft.nodes[ring.nodes[0]]
   let distance=Infinity
   for(const [x,y,,score] of model.samples){const d=(x-p[0])**2+(y-p[1])**2;if(d<distance){distance=d;total=score;weight=1}}
  }
  scores.set(row.region_id,total/weight)
 }
 for(const row of rows){
  row.countryOverview={...row.countryOverview}
  if(!row.liveArea||!reference?.liveArea){delete row.countryOverview.territory;delete row.countryOverview.population;continue}
  const area=row.liveArea/reference.liveArea*9500000
  const population=137000000*(area/9500000)*(scores.get(row.region_id)/scores.get(reference.region_id))
  const rounded=(value,unit)=>Math.max(1,Math.round(value/unit))*unit
  row.countryOverview.population=`约 ${rounded(population/10000,population>=10000000?100:population>=1000000?10:1).toLocaleString('en-US')} 万人`
 }
}
