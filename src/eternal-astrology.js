import { pageIsActive, subscribePageActivity } from './page-lifecycle.js';
import './eternal-astrology.css';
import { atmosphereFragment } from './astrology-atmospheres.js';

const vertexSource = `
  attribute vec2 aPosition;
  void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

export function mountAstrologyAtmosphere(root) {
  const artworkUrl = root.dataset.artwork || '/eternal-astrology/chaos-v1.webp';
  root.style.setProperty('--astrology-artwork', `url("${artworkUrl}")`);
  const still = root.querySelector('.astrology-chaos-fallback') || document.createElement('div');
  still.className = 'astrology-chaos astrology-chaos-fallback';
  still.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  canvas.className = 'astrology-chaos astrology-chaos-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'astrology-motion';
  toggle.hidden = true;
  root.prepend(still, canvas);
  // Approved artwork animation, with the accepted amplitude and speed.
  const variant = 4;
  root.dataset.atmosphere = '4';
  canvas.dataset.variant = '4';

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  let active = root.dataset.faction === 'eternal-astrology';
  let disposed = false, lost = false;
  let frame = 0, lastTime = 0, elapsed = 0;
  let program, buffer, resolution, time, variantUniform, noiseTexture, artworkTexture;
  let artworkReady = false;
  const artworkImage = new Image();
  artworkImage.onload = () => {
    if (!program || lost || disposed) return;
    uploadArtwork(); draw();
  };
  artworkImage.onerror = () => { canvas.dataset.artwork = 'unavailable'; };
  artworkImage.src = artworkUrl;
  const noisePixels = new Uint8Array(256 * 256 * 4);
  let seed = 42891;
  for (let i = 0; i < noisePixels.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    noisePixels[i] = noisePixels[i + 1] = noisePixels[i + 2] = seed >>> 24;
    noisePixels[i + 3] = 255;
  }
  const gl = canvas.getContext('webgl', {
    alpha: false, antialias: false, depth: false, stencil: false,
    powerPreference: 'low-power', preserveDrawingBuffer: false,
  });

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(error);
    }
    return shader;
  }

  function uploadArtwork() {
    if (!artworkImage.complete || !artworkImage.naturalWidth) return;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, artworkTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, artworkImage);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.uniform1f(gl.getUniformLocation(program, 'uArtworkAspect'), artworkImage.naturalWidth / artworkImage.naturalHeight);
    artworkReady = true;
    canvas.dataset.artwork = 'loaded';
  }

  function setup() {
    if (!gl || disposed) return false;
    let vertex, fragment;
    try {
      vertex = compile(gl.VERTEX_SHADER, vertexSource);
      fragment = compile(gl.FRAGMENT_SHADER, atmosphereFragment);
      program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      resolution = gl.getUniformLocation(program, 'uResolution');
      time = gl.getUniformLocation(program, 'uTime');
      variantUniform = gl.getUniformLocation(program, 'uVariant');
      noiseTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, noisePixels);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.uniform1i(gl.getUniformLocation(program, 'uNoise'), 0);
      artworkReady = false;
      artworkTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, artworkTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([8, 8, 7, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(program, 'uArtwork'), 1);
      gl.uniform1f(gl.getUniformLocation(program, 'uArtworkAspect'), 1);
      uploadArtwork();
      canvas.dataset.renderer = 'webgl';
      toggle.hidden = false;
      return true;
    } catch (error) {
      console.warn('Astrology atmosphere: using the still background.', error);
      if (buffer) gl.deleteBuffer(buffer);
      if (noiseTexture) gl.deleteTexture(noiseTexture);
      if (artworkTexture) gl.deleteTexture(artworkTexture);
      if (program) gl.deleteProgram(program);
      program = null;
      canvas.dataset.renderer = 'still';
      toggle.hidden = true;
      return false;
    } finally {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
    }
  }

  function draw() {
    if (!program || lost || disposed || !active || !pageIsActive()) return;
    if (variant === 4 && !artworkReady) { canvas.dataset.ready = 'false'; return; }
    gl.uniform1f(time, elapsed);
    gl.uniform1i(variantUniform, variant);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.dataset.ready = 'true';
  }

  function resize() {
    if (!program || lost || disposed) return;
    const bounds = root.getBoundingClientRect();
    // Preserve fine wisps and threads; cap total pixels on very large displays.
    const scale = Math.min(devicePixelRatio || 1, 1.25, 1680 / bounds.width, Math.sqrt(1600000 / (bounds.width * bounds.height)));
    canvas.width = Math.max(1, Math.round(bounds.width * scale));
    canvas.height = Math.max(1, Math.round(bounds.height * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    draw();
  }

  function tick(now) {
    frame = 0;
    if (disposed || lost || !active || paused || !pageIsActive() || !program) return;
    if (!lastTime) lastTime = now;
    const delta = now - lastTime;
    if (delta >= 1000 / 30) {
      elapsed += Math.min(delta / 1000, .15);
      lastTime = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    toggle.textContent = paused ? '恢复流动' : '暂停流动';
    toggle.setAttribute('aria-pressed', String(paused));
    const running = !!program && !lost && active && !paused && !!pageIsActive() && !disposed;
    canvas.dataset.motion = running ? 'running' : 'paused';
    draw();
    if (running) frame = requestAnimationFrame(tick);
  }

  const onToggle = () => { paused = !paused; sync(); };
  const onPreference = () => { paused = motion.matches; sync(); };
  const onLost = event => {
    event.preventDefault(); lost = true;
    canvas.dataset.ready = 'false'; toggle.hidden = true; sync();
  };
  const onRestored = () => {
    lost = false;
    if (setup()) { resize(); sync(); }
  };
  const onPageHide = () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0; };
  toggle.addEventListener('click', onToggle);
  motion.addEventListener('change', onPreference);
  const stopActivity = subscribePageActivity(sync);
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', sync);
  const observer = new ResizeObserver(resize);
  observer.observe(root);
  if (setup()) resize();
  sync();

  return {
    setActive(value) { active = value; if (active) resize(); sync(); },
    destroy() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      toggle.removeEventListener('click', onToggle);
      motion.removeEventListener('change', onPreference);
      stopActivity();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', sync);
      if (gl) {
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        if (noiseTexture) gl.deleteTexture(noiseTexture);
        if (artworkTexture) gl.deleteTexture(artworkTexture);
      }
      delete root.dataset.backgroundOnly;
      artworkImage.onload = null;
      artworkImage.onerror = null;
      document.getElementById('astrology-view').inert = false;
      still.remove(); canvas.remove(); toggle.remove();
    },
  };
}
