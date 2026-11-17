import { curvePoint } from './route-node-geometry.js'

// Offset in the original artboard's metric, not in normalized coordinates.
// Keep one editable route; its return lane follows every subsequent edit.
export function pairedRoute(route) {
  const separation=route.pairedOffset ?? 36
  const runs=[]
  let run=[]
  const flush=()=>{if(run.length>1)runs.push(run);run=[]}
  for(const [i,c] of (route.curves||[]).entries()) {
    if(route.hiddenCurves?.includes(i)){flush();continue}
    const length=c.slice(1).reduce((sum,p,j)=>sum+Math.hypot((p[0]-c[j][0])*21600,(p[1]-c[j][1])*10800),0)
    const n=Math.max(16,Math.ceil(length/6))
    for(let j=run.length?1:0;j<=n;j++)run.push(curvePoint(c,j/n).map((v,k)=>v*(k?10800:21600)))
  }
  flush()
  return runs.map(points=>{
    const shifted=points.map((p,i)=>{
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)]
      const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1
      return [p[0]-dy/length*separation,p[1]+dx/length*separation]
    })
    const path=p=>p.map((v,i)=>`${i?'L':'M'}${v.join(' ')}`).join(' ')
    const arrow=(p,f,reverse)=>{
      const i=Math.min(p.length-2,Math.max(1,Math.round((p.length-1)*f)))
      const [x,y]=p[i],a=p[i-1],b=p[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1])||1
      const dx=(b[0]-a[0])/length*reverse,dy=(b[1]-a[1])/length*reverse
      return `M${x-dx*35-dy*12} ${y-dy*35+dx*12} L${x} ${y} L${x-dx*35+dy*12} ${y-dy*35-dx*12}`
    }
    return {points:shifted,d:path(shifted),arrows:[arrow(points,.42,1),arrow(shifted,.58,-1)]}
  })
}
