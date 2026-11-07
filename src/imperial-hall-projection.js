import { homography, project } from './imperial-perspective-geometry.js';

// The study square represents the cloth, not the transparent margins, finials,
// or suspension cord. These landmarks are shared by the approved illustrations.
export const CLOTH_LEFT=.09, CLOTH_RIGHT=.91, CLOTH_TOP=.109;
export const PIN_U=.5, PIN_V=.013, RIGGING_END=.082;

function multiply(a,b){
  return Array.from({length:9},(_,i)=>{
    const r=Math.floor(i/3),c=i%3;
    return a[r*3]*b[c]+a[r*3+1]*b[3+c]+a[r*3+2]*b[6+c];
  });
}
function normalize(m){return m.map(v=>v/m[8]);}
function inBounds(m,{x,y,width,height}){
  return multiply([1/width,0,-x/width,0,1/height,-y/height,0,0,1],m);
}
export function bannerProjection(arch,imageAspect){
  const wall=homography(arch.wall);
  const scaleX=arch.panel.size/(CLOTH_RIGHT-CLOTH_LEFT);
  const scaleY=scaleX*arch.wallAspect*imageAspect;
  const local=[scaleX,0,arch.panel.center-.5*scaleX,0,scaleY,arch.panel.top-CLOTH_TOP*scaleY,0,0,1];
  const body=normalize(multiply(wall,local));
  const paintedPin=project(body,PIN_U,PIN_V);
  const delta=arch.pin.map((v,i)=>v-paintedPin[i]);
  const pinWeight=(body[6]*PIN_U+body[7]*PIN_V+1)/(RIGGING_END-PIN_V);
  // A second homography stretches only the suspension above the rod. Both
  // transforms meet exactly at RIGGING_END and keep straight cords straight.
  const rigging=[...body];
  rigging[1]-=delta[0]*pinWeight;rigging[2]+=delta[0]*pinWeight*RIGGING_END;
  rigging[4]-=delta[1]*pinWeight;rigging[5]+=delta[1]*pinWeight*RIGGING_END;
  const contour=[...[[0,RIGGING_END],[1,RIGGING_END],[1,1],[0,1]].map(p=>project(body,...p)),
    ...[[0,0],[1,0]].map(p=>project(rigging,...p))];
  const x=Math.floor(Math.min(...contour.map(p=>p[0]))),y=Math.floor(Math.min(...contour.map(p=>p[1])));
  const width=Math.ceil(Math.max(...contour.map(p=>p[0])))-x;
  const height=Math.ceil(Math.max(...contour.map(p=>p[1])))-y;
  const bounds={x,y,width,height};
  return {body:inBounds(body,bounds),rigging:inBounds(rigging,bounds),bounds};
}

// Equivalent CSS projection for the full-resolution static artwork while
// WebGL initializes or when it is unavailable. Width/height are CSS pixels.
export function projectionCSS(m,width,height){
  const [a,b,c,d,e,f,g,h]=m;
  return `matrix3d(${[a,d*height/width,0,g/width,b*width/height,e,0,h/height,0,0,1,0,c*width,f*height,0,1].join(',')})`;
}
