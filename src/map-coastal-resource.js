export const COASTAL_GEOMETRY_URL='/mapplus/natural-ridge-v2/coastal-geometry.svg?v=3'
const requests=new Map()
// Share decoded source text across rendering and area calculations. A consumer
// leaving the page must not abort another consumer's in-flight request.
export function coastalGeometryText(url=COASTAL_GEOMETRY_URL){
 const key=url.split('?')[0]===COASTAL_GEOMETRY_URL.split('?')[0]?COASTAL_GEOMETRY_URL:url
 if(!requests.has(key))requests.set(key,fetch(key).then(r=>{
  if(!r.ok)throw Error(`Coastal geometry returned ${r.status}`)
  return r.text()
 }).catch(e=>{requests.delete(key);throw e}))
 return requests.get(key)
}
