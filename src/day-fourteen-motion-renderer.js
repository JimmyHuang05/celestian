import {createBlinkFragment,createPortraitMotion,breathingRigGLSL} from './portrait-motion-engine.js'

const vertexSource=`
precision highp float;
attribute vec2 a_uv;
uniform float u_strength;
uniform vec3 u_breathing;
${breathingRigGLSL}
varying vec2 v_uv;
float ramp(float a,float b,float x){return smoothstep(a,b,x);}
float oval(vec2 p,vec2 c,vec2 r){vec2 d=(p-c)/r;return exp(-dot(d,d)*2.0);}
vec2 turn(vec2 p,float a){return vec2(cos(a)*p.x-sin(a)*p.y,sin(a)*p.x+cos(a)*p.y);}
float box(vec2 p,vec4 b,float f){return ramp(b.x-f,b.x,p.x)*(1.0-ramp(b.z,b.z+f,p.x))*ramp(b.y-f,b.y,p.y)*(1.0-ramp(b.w,b.w+f,p.y));}
float bar(vec2 p,vec2 a,vec2 b,float inside,float outside){vec2 d=b-a;return 1.0-ramp(inside,outside,length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.0,1.0)));}
void main(){
  vec2 uv=a_uv,p=uv*vec2(1086.0,1448.0);
  float breath=u_breathing.x;
  float head=box(p,vec4(515.0,-10.0,744.0,322.0),18.0);
  float torso=box(p,vec4(510.0,304.0,773.0,584.0),24.0)*(1.0-ramp(382.0,595.0,p.y));
  float hairEdge=clamp(591.0-.45*(p.y-276.0),355.0,591.0);
  float hair=ramp(170.0,243.0,p.y)*(1.0-ramp(685.0,753.0,p.y))*(1.0-ramp(hairEdge-14.0,hairEdge+14.0,p.x));
  // Hair, head and crown share the very small resting breath. The local
  // fabric response below stays separate from the planted lower body.
  vec2 neck=p-vec2(653.0,302.0);
  vec2 shift=vec2(.18,-.25)*breath*max(max(head,torso),hair);
  shift+=(turn(neck,.0008*breath)-neck)*max(head,hair);
  // This is fitted fabric, not a rigid chest plate. Follow the breath as
  // a soft supported volume, slightly less freely than Elowen's bodice.
  // Preserve the upper seam, shoulder attachment and fitted waist.
  float chestFollow=breath;
  float chestSway=.55*breath+.45*u_breathing.z;
  float chestSupport=ramp(350.0,378.0,p.y)*(1.0-ramp(425.0,461.0,p.y));
  float nearCup=oval(p,vec2(716.0,402.0),vec2(46.0,47.0))*chestSupport;
  float farCup=oval(p,vec2(662.0,391.0),vec2(31.0,41.0))*chestSupport;
  shift+=vec2(.72*chestSway,-4.1*chestFollow)*nearCup;
  shift+=vec2(-.48*chestSway,-3.4*chestFollow)*farCup;
  vec2 root=p-vec2(601.0,224.0);
  float freeHair=clamp(length(root)/720.0,0.0,1.0);
  shift+=(turn(root,.0045*followBreath(.04+freeHair*.14))-root)*hair;
  // Side locks pivot from the temples; their tips move more than the roots.
  // Taper along the jaw so the eyes, cheeks and collar keep their shape.
  float leftLock=max(bar(p,vec2(590.0,211.0),vec2(592.0,246.0),11.0,21.0),bar(p,vec2(592.0,246.0),vec2(608.0,278.0),10.0,20.0));
  float rightLock=max(bar(p,vec2(714.0,210.0),vec2(705.0,246.0),13.0,23.0),bar(p,vec2(705.0,246.0),vec2(689.0,279.0),11.0,21.0));
  float lockFree=ramp(210.0,266.0,p.y)*(1.0-ramp(284.0,306.0,p.y));
  float leftJaw=598.0+max(p.y-220.0,0.0)*.68;
  float rightJaw=702.0-max(p.y-220.0,0.0)*.90;
  leftLock*=lockFree*(1.0-ramp(leftJaw,leftJaw+10.0,p.x));
  rightLock*=lockFree*ramp(rightJaw-2.0,rightJaw+9.0,p.x);
  vec2 leftTemple=p-vec2(590.0,205.0),rightTemple=p-vec2(715.0,203.0);
  float leftFollow=followBreath(.08),rightFollow=followBreath(.10);
  shift+=(turn(leftTemple,.026*leftFollow)-leftTemple+vec2(0.0,-.55*leftFollow))*leftLock;
  shift+=(turn(rightTemple,.024*rightFollow)-rightTemple+vec2(0.0,-.55*rightFollow))*rightLock;

  float lower=ramp(534.0,1000.0,p.y);
  float leftCoat=(1.0-ramp(535.0,588.0,p.x))*lower*(1.0-hair);
  float rightCoat=ramp(723.0,778.0,p.x)*lower;
  shift+=vec2(-3.2,-1.3)*followBreath(.06+lower*.14)*leftCoat;
  shift+=vec2(2.5,-1.0)*followBreath(.08+lower*.14)*rightCoat;

  // Follow weapon silhouettes instead of freezing a rectangle through hair.
  float sword=bar(p,vec2(340.0,642.0),vec2(12.0,1114.0),21.0,37.0);
  float leftArm=max(bar(p,vec2(505.0,414.0),vec2(416.0,539.0),26.0,43.0),bar(p,vec2(416.0,539.0),vec2(339.0,642.0),27.0,43.0));
  float shieldEdge=clamp(778.0+(p.y-350.0)*.18,778.0,963.0);
  float shield=ramp(shieldEdge-10.0,shieldEdge+10.0,p.x)*ramp(292.0,326.0,p.y);
  float rightArm=bar(p,vec2(767.0,498.0),vec2(834.0,720.0),24.0,42.0);
  float rightSword=bar(p,vec2(837.0,724.0),vec2(1075.0,914.0),17.0,29.0);
  float legs=ramp(518.0,550.0,p.x)*(1.0-ramp(752.0,782.0,p.x))*ramp(631.0,700.0,p.y);
  float rigid=max(max(sword,leftArm),max(max(shield,rightArm),max(rightSword,legs)));
  shift*=1.0-rigid;
  vec2 moved=uv+shift*u_strength/vec2(1086.0,1448.0);
  moved=(moved-.5)*.94+.5;
  gl_Position=vec4(moved.x*2.0-1.0,1.0-moved.y*2.0,0.0,1.0);
  v_uv=a_uv;
}`

const fragmentSource=createBlinkFragment({
  crop:[559,137,200,180],bounds:[198,238],
  eyes:[
    {center:[625,217],radius:[25,15],slope:.06,range:[606,645],upper:[213,210.5,211.2,217],closed:[215,218,218,217],lower:[216,225,225,218]},
    {center:[686,216],radius:[22,15],slope:-.10,range:[668,703],upper:[217,210.5,209,215],closed:[219,218,216.5,213],lower:[219,225,223,216]},
  ],
})
export function createDayFourteenMotion(canvas,imageUrl){
  return createPortraitMotion(canvas,imageUrl,{vertexSource,fragmentSource,closedEyesUrl:'/day-fourteen-motion/closed-eyes-v2.webp',blinkOffset:.25})
}
