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
  vec2 p=a_uv*vec2(1106.0,1422.0);
  float breath=u_breathing.x;
  float body=1.0-smoothstep(750.0,1300.0,p.y);
  // The roots and torso share one breath, including long hair below the waist.
  float parent=mix(body,1.0,a_hairCover);
  vec2 shift=vec2(.14,-.46)*breath*parent;
  shift+=a_hairCos*breath+a_hairSin*sin(u_breathPhase);
  // One attachment drives the pinching hand and adjoining fabric.
  float grip=oval(p,vec2(318.0,565.0),vec2(87.0,42.0));
  float skirt=oval(p,vec2(486.0,699.0),vec2(208.0,132.0));
  shift.y-=.65*breath*grip;
  shift+=vec2(.25,-.35)*followBreath(.07)*skirt*(1.0-a_hairCover);
  float chest=oval(p,vec2(642.0,408.0),vec2(65.0,43.0));
  shift.y-=.90*breath*chest;
  vec2 moved=a_uv+shift*u_strength/vec2(1106.0,1422.0);
  moved=(moved-.5)*.94+.5;
  gl_Position=vec4(moved.x*2.0-1.0,1.0-moved.y*2.0,0.0,1.0);
  v_uv=a_uv;
}`
const fragmentSource=createBlinkFragment({
  size:[1106,1422],crop:[470,170,240,180],bounds:[218,277],
  eyes:[
    {center:[566,254],radius:[25,18],slope:-.23,range:[544,590],upper:[251,244,244,249],closed:[258,256,253,250],lower:[254,264,262,250]},
    {center:[625,240],radius:[25,18],slope:-.20,range:[603,648],upper:[239,230,229,234],closed:[244,242,240,236],lower:[242,251,247,236]},
  ],
})
export function createIsabellaMotion(canvas,imageUrl){
  canvas.dataset.hairStrands=String(isabellaHairStrands.length)
  return createPortraitMotion(canvas,imageUrl,{
    vertexSource,fragmentSource,
    closedEyesUrl:'/isabella-motion/closed-eyes-reference-v1.webp',blinkOffset:.4,
    mesh:{columns:220,rows:286,vertexData:isabellaHairVertex,attributes:[
      {name:'a_hairCos',size:2},{name:'a_hairSin',size:2},{name:'a_hairCover',size:1},
    ]},
  })
}
