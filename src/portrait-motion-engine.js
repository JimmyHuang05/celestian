import {blinkAt,breathingAt,breathingPhaseAt,MOTION_DURATION} from './elowen-motion-timing.js'
export {breathingRigGLSL} from './elowen-motion-timing.js'

const glNumber=value=>Number.isInteger(value)?`${value}.0`:String(value)
const vec=values=>`vec${values.length}(${values.map(glNumber).join(',')})`

export function createBlinkFragment(config){
  const size=vec(config.size??[1086,1448])
  const origin=vec(config.crop.slice(0,2)),cropSize=vec(config.crop.slice(2))
  const eyeBlocks=config.eyes.map(eye=>`{
    float mask=eyeMask(p,${vec(eye.center)},${vec(eye.radius)},${glNumber(eye.slope)});
    if(mask>0.0){
      vec4 lid=eyelid(p,(p.x-${glNumber(eye.range[0])})/${glNumber(eye.range[1]-eye.range[0])},${vec(eye.upper)},${vec(eye.closed)},${vec(eye.lower)});
      color=mix(color,lid,mask);
    }
  }`).join('\n')
  return `
precision highp float;
uniform sampler2D u_image;
uniform sampler2D u_closedEyes;
uniform float u_blink;
varying vec2 v_uv;
${config.declarations??''}

float eyeMask(vec2 p,vec2 center,vec2 radius,float slope){
  vec2 d=p-center;
  d.y-=d.x*slope;
  return 1.0-smoothstep(.78,1.0,length(d/radius));
}
float lidCurve(float x,vec4 heights){
  float part=clamp(x,0.0,1.0)*3.0;
  if(part<1.0)return mix(heights.x,heights.y,smoothstep(0.0,1.0,part));
  if(part<2.0)return mix(heights.y,heights.z,smoothstep(1.0,2.0,part));
  return mix(heights.z,heights.w,smoothstep(2.0,3.0,part));
}
vec4 closedAt(vec2 p){
  // Registration includes a one-source-pixel vertical correction to the crop.
  return texture2D(u_closedEyes,(p-${origin})/${cropSize});
}
vec4 eyelid(vec2 p,float x,vec4 upper,vec4 shut,vec4 lower){
  float top=lidCurve(x,upper),bottom=lidCurve(x,lower),closed=lidCurve(x,shut);
  float movingTop=mix(top,closed,u_blink),movingBottom=mix(bottom,closed,u_blink);
  float originalY=p.y,closedY=p.y;
  float blend=u_blink;
  if(p.y<movingTop){
    // Translate the lash itself rigidly. Stretch only the skin above it, and
    // align both keyframes' lashes before blending: no double-line dissolve.
    float feather=smoothstep(top-13.0,movingTop-3.5,p.y);
    originalY-= (movingTop-top)*feather;
    closedY+= (closed-movingTop)*feather;
  }else if(p.y<movingBottom && movingBottom-movingTop>.01){
    originalY=mix(top,bottom,(p.y-movingTop)/(movingBottom-movingTop));
    // Keep the original iris opaque while the opening gets narrower.
    blend=smoothstep(.92,1.0,u_blink);
  }else{
    float feather=1.0-smoothstep(movingBottom,bottom+7.0,p.y);
    originalY+=(bottom-movingBottom)*feather;
    closedY+=(closed-movingBottom)*feather;
    blend=pow(u_blink,4.0);
  }
  vec4 openColor=texture2D(u_image,vec2(p.x,originalY)/${size});
  return mix(openColor,closedAt(vec2(p.x,closedY)),blend);
}
void main(){
  vec4 color=texture2D(u_image,v_uv);
  vec2 p=v_uv*${size};
  if(u_blink>0.0 && p.y>${glNumber(config.bounds[0])} && p.y<${glNumber(config.bounds[1])}){
    ${eyeBlocks}
  }
  ${config.finish??''}
  gl_FragColor=color;
}
`
}

export async function createPortraitMotion(canvas,imageUrl,{vertexSource,fragmentSource,closedEyesUrl,blinkOffset=0,detailBaseUrl}) {
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:false})
  if(!gl)throw new Error('WebGL unavailable')
  const resources=[]
  function shader(type,source){
    const shader=gl.createShader(type)
    gl.shaderSource(shader,source);gl.compileShader(shader)
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
      const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(message)
    }
    resources.push(()=>gl.deleteShader(shader));return shader
  }
  const program=gl.createProgram()
  resources.push(()=>gl.deleteProgram(program))
  gl.attachShader(program,shader(gl.VERTEX_SHADER,vertexSource))
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragmentSource))
  gl.linkProgram(program)
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program))
  gl.useProgram(program)

  const cols=144,rows=192
  const vertices=new Float32Array((cols+1)*(rows+1)*2)
  let at=0
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){vertices[at++]=x/cols;vertices[at++]=y/rows}
  const indices=new Uint16Array(cols*rows*6)
  at=0
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1
    indices.set([a,c,b,b,c,d],at);at+=6
  }
  const vertexBuffer=gl.createBuffer(),indexBuffer=gl.createBuffer()
  resources.push(()=>gl.deleteBuffer(vertexBuffer),()=>gl.deleteBuffer(indexBuffer))
  gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW)
  const uv=gl.getAttribLocation(program,'a_uv')
  gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW)

  const image=new Image()
  image.fetchPriority='high'
  image.src=imageUrl
  try{await image.decode()}
  catch(error){resources.reverse().forEach(dispose=>dispose());throw error}
  const texture=gl.createTexture()
  resources.push(()=>gl.deleteTexture(texture))
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true)
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image)
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
  gl.uniform1i(gl.getUniformLocation(program,'u_image'),0)
  let destroyed=false,lastTime=0,lastAmount=1
  // Start body motion as soon as the main portrait is ready. Optional textures
  // upgrade the running renderer independently; they never hold it hostage.
  let blinkReady=false
  let detailReady=false
  function optionalTexture(url,unit,uniform,onReady){
    const texture=gl.createTexture()
    resources.push(()=>gl.deleteTexture(texture))
    gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture)
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
    gl.uniform1i(gl.getUniformLocation(program,uniform),unit)
    const keyframe=new Image()
    keyframe.fetchPriority='low'
    keyframe.src=url
    keyframe.decode().then(()=>{
      if(destroyed||gl.isContextLost())return
      gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture)
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,keyframe)
      onReady();render()
    }).catch(error=>{if(!destroyed)console.warn('Optional portrait detail unavailable; body motion continues.',error)})
  }
  optionalTexture(closedEyesUrl,1,'u_closedEyes',()=>{blinkReady=true})
  if(detailBaseUrl)optionalTexture(detailBaseUrl,2,'u_detailBase',()=>{detailReady=true})
  const layer=gl.getUniformLocation(program,'u_layer'),detailEnabled=gl.getUniformLocation(program,'u_detailReady')
  const blink=gl.getUniformLocation(program,'u_blink')
  const phase=gl.getUniformLocation(program,'u_phase'),strength=gl.getUniformLocation(program,'u_strength')
  const breathing=gl.getUniformLocation(program,'u_breathing')
  const breathPhase=gl.getUniformLocation(program,'u_breathPhase')
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)
  gl.disable(gl.DITHER)
  gl.clearColor(0,0,0,0)
  function render(seconds=lastTime,amount=lastAmount){
    if(destroyed||gl.isContextLost())return
    lastTime=seconds;lastAmount=amount
    gl.uniform1f(phase,(seconds%MOTION_DURATION)/MOTION_DURATION*Math.PI*2)
    gl.uniform1f(strength,amount)
    const {ribcage,chest,fabric}=breathingAt(seconds)
    gl.uniform3f(breathing,ribcage,chest,fabric)
    gl.uniform1f(breathPhase,breathingPhaseAt(seconds))
    gl.uniform1f(blink,blinkReady?blinkAt(seconds+blinkOffset)*amount:0)
    gl.uniform1f(detailEnabled,detailReady&&amount>0?1:0)
    gl.uniform1f(layer,0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0)
    if(detailReady&&amount>0){
      gl.uniform1f(layer,1)
      gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0)
      gl.uniform1f(layer,0)
    }
  }
  function resize(){
    const {width,height}=canvas.getBoundingClientRect()
    const ratio=Math.min(window.devicePixelRatio||1,1.75)
    canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio))
    gl.viewport(0,0,canvas.width,canvas.height);render()
  }
  function destroy(){if(destroyed)return;destroyed=true;resources.reverse().forEach(dispose=>dispose())}
  resize()
  return {render,resize,destroy}
}
