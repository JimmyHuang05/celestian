import {createBlinkFragment,createPortraitMotion,breathingRigGLSL} from './portrait-motion-engine.js'

const vertexSource=`
precision highp float;
attribute vec2 a_uv;
uniform float u_phase;
uniform float u_strength;
uniform vec3 u_breathing;
${breathingRigGLSL}
varying vec2 v_uv;

float oval(vec2 p, vec2 center, vec2 radius) {
  vec2 d=(p-center)/radius;
  return exp(-dot(d,d)*2.0);
}
float ramp(float a,float b,float x) {return smoothstep(a,b,x);}
vec2 turn(vec2 v,float angle) {
  float s=sin(angle), c=cos(angle);
  return vec2(c*v.x-s*v.y,s*v.x+c*v.y);
}
void main() {
  vec2 uv=a_uv;
  vec2 pixels=uv*vec2(1086.0,1448.0);
  vec2 shift=vec2(0.0);
  float t=u_phase;
  float breath=u_breathing.x;
  float chestFollow=breath;
  float fabricFollow=u_breathing.z;
  float drift=breath;
  float leftHair=oval(uv,vec2(.20,.265),vec2(.26,.16))*(1.0-ramp(.315,.415,uv.x));
  float hairTip=oval(uv,vec2(.205,.365),vec2(.16,.065));
  float attachedHair=max(clamp(leftHair*4.0,0.0,1.0),clamp(hairTip*3.0,0.0,1.0));

  // Quiet standing breath: almost no whole-body lift. The hand and crow still
  // share that small displacement so their contact point cannot drift apart.
  float upper=1.0-ramp(.32,.59,uv.y);
  shift+=vec2(.45*drift,-.35*breath)*max(upper,attachedHair);

  // Local supported volumes rise/fall with the breath; lateral settling lags.
  // Keep the neckline and underbust anchored instead of lifting the shoulders.
  float support=ramp(321.0,349.0,pixels.y)*(1.0-ramp(400.0,432.0,pixels.y));
  float leftCup=oval(pixels,vec2(557.0,377.0),vec2(58.0,47.0))*support;
  float rightCup=oval(pixels,vec2(644.0,370.0),vec2(38.0,43.0))*support;
  float chestSway=.55*breath+.45*fabricFollow;
  shift+=vec2(-.85*chestSway,-4.6*chestFollow)*leftCup;
  shift+=vec2(.60*chestSway,-3.9*chestFollow)*rightCup;
  float ribs=oval(uv,vec2(.525,.300),vec2(.10,.075));
  shift.x+=(uv.x-.525)*1086.0*.003*breath*ribs;
  float collar=oval(uv,vec2(.514,.202),vec2(.105,.036));
  shift.y-=.16*breath*collar;
  float fabric=oval(uv,vec2(.560,.286),vec2(.102,.080));
  shift.y-=.4*(fabricFollow-breath)*fabric;
  float sleeve=oval(uv,vec2(.388,.332),vec2(.095,.093));
  shift+=vec2(.16,-.22)*fabricFollow*sleeve;

  // A tiny rigid head tilt around the base of the neck, blended outside the face.
  float head=(1.0-ramp(.19,.235,uv.y))*ramp(.30,.365,uv.x)*(1.0-ramp(.60,.66,uv.x));
  vec2 neck=pixels-vec2(545.0,310.0);
  shift+=(turn(neck,.0012*breath)-neck)*max(head,attachedHair);

  // Broad hair loops on the left. Increasing lag towards their ends keeps the
  // roots anchored and the motion soft, rather than moving the entire portrait.
  float hairFree=clamp((.40-uv.x)*2.0+(uv.y-.19),0.0,1.0);
  float hairFollow=followBreath(.04+hairFree*.14);
  shift+=vec2(-6.0,-3.0)*hairFollow*leftHair;
  shift+=vec2(-3.0,-1.5)*followBreath(.18)*hairTip;

  // Short face-framing locks and the blue hair ribbons, with the eyes untouched.
  float leftLock=oval(uv,vec2(.345,.151),vec2(.067,.05));
  float rightLock=oval(uv,vec2(.600,.165),vec2(.05,.045));
  shift+=vec2(-2.4,-1.2)*followBreath(.08)*leftLock;
  shift+=vec2(2.0,-1.0)*followBreath(.10)*rightLock;

  // The long ribbon beside the lowered hand moves mostly at its free left end.
  float ribbon=oval(uv,vec2(.153,.445),vec2(.14,.085))*(1.0-ramp(.22,.29,uv.x));
  shift+=vec2(-5.0,-3.0)*followBreath(.17)*ribbon;

  // Trailing cape: the attached waist stays still; movement grows down the tip.
  float cloak=oval(uv,vec2(.255,.64),vec2(.20,.30))*(1.0-ramp(.37,.46,uv.x))*ramp(.46,.61,uv.y);
  float clothFollow=followBreath(.08+clamp((uv.y-.45)*2.0,0.0,1.0)*.14);
  shift+=vec2(-10.0,-3.0)*clothFollow*cloak;
  float tip=oval(uv,vec2(.15,.795),vec2(.13,.13));
  shift+=vec2(-4.0,-2.0)*followBreath(.22)*tip;

  // Skirt edges only: no deformation along the thighs or calves.
  float rightHem=oval(uv,vec2(.745,.51),vec2(.12,.12));
  float leftHem=oval(uv,vec2(.39,.49),vec2(.075,.06));
  shift+=vec2(4.0,-2.4)*followBreath(.12)*rightHem;
  shift+=vec2(-2.2,-1.8)*followBreath(.10)*leftHem;

  // A perched wingbeat: rotate the extended wing from its shoulder, then let
  // the outer primaries flex a little later. Restrict it above the body so the
  // beak, tail, claws and the supporting fingers keep their original contact.
  float flap=sin(t*3.0)+.13*sin(t*6.0-.35);
  float wing=ramp(.757,.805,uv.x)*(1.0-ramp(.112,.157,uv.y));
  vec2 shoulder=pixels-vec2(833.0,181.0);
  vec2 wingTurn=turn(shoulder,.105*flap)-shoulder;
  float feather=ramp(.82,.97,uv.x)*(1.0-ramp(.095,.135,uv.y));
  vec2 featherLag=vec2(2.8,-4.2)*(sin(t*3.0-.55)-sin(t*3.0))*feather;
  shift+=wingTurn*wing+featherLag;

  // The smaller rear wing opens in the opposite direction, with a short lag.
  float backWing=ramp(.693,.713,uv.x)*(1.0-ramp(.758,.780,uv.x))*(1.0-ramp(.083,.110,uv.y));
  vec2 backShoulder=pixels-vec2(809.0,160.0);
  float backFlap=sin(t*3.0-.22)+.13*sin(t*6.0-.79);
  shift+=(turn(backShoulder,-.13*backFlap)-backShoulder)*backWing;

  // Hard zero in the lower-leg region prevents even distant soft weights from
  // introducing a subpixel crawl along the shoes and stocking outlines.
  float planted=ramp(.34,.40,uv.x)*(1.0-ramp(.62,.68,uv.x))*ramp(.60,.75,uv.y);
  shift*=1.0-planted;

  vec2 moved=uv+shift*u_strength/vec2(1086.0,1448.0);
  moved=(moved-.5)*.94+.5;
  gl_Position=vec4(moved.x*2.0-1.0,1.0-moved.y*2.0,0.0,1.0);
  v_uv=a_uv;
}`
const fragmentSource=createBlinkFragment({
  crop:[440,91,210,170],
  bounds:[140,198],
  eyes:[
    {center:[527.5,162],radius:[29,17],slope:.09,range:[503,552],upper:[159,155.8,156.2,165],closed:[159.5,164,165,167],lower:[160,170,171,165]},
    {center:[588,175],radius:[25,18],slope:.26,range:[568,608],upper:[170,167.2,169.6,180],closed:[173,176,180,183],lower:[173,182.5,185,182]},
  ],
})
export function createElowenMotion(canvas,imageUrl){
  return createPortraitMotion(canvas,imageUrl,{vertexSource,fragmentSource,closedEyesUrl:'/elowen-motion/closed-eyes-v2.webp'})
}
