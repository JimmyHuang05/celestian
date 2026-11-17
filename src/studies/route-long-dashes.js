import { pairedRoute } from './route-paired.js'

// Arrowheads terminate actual ink segments, never float in a dash gap.
// All dimensions use the original 21600-wide map artboard.
export function routeJunctions(routes) {
  const nodes=new Map()
  for(const r of routes)for(const [i,id] of (r.nodeIds||[]).entries()){
    if(!id.startsWith('junction-')||!r.points[i])continue
    const entry=nodes.get(id)||{routes:new Set(),point:r.points[i]}
    entry.routes.add(r.id);nodes.set(id,entry)
  }
  return [...nodes.values()].filter(n=>n.routes.size>1).map(n=>[n.point[0]*21600,n.point[1]*10800])
}

export function longDashRoute(route,junctions=[]) {
  const nearJunction=(p,radius)=>junctions.some(q=>{
    const dx=Math.abs(p[0]-q[0])%21600
    return Math.hypot(Math.min(dx,21600-dx),p[1]-q[1])<radius
  })
  const runs=pairedRoute({...route,pairedOffset:0}).map(l=>l.points)
  const marks=[]
  for(const points of runs){
    const distances=[0]
    for(let i=1;i<points.length;i++)distances.push(distances[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]))
    const length=distances.at(-1)
    if(length<1)continue
    const at=s=>{
      let i=distances.findIndex(d=>d>=s);if(i<=0)return points[i<0?points.length-1:0]
      const t=(s-distances[i-1])/(distances[i]-distances[i-1]||1)
      return points[i].map((v,k)=>points[i-1][k]+(v-points[i-1][k])*t)
    }
    const count=Math.max(1,Math.round(length/420)),gap=count>1?50:0
    const dash=(length-gap*(count-1))/count
    for(let j=0;j<count;j++){
      const start=j*(dash+gap),end=Math.min(length,start+dash)
      let lineEnd=end
      let arrow=null
      const edge=(s,width,side)=>{
        const p=at(s),a=at(Math.max(start,s-3)),b=at(Math.min(end,s+3))
        const dx=b[0]-a[0],dy=b[1]-a[1],norm=Math.hypot(dx,dy)||1
        return [p[0]-dy/norm*width*side,p[1]+dx/norm*width*side]
      }
      if(end-start>=90&&(j%3===0||j===count-1)&&!nearJunction(at(end),240)){
        const size=route.pairedDirection?54:72,wing=route.pairedDirection?9:14,base=end-size
        // Follow the curve with a slender, recessed-tail nib. Stop the 14-unit
        // shaft inside the head: extending it to the tip makes a blunt square.
        const left=[],right=[]
        for(let k=0;k<=8;k++){
          const t=k/8,s=base+size*t,width=wing*(1-t)
          left.push(edge(s,width,1));right.push(edge(s,width,-1))
        }
        const notch=at(base+size*.28)
        const outline=[...left,...right.reverse().slice(1),notch]
        arrow=outline.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' ')+' Z'
        lineEnd=base+size*.48
        if(route.pairedDirection){
          // Aligned paired dashes with outward-facing half-arrowheads.
          // Each shaft is 2/3 of the ordinary 14-unit line; the gap is 6.
          const half=reverse=>{
            const span=end-start,head=Math.min(72,span*.4),side=reverse?1:-1
            const sample=(d,w)=>edge(reverse?end-d:start+d,w,side)
            const outer=Array.from({length:33},(_,k)=>sample((span-head)*k/32,3+14*2/3))
            outer.push(sample(span-head,24))
            for(let k=1;k<=12;k++)outer.push(sample(span-head+head*k/12,3+21*(1-k/12)))
            const inner=Array.from({length:33},(_,k)=>sample(span*(1-k/32),3))
            return [...outer,...inner].map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' ')+' Z'
          }
          arrow=half(false)+' '+half(true)
        }
      }
      const p=[at(start),...points.filter((_,i)=>distances[i]>start&&distances[i]<lineEnd),at(lineEnd)]
      let d=p.map((v,i)=>`${i?'L':'M'}${v.join(' ')}`).join(' ')
      if(route.pairedDirection){
        d=arrow?'':[-1,1].map(side=>Array.from({length:33},(_,k)=>edge(start+(end-start)*k/32,3+14/3,side)).map((v,i)=>`${i?'L':'M'}${v.join(' ')}`).join(' ')).join(' ')
      }
      marks.push({d,arrow})
      // Bridge only the dash gap at a junction, preserving the exact curve.
      if(j<count-1){
        const gapEnd=end+gap
        if(nearJunction(at(end),120)||nearJunction(at(gapEnd),120)){
          const bridge=[at(end),...points.filter((_,i)=>distances[i]>end&&distances[i]<gapEnd),at(gapEnd)]
          if(!route.pairedDirection)marks.push({d:bridge.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),arrow:null})
        }
      }
    }
  }
  return marks
}
