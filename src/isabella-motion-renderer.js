import {createBlinkFragment,createPortraitMotion,breathingRigGLSL} from './portrait-motion-engine.js'
import {isabellaHairVertex,isabellaHairStrands} from './isabella-hair-rig.js'

const vertexSource=`
precision highp float;
attribute vec2 a_uv;
attribute vec2 a_hairCos;
attribute vec2 a_hairSin;
attribute float a_hairCover;
uniform float u_strength;
uniform vec3 u_breathing;
${breathingRigGLSL}
varying vec2 v_uv;
float oval(vec2 p,vec2 c,vec2 r){vec2 d=(p-c)/r;return exp(-dot(d,d)*2.0);}
void main(){
  vec2 p=a_uv*vec2(896.0,1152.0);
  float breath=u_breathing.x;
  float body=1.0-smoothstep(610.0,1060.0,p.y);
  // The roots and torso share one breath, including long hair below the waist.
  float parent=mix(body,1.0,a_hairCover);
  vec2 shift=vec2(.14,-.38)*breath*parent;
  shift+=a_hairCos*breath+a_hairSin*sin(u_breathPhase);
  // One attachment drives the pinching hand and adjoining fabric.
  float grip=oval(p,vec2(278.0,470.0),vec2(83.0,44.0));
  float skirt=oval(p,vec2(408.0,563.0),vec2(174.0,110.0));
  shift.y-=.65*breath*grip;
  shift+=vec2(.25,-.35)*followBreath(.07)*skirt*(1.0-a_hairCover);
  float chest=oval(p,vec2(523.0,355.0),vec2(54.0,40.0));
  shift.y-=.65*breath*chest;
  vec2 moved=a_uv+shift*u_strength/vec2(896.0,1152.0);
  moved=(moved-.5)*.94+.5;
  gl_Position=vec4(moved.x*2.0-1.0,1.0-moved.y*2.0,0.0,1.0);
  v_uv=a_uv;
}`
const fragmentSource=createBlinkFragment({
  size:[1106,1422],crop:[532,248,144,76],bounds:[262,313],
  eyes:[
    {center:[569,292],radius:[24,19],slope:-.25,range:[551,588],upper:[293,281,282,288],closed:[298,300,296,290],lower:[296,305,303,290]},
    {center:[630,279],radius:[25,19],slope:-.18,range:[610,652],upper:[281,270,270,276],closed:[283,287,284,278],lower:[284,295,291,279]},
  ],
})
export function createIsabellaMotion(canvas,imageUrl){
  canvas.dataset.hairStrands=String(isabellaHairStrands.length)
  return createPortraitMotion(canvas,imageUrl,{
    vertexSource,fragmentSource,
    closedEyesUrl:'/character-profile/redraws/isabella-a-closed-eyes-v2.webp',blinkOffset:.4,
    mesh:{columns:220,rows:286,vertexData:isabellaHairVertex,attributes:[
      {name:'a_hairCos',size:2},{name:'a_hairSin',size:2},{name:'a_hairCover',size:1},
    ]},
  })
}
