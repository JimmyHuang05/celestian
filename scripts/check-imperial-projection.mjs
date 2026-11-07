import test from 'node:test';
import assert from 'node:assert/strict';
import {flags} from '../src/imperial-banner-artwork.js';
import {hallFlagCalibration as hallCalibration} from '../src/imperial-hall-calibration.js';
import {project,panelGeometry} from '../src/imperial-perspective-geometry.js';
import {bannerProjection,projectionCSS,CLOTH_LEFT,CLOTH_RIGHT,CLOTH_TOP,PIN_U,PIN_V,RIGGING_END} from '../src/imperial-hall-projection.js';

const near=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-7,`${label}: ${a} != ${b}`);
const pair=(a,b,label)=>a.forEach((v,i)=>near(v,b[i],label));
for(const arch of hallCalibration){
 const flag=flags.find(f=>f.id===arch.id);
 const p=bannerProjection(arch,flag.artworkHeight/flag.artworkWidth);
 const toHall=point=>[p.bounds.x+point[0]*p.bounds.width,p.bounds.y+point[1]*p.bounds.height];
 test(`${arch.id}: approved pin and study cloth registration`,()=>{
  pair(toHall(project(p.rigging,PIN_U,PIN_V)),arch.pin,'suspension pin');
  const square=panelGeometry(arch);
  pair(toHall(project(p.body,CLOTH_LEFT,CLOTH_TOP)),square.corners[0],'cloth upper left');
  pair(toHall(project(p.body,CLOTH_RIGHT,CLOTH_TOP)),square.corners[1],'cloth upper right');
  // The square occupies one cloth-width down the original uncut illustration.
  const squareBottom=CLOTH_TOP+(CLOTH_RIGHT-CLOTH_LEFT)*flag.artworkWidth/flag.artworkHeight;
  pair(toHall(project(p.body,CLOTH_LEFT,squareBottom)),square.corners[3],'square aspect');
 });
 test(`${arch.id}: no rigging seam, clipped corners, or bent wall lines`,()=>{
  for(const u of [0,.25,.5,.75,1]){
   pair(project(p.body,u,RIGGING_END),project(p.rigging,u,RIGGING_END),'continuous seam');
   const [a,b,c]=[.109,.5,1].map(v=>project(p.body,u,v));
   near((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),0,'straight cloth edge');
   for(const v of [0,.013,RIGGING_END,.5,1]){
    const point=project(v<RIGGING_END?p.rigging:p.body,u,v);
    assert.ok(point.every(n=>Number.isFinite(n)&&n>=-1e-8&&n<=1+1e-8),'artwork stays inside its viewport');
   }
  }
 });
 test(`${arch.id}: static CSS and shader use the same responsive projection`,()=>{
  for(const scale of [.36,.62,1.1])for(const m of [p.body,p.rigging]){
   const w=p.bounds.width*scale,h=p.bounds.height*scale;
   const css=projectionCSS(m,w,h).slice(9,-1).split(',').map(Number);
   for(const [u,v] of [[.5,.013],[.09,.109],[.91,1]]){
    const x=u*w,y=v*h,denom=css[3]*x+css[7]*y+css[15];
    pair([(css[0]*x+css[4]*y+css[12])/denom/w,(css[1]*x+css[5]*y+css[13])/denom/h],project(m,u,v),'CSS projection');
   }
  }
 });
}
