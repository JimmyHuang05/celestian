import {createBlinkFragment,createPortraitMotion,breathingRigGLSL} from './portrait-motion-engine.js'

const vertexSource=`
precision highp float;
attribute vec2 a_uv;
uniform float u_strength;
uniform vec3 u_breathing;
${breathingRigGLSL}
uniform float u_layer;
varying vec2 v_uv;
float ramp(float a,float b,float x){return smoothstep(a,b,x);}
float oval(vec2 p,vec2 center,vec2 radius){vec2 d=(p-center)/radius;return exp(-dot(d,d)*2.0);}
vec2 turn(vec2 p,float a){return vec2(cos(a)*p.x-sin(a)*p.y,sin(a)*p.x+cos(a)*p.y);}
float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.0,1.0));}
float bar(vec2 p,vec2 a,vec2 b,float inner,float outer){return 1.0-ramp(inner,outer,segment(p,a,b));}
float box(vec2 p,vec4 bounds,float feather){return ramp(bounds.x-feather,bounds.x,p.x)*(1.0-ramp(bounds.z,bounds.z+feather,p.x))*ramp(bounds.y-feather,bounds.y,p.y)*(1.0-ramp(bounds.w,bounds.w+feather,p.y));}
void main(){
  vec2 uv=a_uv,p=uv*vec2(1086.0,1448.0),shift=vec2(0.0);
  float breath=u_breathing.x;

  // A knight at rest: the breastplate translates as a rigid piece, without
  // expanding the metal. Motion fades out before the clasped gauntlets.
  float upper=box(p,vec4(424.0,110.0,624.0,392.0),37.0);
  float head=oval(uv,vec2(.486,.159),vec2(.115,.10));
  vec2 neck=p-vec2(530.0,316.0);
  float breastplate=box(p,vec4(434.0,344.0,612.0,405.0),17.0)*(1.0-ramp(391.0,424.0,p.y));
  float plateSway=.65*breath+.35*u_breathing.z;
  vec2 plateRoot=p-vec2(528.0,331.0);
  shift+=(vec2(.20*plateSway,-1.65*u_breathing.y)+(turn(plateRoot,.0020*plateSway)-plateRoot))*breastplate;

  // Each long lock follows one quiet pendulum arc. A short, continuous delay
  // toward the tips avoids making different sections ripple like rubber.
  float leftHair=oval(uv,vec2(.218,.368),vec2(.27,.17))*(1.0-ramp(.32,.395,uv.x));
  vec2 leftRoot=p-vec2(447.0,424.0);
  float hairLag=.04+clamp(length(leftRoot)/620.0,0.0,1.0)*.14;
  shift+=(turn(leftRoot,.010*followBreath(hairLag))-leftRoot)*leftHair;
  float pony=ramp(.575,.72,uv.x)*ramp(.105,.24,uv.y)*(1.0-ramp(.46,.515,uv.y));
  vec2 ponyRoot=p-vec2(602.0,183.0);
  float ponyLag=.05+clamp(length(ponyRoot)/720.0,0.0,1.0)*.14;
  shift+=(turn(ponyRoot,-.007*followBreath(ponyLag))-ponyRoot)*pony;

  // Long hair is attached to the head, not to the canvas. Inherit its exact
  // breathing translation and tilt first, then add the small local tip sway.
  // A union prevents double motion where the head and hair masks overlap.
  float attachedHair=max(clamp(leftHair*4.0,0.0,1.0),clamp(pony*3.0,0.0,1.0));
  // Resting breath barely raises the head/shoulders; hair inherits the same
  // reduced movement rather than retaining a separate, stronger breath.
  shift+=vec2(.5,-.30)*breath*max(upper,attachedHair);
  shift+=(turn(neck,.0025*breath)-neck)*max(head,attachedHair);
  float fringe=oval(uv,vec2(.416,.176),vec2(.028,.045));
  shift+=vec2(-.6,-.35)*followBreath(.06)*fringe;
  // Face-framing tips move below the jaw; the eyes, cheeks and crown stay put.
  float faceTips=ramp(250.0,290.0,p.y)*(1.0-ramp(322.0,344.0,p.y));
  float leftLock=oval(p,vec2(467.0,301.0),vec2(28.0,40.0))*(1.0-ramp(480.0,494.0,p.x))*faceTips;
  float rightLock=oval(p,vec2(590.0,301.0),vec2(27.0,40.0))*ramp(573.0,585.0,p.x)*faceTips;
  shift+=vec2(-2.0,-.65)*followBreath(.09)*leftLock;
  shift+=vec2(1.8,-.60)*followBreath(.10)*rightLock;

  // Cloth is clamped under the hip plates. Its freedom grows with distance
  // from each attachment, with only a short breath-following delay at the hem.
  float leftPanel=ramp(.47,.57,uv.y)*(1.0-ramp(.455,.49,uv.x))*(1.0-ramp(.84,.91,uv.y));
  float rightPanel=ramp(.49,.60,uv.y)*ramp(.53,.58,uv.x)*(1.0-ramp(.88,.94,uv.y));
  float leftFree=clamp(length((p-vec2(367.0,686.0))/vec2(385.0,530.0)),0.0,1.0);
  float rightFree=clamp(length((p-vec2(717.0,737.0))/vec2(355.0,510.0)),0.0,1.0);
  float leftFollow=followBreath(.06+leftFree*.14);
  float rightFollow=followBreath(.08+rightFree*.14);
  shift+=vec2(-9.0,-3.5)*leftFollow*leftPanel*leftFree;
  shift+=vec2(8.0,-3.5)*rightFollow*rightPanel*rightFree;
  float leftRibbon=oval(uv,vec2(.13,.50),vec2(.15,.027))*(1.0-ramp(.25,.32,uv.x));
  float rightRibbon=oval(uv,vec2(.91,.577),vec2(.12,.025));
  shift+=vec2(-4.0,-5.0)*followBreath(.18)*leftRibbon;
  shift+=vec2(4.5,-5.5)*followBreath(.20)*rightRibbon;

  // The blue underskirt hangs from the hip armor. Only the exposed folds below
  // the fittings can settle; displacement tapers just below the hem.
  float leftHem=clamp(698.0+(p.x-423.0)*.64,698.0,743.0);
  float rightHem=clamp(733.0-(p.x-555.0)*.24,710.0,733.0);
  float skirtRoot=ramp(650.0,704.0,p.y);
  float shortLeft=oval(p,vec2(465.0,704.0),vec2(53.0,59.0))*skirtRoot*(1.0-ramp(leftHem,leftHem+12.0,p.y));
  float shortRight=oval(p,vec2(592.0,709.0),vec2(43.0,54.0))*skirtRoot*(1.0-ramp(rightHem,rightHem+12.0,p.y));
  shift+=vec2(-2.8,-1.8)*followBreath(.12)*shortLeft;
  shift+=vec2(2.5,-1.6)*followBreath(.14)*shortRight;

  // Hard pins follow the actual rigid silhouettes, rather than scaling the
  // lower body along with the cloth. Soft borders prevent visible hinge seams.
  float sword=bar(p,vec2(529.0,434.0),vec2(527.0,1442.0),31.0,47.0);
  float hands=box(p,vec4(395.0,414.0,671.0,501.0),18.0);
  float leftHip=bar(p,vec2(402.0,625.0),vec2(309.0,776.0),39.0,64.0);
  float rightHip=bar(p,vec2(648.0,611.0),vec2(753.0,742.0),43.0,67.0);
  float leftLeg=max(bar(p,vec2(428.0,758.0),vec2(332.0,1105.0),58.0,82.0),bar(p,vec2(332.0,1105.0),vec2(280.0,1400.0),52.0,77.0));
  float rightLeg=max(bar(p,vec2(612.0,763.0),vec2(704.0,1106.0),58.0,82.0),bar(p,vec2(704.0,1106.0),vec2(782.0,1400.0),52.0,76.0));
  leftLeg*=ramp(leftHem-3.0,leftHem+12.0,p.y);
  rightLeg*=ramp(rightHem-3.0,rightHem+12.0,p.y);
  float goldGuard=bar(p,vec2(440.0,624.0),vec2(625.0,624.0),12.0,22.0);
  goldGuard=max(goldGuard,bar(p,vec2(459.0,640.0),vec2(508.0,688.0),7.0,15.0));
  goldGuard=max(goldGuard,bar(p,vec2(592.0,640.0),vec2(560.0,688.0),7.0,15.0));
  float backWeapons=box(p,vec4(748.0,0.0,906.0,746.0),15.0);
  backWeapons=max(backWeapons,box(p,vec4(818.0,1093.0,882.0,1360.0),10.0));
  // The foreground curl is a separate draw, so its vertices can move across
  // the sword while the repaired blade below remains completely stationary.
  if(u_layer>.5)backWeapons*=1.0-box(p,vec4(826.0,520.0,946.0,609.0),14.0);
  float rigid=max(max(sword,hands),max(max(leftHip,rightHip),max(leftLeg,rightLeg)));
  rigid=max(rigid,max(backWeapons,goldGuard));
  shift*=1.0-rigid;

  vec2 moved=uv+shift*u_strength/vec2(1086.0,1448.0);
  moved=(moved-.5)*.94+.5;
  gl_Position=vec4(moved.x*2.0-1.0,1.0-moved.y*2.0,0.0,1.0);
  v_uv=a_uv;
}`

const fragmentSource=createBlinkFragment({
  crop:[420,161,210,200],bounds:[222,269],
  declarations:`
uniform sampler2D u_detailBase;
uniform float u_detailReady;
uniform float u_layer;
float curlRegion(vec2 p,float expand){
  float x=clamp((p.x-839.0)/98.0,0.0,1.0);
  float center=550.0+105.0*x-118.0*x*x;
  float radius=2.0+15.0*sin(min(x*1.5,1.0)*1.5707963);
  return (1.0-smoothstep(radius+expand,radius+expand+2.0,abs(p.y-center)))*smoothstep(834.0-expand,841.0,p.x)*(1.0-smoothstep(920.0,937.0,p.x));
}
float curlMask(vec2 p,vec4 source){
  vec3 rgb=source.rgb/max(source.a,.001);
  return curlRegion(p,0.0)*smoothstep(.002,.025,rgb.r-rgb.b);
}`,
  finish:`
  if(u_detailReady>.5){
    float mask=curlMask(p,color);
    if(u_layer>.5){color*=mask;}
    else{
      // Include the old strand's gray edge/shadow on the blade in the repair;
      // moving only its blonde pixels would leave a stationary outline.
      float repair=max(mask,curlRegion(p,4.0)*(1.0-smoothstep(880.0,886.0,p.x)));
      vec4 clean=texture2D(u_detailBase,(p-vec2(820.0,500.0))/vec2(150.0,120.0));
      color=mix(color,clean,repair);
    }
  }
`,
  eyes:[
    {center:[493,247],radius:[24,17],slope:.05,range:[473,513],upper:[247,239.5,241,248],closed:[251,252,250.5,249],lower:[249,255.5,255,249]},
    {center:[552,240],radius:[26,18],slope:-.16,range:[531,575],upper:[240,233.7,232.5,239],closed:[245,245.5,243,239],lower:[244,249,247.5,240]},
  ],
})

export function createSylviaMotion(canvas,imageUrl){
  return createPortraitMotion(canvas,imageUrl,{vertexSource,fragmentSource,closedEyesUrl:'/sylvia-motion/closed-eyes-v2.webp',blinkOffset:.4,detailBaseUrl:'/sylvia-motion/blade-under-hair-v2.webp'})
}
