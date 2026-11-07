// Original oil-painting pixels, with local cloud deformation only.
// The generated cutouts supply alpha mattes; their redrawn RGB is never used.
const VERTEX = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * .5 + .5;
  gl_Position = vec4(aPosition, 0., 1.);
}`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPainting;
uniform sampler2D uClouds;
uniform sampler2D uArchitecture;
uniform vec2 uUvScale;
uniform float uTime;

float cloudMask(vec2 p) {
  return texture2D(uClouds, p).a;
}
float architectureMask(vec2 p) {
  return texture2D(uArchitecture, p).a;
}
vec2 breath(vec2 p, float t) {
  // Two standing fields: each bank billows about its own original position.
  return vec2(
    sin(p.y * 13. + p.x * 7. + t * .22) + .45 * sin(p.y * 24. - t * .17),
    cos(p.x * 16. - p.y * 5. + t * .19) + .4 * sin(p.x * 27. + t * .13)
  );
}
void main() {
  vec2 p = (vec2(vUv.x, 1. - vUv.y) - .5) * uUvScale + .5;
  // Below the skyline, nothing is drawn over the original CSS background.
  if (p.y > .46) discard;

  // Include an eight-pixel guard around statues and roof ornaments. UV sampling
  // and opacity changes stop before reaching any part of the architecture.
  vec2 guard = vec2(.005, .0085);
  float solid = architectureMask(p);
  solid = max(solid, architectureMask(p + vec2(guard.x, 0.)));
  solid = max(solid, architectureMask(p - vec2(guard.x, 0.)));
  solid = max(solid, architectureMask(p + vec2(0., guard.y)));
  solid = max(solid, architectureMask(p - vec2(0., guard.y)));
  solid = max(solid, architectureMask(p + guard));
  solid = max(solid, architectureMask(p - guard));
  solid = max(solid, architectureMask(p + vec2(guard.x, -guard.y)));
  solid = max(solid, architectureMask(p + vec2(-guard.x, guard.y)));
  float protection = smoothstep(.015, .25, solid);
  if (protection > .999) discard;

  // A soft margin lets the original wisps expand a few pixels, without translating
  // the sky or the two cloud banks as a single image.
  float region = cloudMask(p);
  region = max(region, cloudMask(p + vec2(.004, 0.)) * .8);
  region = max(region, cloudMask(p - vec2(.004, 0.)) * .8);
  region = max(region, cloudMask(p + vec2(0., .006)) * .8);
  region = max(region, cloudMask(p - vec2(0., .006)) * .8);
  region = smoothstep(.02, .65, region) * (1. - protection);
  if (region < .001) discard;

  float onset = smoothstep(0., 5., uTime);
  vec2 displacement = (breath(p, uTime) - breath(p, 0.))
    * vec2(.0038, .0042) * region * onset;
  vec2 source = clamp(p + displacement, vec2(.001), vec2(.999));
  vec3 original = texture2D(uPainting, p).rgb;
  vec3 cloud = texture2D(uPainting, source).rgb;

  // Colour comes exclusively from the original painting. The blue samples are
  // unobstructed sky in that same painting, used only for gentle local thinning.
  vec3 blueTop = texture2D(uPainting, vec2(.52, .025)).rgb;
  vec3 blueLow = texture2D(uPainting, vec2(.355, .18)).rgb;
  vec3 blue = mix(blueTop, blueLow, smoothstep(0., .35, p.y));
  float cloudTone = smoothstep(-.26, -.045, cloud.r - cloud.b);
  float phase = p.x * 19. + p.y * 11.;
  float density = (sin(phase + uTime * .18) - sin(phase)) * .075 * onset;
  vec3 breathingCloud = clamp(blue + (cloud - blue) * (1. + density * cloudTone), 0., 1.);
  gl_FragColor = vec4(mix(original, breathingCloud, region), region);
}`;

const ROOT = '/unconventional-affairs/delivery-v1/';
const SOURCES = [
  `${ROOT}white-palace-oil-v1.webp`,
  `${ROOT}palace-original-clouds-v1.webp`,
  `${ROOT}palace-silhouette-v1.webp`,
];

export function mountPalaceClouds(canvas, { onReady, onUnavailable }) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
  let disposed = false;
  let paused = true;
  let ready = false;
  let frame = 0;
  let elapsed = 0;
  let previousTime = 0;
  let program;
  let buffer;
  let resizeObserver;
  let uniforms;
  const shaders = [];
  const textures = [];

  function draw() {
    if (!ready || disposed) return;
    gl.uniform1f(uniforms.time, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function tick(now) {
    if (paused || !ready || disposed) return;
    if (!previousTime) previousTime = now;
    const delta = now - previousTime;
    if (delta >= 1000 / 30) {
      elapsed += Math.min(delta, 100) / 1000;
      previousTime = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function resize() {
    if (!ready || disposed) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1800000 / (width * height)));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const cover = Math.max(width / 1672, height / 941);
    gl.uniform2f(uniforms.scale, width / (1672 * cover), height / (941 * cover));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    draw();
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }
  function release() {
    stop();
    resizeObserver?.disconnect();
    textures.forEach(texture => gl.deleteTexture(texture));
    shaders.forEach(shader => gl.deleteShader(shader));
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
  }
  function unavailable() {
    ready = false;
    release();
    if (!disposed) onUnavailable();
  }
  function lostContext(event) {
    event.preventDefault();
    unavailable();
  }
  function compile(type, source) {
    const shader = gl.createShader(type);
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  if (gl) {
    canvas.addEventListener('webglcontextlost', lostContext);
    Promise.all(SOURCES.map(async src => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return image;
    })).then(images => {
      if (disposed) return;
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      images.forEach((image, index) => {
        const texture = gl.createTexture();
        textures.push(texture);
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.uniform1i(gl.getUniformLocation(program, ['uPainting','uClouds','uArchitecture'][index]), index);
      });
      uniforms = { time: gl.getUniformLocation(program, 'uTime'), scale: gl.getUniformLocation(program, 'uUvScale') };
      ready = true;
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      onReady();
    }).catch(error => {
      if (!disposed) console.warn('Cloud animation unavailable; keeping original oil painting.', error);
      unavailable();
    });
  }

  return {
    setPaused(value) {
      paused = value;
      stop();
      if (!paused && ready) frame = requestAnimationFrame(tick);
    },
    dispose() {
      disposed = true;
      canvas.removeEventListener('webglcontextlost', lostContext);
      release();
    },
  };
}
