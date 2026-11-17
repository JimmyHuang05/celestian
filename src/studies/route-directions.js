import { pairedRoute } from './route-paired.js'

// Work in the same artboard as the route strokes. Hidden shared segments
// are split out by pairedRoute, so they never receive floating arrows.
export function routeDirections(route) {
  if(route.pairedDirection)return []
  const arrows=[]
  for(const {points} of pairedRoute({...route,pairedOffset:0})) {
    const distances=[0]
    for(let i=1;i<points.length;i++)distances.push(distances[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]))
    const length=distances.at(-1)
    if(length<50)continue
    const count=Math.max(1,Math.min(5,Math.ceil(length/1800)))
    for(let k=1;k<=count;k++) {
      const target=length*k/(count+1)
      const i=Math.min(points.length-2,Math.max(1,distances.findIndex(d=>d>=target)))
      const [x,y]=points[i],a=points[i-1],b=points[i+1]
      const norm=Math.hypot(b[0]-a[0],b[1]-a[1])
      if(!norm)continue
      const dx=(b[0]-a[0])/norm,dy=(b[1]-a[1])/norm
      const size=Math.min(35,length*.18),wing=size*12/35
      arrows.push(`M${x-dx*size-dy*wing} ${y-dy*size+dx*wing} L${x} ${y} L${x-dx*size+dy*wing} ${y-dy*size-dx*wing}`)
    }
  }
  return arrows
}
