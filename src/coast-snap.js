export function snapToCoast(point,rings){
 const [x,y]=point
 for(const {points,box} of rings){
  if(x<box[0]||x>box[2]||y<box[1]||y>box[3])continue
  let inside=false
  for(let i=0,j=points.length-1;i<points.length;j=i++){
   const a=points[i],b=points[j]
   if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside
  }
  if(inside)return point
 }
 let best=point,distance=Infinity
 for(const {points,box} of rings){
  const dx=Math.max(box[0]-x,0,x-box[2]),dy=Math.max(box[1]-y,0,y-box[3])
  if(dx*dx+dy*dy>distance)continue
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],vx=b[0]-a[0],vy=b[1]-a[1],length=vx*vx+vy*vy
   const t=length?Math.max(0,Math.min(1,((x-a[0])*vx+(y-a[1])*vy)/length)):0
   const q=[a[0]+t*vx,a[1]+t*vy]
   if(q[0]<0||q[0]>2048||q[1]<0||q[1]>1024)continue
   const d=(x-q[0])**2+(y-q[1])**2
   if(d<distance){distance=d;best=q}
  }
 }
 return best
}
