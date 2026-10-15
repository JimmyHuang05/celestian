import {createBlinkFragment,createPortraitMotion,breathingRigGLSL} from './portrait-motion-engine.js'

const vertexSource=`
precision highp float;
attribute vec2 a_uv;
uniform float u_strength;
uniform vec3 u_breathing;
${breathingRigGLSL}
varying vec2 v_uv;

float ramp(float a,float b,float x){return smoothstep(a,b,x);}
float oval(vec2 p,vec2 center,vec2 radius){vec2 d=(p-center)/radius;return exp(-dot(d,d)*2.0);}
vec2 turn(vec2 p,float a){return vec2(cos(a)*p.x-sin(a)*p.y,sin(a)*p.x+cos(a)*p.y);}
float box(vec2 p,vec4 bounds,float feather){return ramp(bounds.x-feather,bounds.x,p.x)*(1.0-ramp(bounds.z,bounds.z+feather,p.x))*ramp(bounds.y-feather,bounds.y,p.y)*(1.0-ramp(bounds.w,bounds.w+feather,p.y));}
float bar(vec2 p,vec2 a,vec2 b,float inner,float outer){vec2 d=b-a;float distance=length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.0,1.0));return 1.0-ramp(inner,outer,distance);}

void main(){
  vec2 uv=a_uv,p=uv*vec2(1086.0,1448.0);
  float breath=u_breathing.x;

  // One parent motion drives the head, crown, shoulders and attached hair.
  // The long locks inherit breathing at full strength, even at their tips;
  // only their very small secondary sway has a delay.
  float head=box(p,vec4(305.0,-15.0,688.0,365.0),12.0);
  float leftFeathers=box(p,vec4(354.0,305.0,473.0,413.0),14.0)*(1.0-ramp(457.0,492.0,p.x));
  float rightFeathers=box(p,vec4(619.0,302.0,683.0,419.0),14.0)*ramp(607.0,630.0,p.x);
  head=max(head,max(leftFeathers,rightFeathers));
  float torso=box(p,vec4(391.0,347.0,742.0,629.0),27.0)*(1.0-ramp(442.0,698.0,p.y));
  float leftEdge=clamp(462.0-.28*(p.y-400.0),260.0,462.0);
  float rightEdge=clamp(693.0+.20*(p.y-600.0),693.0,812.0);
  float leftHair=ramp(338.0,410.0,p.y)*(1.0-ramp(1065.0,1122.0,p.y))*(1.0-ramp(leftEdge-12.0,leftEdge+12.0,p.x));
  float rightHair=ramp(498.0,662.0,p.y)*(1.0-ramp(1102.0,1153.0,p.y))*ramp(rightEdge-15.0,rightEdge+15.0,p.x);
  float hair=max(leftHair,rightHair);
  float parent=max(max(head,torso),hair);
  vec2 breathing=vec2(.28,-.30)*breath;
  vec2 neck=p-vec2(557.0,375.0);
  vec2 shift=breathing*parent+(turn(neck,.0012*breath)-neck)*max(head,hair);

  // The fuller supported volumes have the largest local follow-through.
  // Both cups rise/fall with the torso; only lateral settling has a short lag.
  // the neckline, central ornament and underbust remain attached.
  float chestBreath=breath;
  float chestSway=followBreath(.12);
  float neckline=ramp(433.0,457.0,p.y);
  float leftCup=oval(p,vec2(568.0,480.0),vec2(55.0,48.0))*neckline;
  float rightCup=oval(p,vec2(670.0,480.0),vec2(34.0,44.0))*neckline;
  float bridge=box(p,vec4(614.0,444.0,648.0,540.0),9.0);
  float support=max(bar(p,vec2(526.0,512.0),vec2(600.0,516.0),5.0,12.0),bar(p,vec2(648.0,517.0),vec2(690.0,512.0),5.0,12.0));
  float cupFreedom=1.0-max(bridge,support);
  shift+=vec2(-1.05*chestSway,-6.4*chestBreath)*leftCup*cupFreedom;
  shift+=vec2(.70*chestSway,-5.5*chestBreath)*rightCup*cupFreedom;

  // Coherent arcs around the hair attachments, with less than four source
  // pixels of independent travel at the longest tips (not traveling waves).
  vec2 leftRoot=p-vec2(467.0,347.0),rightRoot=p-vec2(606.0,348.0);
  float leftFree=clamp(length(leftRoot)/850.0,0.0,1.0);
  float rightFree=clamp(length(rightRoot)/850.0,0.0,1.0);
  shift+=(turn(leftRoot,.0038*followBreath(.04+leftFree*.14))-leftRoot)*leftHair;
  shift+=(turn(rightRoot,-.0035*followBreath(.05+rightFree*.14))-rightRoot)*rightHair;
  float leftLock=oval(p,vec2(483.0,343.0),vec2(22.0,32.0))*(1.0-ramp(493.0,507.0,p.x));
  float rightLock=oval(p,vec2(610.0,355.0),vec2(20.0,38.0))*ramp(589.0,605.0,p.x);
  shift+=vec2(-.8,-.25)*followBreath(.08)*leftLock;
  shift+=vec2(.7,-.25)*followBreath(.10)*rightLock;

  // The heavy robe has a quiet settling motion, growing below the waist and
  // tapering back to zero where it rests on the floor. Gold motifs stay intact.
  float freeCloth=ramp(644.0,1240.0,p.y)*(1.0-ramp(1368.0,1440.0,p.y));
  float leftCloth=(1.0-ramp(540.0,594.0,p.x))*freeCloth*(1.0-leftHair);
  float rightCloth=ramp(649.0,711.0,p.x)*freeCloth*(1.0-rightHair);
  shift+=vec2(-2.7,-.85)*followBreath(.08+freeCloth*.12)*leftCloth;
  shift+=vec2(2.2,-.75)*followBreath(.10+freeCloth*.12)*rightCloth;

  // The staff is rigid and its grip cannot slide. Pin its actual shaft and
  // ornament, rather than freezing a rectangle through the surrounding hair.
  float staff=bar(p,vec2(696.0,804.0),vec2(803.0,309.0),13.0,25.0);
  staff=max(staff,box(p,vec4(704.0,-15.0,1008.0,354.0),12.0));
  float grip=bar(p,vec2(778.0,466.0),vec2(768.0,514.0),20.0,32.0);
  float restingHand=box(p,vec4(548.0,565.0,635.0,623.0),12.0);
  float waist=bar(p,vec2(549.0,640.0),vec2(665.0,659.0),15.0,30.0);
  shift*=1.0-max(max(staff,grip),max(restingHand,waist));
  shift*=1.0-ramp(1391.0,1438.0,p.y);

  vec2 moved=uv+shift*u_strength/vec2(1086.0,1448.0);
  moved=(moved-.5)*.94+.5;
  gl_Position=vec4(moved.x*2.0-1.0,1.0-moved.y*2.0,0.0,1.0);
  v_uv=a_uv;
}`

const fragmentSource=createBlinkFragment({
  crop:[430,190,210,190],bounds:[267,318],
  eyes:[
    {center:[522,286],radius:[25,16],slope:.08,range:[503,541],upper:[280,278,278,284],closed:[283,285,287,289],lower:[283,294,294,284]},
    {center:[581,295],radius:[23,17],slope:.24,range:[564,600],upper:[290,288,287.5,298],closed:[292,296,300,303],lower:[292,302,304,300]},
  ],
})

export function createEuphemiaMotion(canvas,imageUrl){
  return createPortraitMotion(canvas,imageUrl,{vertexSource,fragmentSource,closedEyesUrl:'/euphemia-motion/closed-eyes.png',blinkOffset:.85})
}
