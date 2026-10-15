import {createBlinkFragment,createPortraitMotion,breathingRigGLSL} from './portrait-motion-engine.js'

const vertexSource=`
precision highp float;
attribute vec2 a_uv;
uniform float u_phase;
uniform float u_strength;
uniform vec3 u_breathing;
${breathingRigGLSL}
varying vec2 v_uv;
float ramp(float a,float b,float x){return smoothstep(a,b,x);}
float oval(vec2 p,vec2 c,vec2 r){vec2 d=(p-c)/r;return exp(-dot(d,d)*2.0);}
vec2 turn(vec2 p,float a){return vec2(cos(a)*p.x-sin(a)*p.y,sin(a)*p.x+cos(a)*p.y);}
float box(vec2 p,vec4 b,float f){return ramp(b.x-f,b.x,p.x)*(1.0-ramp(b.z,b.z+f,p.x))*ramp(b.y-f,b.y,p.y)*(1.0-ramp(b.w,b.w+f,p.y));}
float bar(vec2 p,vec2 a,vec2 b,float inside,float outside){vec2 d=b-a;return 1.0-ramp(inside,outside,length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.0,1.0)));}
float disk(vec2 p,vec2 c,vec2 r){return 1.0-ramp(.84,1.0,length((p-c)/r));}
void main(){
  vec2 uv=a_uv,p=uv*vec2(1086.0,1448.0);
  float t=u_phase;
  float breath=u_breathing.x;
  float head=box(p,vec4(450.0,-12.0,728.0,331.0),22.0);
  float torso=box(p,vec4(466.0,309.0,741.0,566.0),20.0)*(1.0-ramp(401.0,572.0,p.y));
  float leftHair=ramp(337.0,435.0,p.y)*(1.0-ramp(595.0,660.0,p.y))*(1.0-ramp(439.0,505.0,p.x));
  float rightHair=ramp(664.0,774.0,p.x)*ramp(148.0,310.0,p.y)*(1.0-ramp(603.0,675.0,p.y));
  float hair=max(leftHair,rightHair);
  vec2 neck=p-vec2(581.0,292.0);
  vec2 shift=vec2(.22,-.30)*breath*max(max(head,torso),hair);
  shift+=(turn(neck,.0011*breath)-neck)*max(head,hair);
  // The fitted bodice follows two local volumes. Leave the center jewel,
  // neckline and waist fixed while the cups rise/fall with the quiet breath.
  float chestFollow=breath;
  float chestSway=.55*breath+.45*u_breathing.z;
  float cupSupport=ramp(377.0,403.0,p.y)*(1.0-ramp(462.0,491.0,p.y));
  float centerJewel=bar(p,vec2(624.0,396.0),vec2(638.0,474.0),8.0,17.0);
  float leftCup=oval(p,vec2(582.0,426.0),vec2(50.0,62.0))*cupSupport*(1.0-centerJewel);
  float rightCup=oval(p,vec2(682.0,444.0),vec2(36.0,42.0))*cupSupport*(1.0-centerJewel);
  shift+=vec2(-.80*chestSway,-4.4*chestFollow)*leftCup;
  shift+=vec2(.55*chestSway,-3.8*chestFollow)*rightCup;
  vec2 leftRoot=p-vec2(498.0,303.0),rightRoot=p-vec2(636.0,253.0);
  float leftFree=clamp(length(leftRoot)/650.0,0.0,1.0),rightFree=clamp(length(rightRoot)/620.0,0.0,1.0);
  shift+=(turn(leftRoot,.0058*followBreath(.04+leftFree*.14))-leftRoot)*leftHair;
  shift+=(turn(rightRoot,-.0052*followBreath(.05+rightFree*.14))-rightRoot)*rightHair;
  // Follow the curls beside the face, leaving the fringe over the eye and
  // the facial features untouched. The curled tips lag behind their roots.
  float leftLock=max(bar(p,vec2(502.0,225.0),vec2(495.0,263.0),12.0,22.0),bar(p,vec2(495.0,263.0),vec2(524.0,294.0),15.0,25.0));
  leftLock=max(leftLock,bar(p,vec2(524.0,294.0),vec2(537.0,336.0),13.0,23.0));
  float rightLock=max(bar(p,vec2(658.0,225.0),vec2(677.0,269.0),14.0,25.0),bar(p,vec2(677.0,269.0),vec2(660.0,315.0),16.0,27.0));
  // Include the outward fan above the shoulder: a vertical-only falloff
  // misses these almost horizontal locks beside the temple.
  rightLock=max(rightLock,bar(p,vec2(660.0,209.0),vec2(713.0,237.0),18.0,31.0));
  rightLock=max(rightLock,bar(p,vec2(713.0,237.0),vec2(790.0,250.0),17.0,30.0));
  rightLock=max(rightLock,bar(p,vec2(678.0,261.0),vec2(721.0,315.0),22.0,35.0));
  float lockFree=ramp(225.0,291.0,p.y);
  leftLock*=lockFree*(1.0-ramp(338.0,362.0,p.y));
  vec2 leftTemple=p-vec2(502.0,222.0),rightTemple=p-vec2(649.0,198.0);
  float rightLockFree=ramp(22.0,95.0,length(rightTemple));
  rightLock*=rightLockFree*(1.0-ramp(316.0,342.0,p.y))*ramp(646.0,662.0,p.x);
  float leftFollow=followBreath(.04+lockFree*.10);
  float rightFollow=followBreath(.05+rightLockFree*.11);
  shift+=(turn(leftTemple,.020*leftFollow)-leftTemple+vec2(0.0,-.8*leftFollow))*leftLock;
  shift+=(turn(rightTemple,-.027*rightFollow)-rightTemple)*rightLock;

  // The hands are the skirt's two moving attachments. Each hand and the
  // cloth directly in its grip receive exactly the same motion. Delay grows
  // farther down the fabric, while the waist and legs do not follow the lift.
  float leftHand=box(p,vec4(270.0,535.0,349.0,587.0),10.0);
  float rightHand=box(p,vec4(847.0,620.0,923.0,674.0),10.0);
  float leftArm=bar(p,vec2(447.0,507.0),vec2(311.0,560.0),23.0,39.0)*(1.0-ramp(340.0,450.0,p.x));
  float rightArm=bar(p,vec2(745.0,535.0),vec2(875.0,639.0),23.0,40.0)*ramp(738.0,853.0,p.x);
  // The hair behind each grip must not contribute a second displacement to
  // the fingers. Hand and adjoining fabric inherit one common parent shift.
  float leftAttachment=box(p,vec4(270.0,535.0,349.0,610.0),14.0);
  float rightAttachment=box(p,vec4(847.0,620.0,923.0,694.0),14.0);
  shift=mix(shift,vec2(.22,-.30)*breath,max(leftAttachment,rightAttachment));
  float leftCloth=ramp(546.0,562.0,p.y)*(1.0-ramp(519.0,594.0,p.x));
  float rightCloth=ramp(624.0,650.0,p.y)*ramp(655.0,735.0,p.x);
  float leftLift=-3.5*breath,rightLift=-3.1*breath;
  shift.y+=leftLift*max(max(leftHand,leftArm),leftCloth);
  shift.y+=rightLift*max(max(rightHand,rightArm),rightCloth);
  float leftLag=ramp(35.0,470.0,length(p-vec2(298.0,565.0)));
  float rightLag=ramp(35.0,470.0,length(p-vec2(894.0,650.0)));
  // Hands remain rigid, including any overlap with the hair behind them.
  float leftHem=leftCloth*(1.0-leftHand),rightHem=rightCloth*(1.0-rightHand);
  shift.y+=(-3.5*followBreath(leftLag*.16)-leftLift)*leftHem*leftLag;
  shift.y+=(-3.1*followBreath(rightLag*.18)-rightLift)*rightHem*rightLag;
  shift.x-=2.2*followBreath(leftLag*.16)*leftHem*leftLag;
  shift.x+=1.9*followBreath(rightLag*.18)*rightHem*rightLag;
  float waist=box(p,vec4(591.0,488.0,662.0,577.0),14.0);
  shift*=1.0-waist;

  // Trace the crossed legs rather than pinning a broad rectangle through
  // the tails. The hip and ankles stay anchored, with a tiny opposing glide
  // around the knees. A continuous field preserves their existing overlap.
  float legLeft=mix(459.0,530.0,ramp(755.0,938.0,p.y))+66.0*ramp(1070.0,1280.0,p.y);
  float legRight=mix(701.0,649.0,ramp(750.0,943.0,p.y))+18.0*ramp(968.0,1030.0,p.y)*(1.0-ramp(1090.0,1195.0,p.y));
  float legs=ramp(legLeft-16.0,legLeft+3.0,p.x)*(1.0-ramp(legRight-3.0,legRight+16.0,p.x))*ramp(745.0,783.0,p.y);
  float contact=mix(590.0,582.0,ramp(750.0,950.0,p.y))+49.0*ramp(950.0,1320.0,p.y);
  float frontLeg=ramp(contact-14.0,contact+14.0,p.x);
  float legFree=ramp(775.0,945.0,p.y)*(1.0-ramp(1140.0,1335.0,p.y));
  vec2 legMove=vec2(mix(.75,-1.15,frontLeg),mix(.35,-.50,frontLeg))*followBreath(.08)*legFree;
  shift=mix(shift,legMove,legs);

  // Tails retain separate roots and flexibility, but follow the same breath
  // as the hand-led skirt. Only their free ends settle a little later.
  float tailFree=ramp(835.0,1035.0,p.y);
  float leftTail=tailFree*(1.0-ramp(500.0,575.0,p.x))*(1.0-legs);
  float rightTail=tailFree*ramp(650.0,725.0,p.x)*(1.0-legs);
  vec2 leftTailRoot=p-vec2(485.0,840.0),rightTailRoot=p-vec2(702.0,866.0);
  float leftTailDelay=clamp(length(leftTailRoot)/680.0,0.0,1.0);
  float rightTailDelay=clamp(length(rightTailRoot)/630.0,0.0,1.0);
  vec2 leftTailMove=turn(leftTailRoot,.0065*followBreath(.08+leftTailDelay*.12))-leftTailRoot;
  vec2 rightTailMove=turn(rightTailRoot,-.0060*followBreath(.09+rightTailDelay*.12))-rightTailRoot;
  float upperFin=box(p,vec4(-20.0,916.0,257.0,1188.0),28.0);
  float lowerFin=(1.0-ramp(365.0,450.0,p.x))*ramp(1135.0,1190.0,p.y);
  float farFin=ramp(782.0,852.0,p.x)*ramp(1143.0,1210.0,p.y);
  vec2 upperFinRoot=p-vec2(291.0,1171.0),lowerFinRoot=p-vec2(389.0,1329.0),farFinRoot=p-vec2(853.0,1300.0);
  leftTailMove+=(turn(upperFinRoot,.007*followBreath(.20))-upperFinRoot)*upperFin;
  leftTailMove+=(turn(lowerFinRoot,.006*followBreath(.22))-lowerFinRoot)*lowerFin;
  rightTailMove+=(turn(farFinRoot,-.006*followBreath(.22))-farFinRoot)*farFin;
  shift=mix(shift,leftTailMove,leftTail);
  shift=mix(shift,rightTailMove,rightTail);

  // The sprite floats as one rigid face/body, with soft fins and tail tips.
  // Its motion is independent of the human breathing and stays within the
  // transparent gap, fading before the character's shoulder and hair.
  float sprite=box(p,vec4(145.0,143.0,409.0,441.0),12.0);
  vec2 spriteCenter=p-vec2(302.0,322.0);
  vec2 spriteMove=vec2(1.6*sin(t),4.5*sin(t*2.0))+(turn(spriteCenter,.012*sin(t*2.0-.25))-spriteCenter);
  float fins=ramp(332.0,391.0,p.y);
  spriteMove+=vec2(1.6*sin(t*2.0-.6),2.0*sin(t*2.0-.85))*fins;
  shift=mix(shift,spriteMove,sprite);
  // Clear water droplets bob independently; their silhouettes stay round.
  float upperDrop=disk(p,vec2(405.0,231.0),vec2(39.0,40.0));
  float leftDrop=disk(p,vec2(196.0,316.0),vec2(33.0,31.0));
  float rightDrop=disk(p,vec2(421.0,307.0),vec2(24.0,22.0));
  float farDrop=disk(p,vec2(835.0,301.0),vec2(27.0,32.0));
  shift=mix(shift,vec2(2.0*sin(t*2.0-.6),3.7*sin(t*2.0-.3)),upperDrop);
  shift=mix(shift,vec2(1.4*sin(t*2.0-.5),3.2*sin(t*2.0-.8)),leftDrop);
  shift=mix(shift,vec2(1.5*sin(t*2.0-.9),2.8*sin(t*2.0-.45)),rightDrop);
  shift=mix(shift,vec2(1.2*sin(t*2.0-.7),2.6*sin(t*2.0-.4)),farDrop);
  float stream=box(p,vec4(-15.0,356.0,143.0,521.0),14.0);
  vec2 flow=vec2(2.3*sin(t*2.0-p.y*.010),3.0*sin(t*2.0-p.x*.012-.4));
  shift=mix(shift,flow,stream);
  vec2 moved=uv+shift*u_strength/vec2(1086.0,1448.0);
  moved=(moved-.5)*.94+.5;
  gl_Position=vec4(moved.x*2.0-1.0,1.0-moved.y*2.0,0.0,1.0);
  v_uv=a_uv;
}`

const fragmentSource=createBlinkFragment({
  crop:[475,140,210,180],bounds:[179,241],
  eyes:[
    {center:[540,222],radius:[20,15],slope:-.50,range:[525,554],upper:[222,211,209,215],closed:[222,220,216,215],lower:[224,232,225,218]},
    {center:[605,199],radius:[26,17],slope:-.20,range:[584,624],upper:[194,190,189.5,193],closed:[204,201,198,192],lower:[198,209,206,194]},
  ],
  declarations:`
uniform float u_phase;
uniform float u_strength;
float waterDisk(vec2 p,vec2 c,vec2 r){return 1.0-smoothstep(.72,1.0,length((p-c)/r));}
`,
  finish:`
  // Keep the original white fringe in front of the partly hidden left eye.
  if(u_blink>0.0 && p.x>545.0 && p.x<565.0 && p.y>190.0 && p.y<221.0){
    vec4 original=texture2D(u_image,v_uv);
    vec3 rgb=original.rgb/max(original.a,.001);
    float chroma=max(max(rgb.r,rgb.g),rgb.b)-min(min(rgb.r,rgb.g),rgb.b);
    vec4 closed=closedAt(p);
    vec3 closedRgb=closed.rgb/max(closed.a,.001);
    float unchangedHair=1.0-smoothstep(.025,.055,length(rgb-closedRgb));
    float hairCover=smoothstep(.47,.65,rgb.r)*(1.0-smoothstep(.13,.20,chroma))*unchangedHair;
    color=mix(color,original,hairCover);
  }
  float stream=(1.0-smoothstep(127.0,151.0,p.x))*smoothstep(345.0,365.0,p.y)*(1.0-smoothstep(507.0,530.0,p.y));
  float water=max(stream,max(waterDisk(p,vec2(405.0,231.0),vec2(36.0,38.0)),waterDisk(p,vec2(196.0,316.0),vec2(31.0,29.0))));
  water=max(water,max(waterDisk(p,vec2(421.0,307.0),vec2(23.0,20.0)),waterDisk(p,vec2(835.0,301.0),vec2(25.0,30.0))));
  vec3 rgb=color.rgb/max(color.a,.001);
  float aqua=smoothstep(.015,.12,rgb.b-rgb.r)*smoothstep(.35,.70,rgb.g);
  float glint=pow(.5+.5*sin(u_phase*2.0+p.x*.045+p.y*.025),10.0)*water*aqua*u_strength;
  color.rgb=min(vec3(color.a),color.rgb+vec3(.025,.045,.055)*glint*color.a);
`,
})
export function createXiannaMotion(canvas,imageUrl){
  return createPortraitMotion(canvas,imageUrl,{vertexSource,fragmentSource,closedEyesUrl:'/xianna-motion/closed-eyes-v2.webp',blinkOffset:.55})
}
