import {
  WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry, Mesh,
  MeshPhysicalMaterial, CanvasTexture, SRGBColorSpace, Vector2,
  HemisphereLight, DirectionalLight, PMREMGenerator, ACESFilmicToneMapping,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { bindClothMaterial, createClothAnchor } from './imperial-cloth-motion.js';
import { createFlagTassels } from './imperial-tassels.js';
import { createHemFringe } from './imperial-fringe.js';
import { BANNER, clothCoordinates, fringeRoots } from './imperial-banner-shape.js';
import { createRaisedTrim } from './imperial-gold-trim.js';
import { createBannerHardware } from './imperial-hardware.js';
import { illustratedBanner } from './imperial-illustrated-banner.js';

const TEXTURE_WIDTH = 768;
const VIEW_PADDING_X = 9, VIEW_PADDING_BOTTOM = 15;
const assetData = new Map();

function embeddedAsset(url) {
  if (!assetData.has(url)) assetData.set(url, fetch(url).then(response => {
    if (!response.ok) throw new Error(`Unable to load flag emblem: ${response.status}`);
    return response.blob();
  }).then(blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  })).catch(error => { assetData.delete(url); throw error; }));
  return assetData.get(url);
}

function canvas(width, height) {
  const surface = document.createElement('canvas');
  surface.width = width;
  surface.height = height;
  return surface;
}

async function rasterize(svg, width, height) {
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  // SVGs loaded as images cannot fetch external subresources. Embed local animal assets first.
  await Promise.all([...svg.querySelectorAll('image')].map(async element => {
    const href = element.getAttribute('href');
    if (href && !href.startsWith('data:')) element.setAttribute('href', await embeddedAsset(href));
  }));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    const surface = canvas(width, height);
    surface.getContext('2d').drawImage(image, 0, 0, width, height);
    return surface;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function textureSource(source, mask = false, layer = 'base') {
  const svg = source.cloneNode(true);
  if (layer !== 'base') {
    const artwork = svg.querySelector(layer === 'cross' ? '.iron-cross' : '.badge-artwork');
    const defs = svg.querySelector('defs');
    svg.replaceChildren(defs, artwork);
  } else svg.querySelectorAll('.iron-cross, .badge-artwork, .three-trim-fallback').forEach(el => el.remove());
  svg.querySelector('.header-fitting')?.remove();
  svg.querySelectorAll('.svg-tassel, .svg-hem-fringe').forEach(el => el.remove());
  svg.querySelectorAll('.fold-light, [fill$="-WEAVE)"]').forEach(el => el.remove());
  // Material lighting comes from the scene; do not bake the old wide CSS folds into the map.
  svg.querySelectorAll('[id$="-CLOTH"] stop').forEach(stop => stop.setAttribute('stop-color', '#e8e2d4'));
  if (mask) {
    svg.querySelectorAll('[fill$="-DAMASK)"]').forEach(el => el.remove());
    for (const el of svg.querySelectorAll('*')) {
      for (const property of ['fill', 'stroke', 'stop-color']) {
        const value = el.getAttribute(property);
        if (!value || value === 'none') continue;
        if (el.closest('[data-textile-binding]')) {
          // The bound perimeter is soft thread, with much less shine than gold embroidery.
          el.setAttribute(property, '#404040');
        } else if (value.startsWith('url(')) {
          // White marks the raised threads; cloth and the dark cross stay matte.
          el.setAttribute(property, /-(GOLD|SILVER|BRONZE|BRAID)\)/.test(value) ? '#fff' : '#000');
        } else {
          // Small highlight lines contribute to the embroidery as well.
          el.setAttribute(property, /^#(f|e|d|c|b|a)/i.test(value) ? '#fff' : '#000');
        }
      }
    }
  }
  return svg;
}

async function textileMaps(source, renderer, size, layer = 'base') {
  const targetWidth = source.getBoundingClientRect().width < 180 ? 384 : source.closest('.imperial') ? TEXTURE_WIDTH : 512;
  const width = Math.min(targetWidth, Math.floor(renderer.capabilities.maxTextureSize * size.x / size.y));
  const height = Math.round(width * size.y / size.x);
  const [surface, mask] = await Promise.all([
    rasterize(textureSource(source, false, layer), width, height),
    rasterize(textureSource(source, true, layer), width, height),
  ]);
  const context = surface.getContext('2d');
  const colour = context.getImageData(0, 0, width, height);
  const raised = mask.getContext('2d').getImageData(0, 0, width, height).data;
  const relief = new Float32Array(width * height);
  const normal = canvas(width, height), material = canvas(width, height);
  const normals = normal.getContext('2d').createImageData(width, height);
  const properties = material.getContext('2d').createImageData(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = y * width + x, p = index * 4;
    const gold = raised[p] / 255;
    // Tiny over-under threads and diagonal satin stitches, deterministic across reloads.
    const warp = Math.sin(x * Math.PI * .83), weft = Math.cos(y * Math.PI * .75);
    const stitch = Math.sin((x * .72 + y) * 2.1);
    const grain = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const noise = (grain - Math.floor(grain)) - .5;
    const threadLight = (warp * weft * .021 + noise * .018) * (1 - gold) + stitch * gold * .048;
    for (let c = 0; c < 3; c++) colour.data[p + c] *= 1 + threadLight;
    relief[index] = gold * (.75 + stitch * .11) + (1 - gold) * (warp * weft * .08);
    properties.data[p] = 255;
    properties.data[p + 1] = Math.round(242 - gold * 113); // Roughness: linen vs gold thread.
    properties.data[p + 2] = Math.round(gold * 195); // Metalness only on embroidery.
    properties.data[p + 3] = 255;
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = (y * width + x) * 4;
    const dx = relief[y * width + Math.min(width - 1, x + 1)] - relief[y * width + Math.max(0, x - 1)];
    const dy = relief[Math.min(height - 1, y + 1) * width + x] - relief[Math.max(0, y - 1) * width + x];
    const length = Math.hypot(dx, dy, 1);
    normals.data[p] = Math.round(128 - dx / length * 127);
    normals.data[p + 1] = Math.round(128 + dy / length * 127);
    normals.data[p + 2] = Math.round(128 + 127 / length);
    normals.data[p + 3] = 255;
  }
  context.putImageData(colour, 0, 0);
  normal.getContext('2d').putImageData(normals, 0, 0);
  material.getContext('2d').putImageData(properties, 0, 0);
  const map = new CanvasTexture(surface), normalMap = new CanvasTexture(normal), packed = new CanvasTexture(material);
  map.colorSpace = SRGBColorSpace;
  for (const texture of [map, normalMap, packed]) texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return { map, normalMap, packed };
}


/**
 * Five scissored views share one WebGL context, lighting environment and animation loop.
 * Original SVGs and the illustrated main flag remain complete fallbacks.
 */
export async function createKnightlyCloths(stage, standards, { paused = false, signal, onUnavailable = () => {} } = {}) {
  if (signal?.aborted) throw new DOMException('Cloth setup cancelled', 'AbortError');
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.debug.onShaderError = (gl, program) => { throw new Error(`Cloth shader: ${gl.getProgramInfoLog(program)}`); };
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = .94;
  const view = renderer.domElement;
  view.className = 'standards-cloth-canvas';
  view.setAttribute('aria-hidden', 'true');
  const entries = [];
  let environment, observer;
  let disposed = false, frame = 0, highlightFrame = 0, time = 0, last = 0, stageHeight = 1;
  const clock = { value: 0 };

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(highlightFrame);
    observer?.disconnect();
    signal?.removeEventListener('abort', dispose);
    view.removeEventListener('webglcontextlost', contextLost);
    view.remove();
    delete stage.dataset.cloth;
    for (const { host, geometry, shadowGeometry, material, shadowMaterials = [], maps, tassels, fringe, trim, hardware, layers = [] } of entries) {
      delete host.dataset.cloth;
      geometry.dispose();
      material.dispose();
      shadowGeometry?.dispose();
      shadowMaterials.forEach(shadow=>shadow.dispose());
      tassels?.dispose();
      fringe?.dispose();
      trim?.dispose();
      hardware?.dispose();
      layers.forEach(layer => {
        layer.geometry.dispose(); layer.material.dispose();
        Object.values(layer.maps).forEach(texture => texture.dispose());
      });
      Object.values(maps).forEach(texture => texture.dispose());
    }
    environment?.dispose();
    renderer.dispose();
  }
  function contextLost(event) {
    event.preventDefault();
    dispose();
    onUnavailable();
  }
  function render() {
    if (disposed) return;
    clock.value = time;
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    for (const entry of entries) {
      const { left, top, width, height } = entry.bounds;
      if (width <= 0 || height <= 0) continue;
      renderer.setViewport(left, stageHeight - top - height, width, height);
      renderer.setScissor(left, stageHeight - top - height, width, height);
      renderer.clearDepth();
      renderer.render(entry.scene, entry.camera);
    }
    renderer.setScissorTest(false);
  }
  function tick(now) {
    if (paused || disposed) return;
    frame = requestAnimationFrame(tick);
    if (!last) last = now;
    const delta = now - last;
    if (delta < 1000 / 30) return;
    const seconds = Math.min(delta, 100) / 1000;
    time += seconds;
    entries.forEach(entry => { entry.tassels?.advance(seconds); entry.fringe?.advance(seconds); });
    last = now;
    render();
  }
  function setPaused(value) {
    paused = value;
    cancelAnimationFrame(frame);
    last = 0;
    view.dataset.motion = paused ? 'paused' : 'playing';
    view.dataset.elapsed = time.toFixed(3);
    if (!paused && !disposed) frame = requestAnimationFrame(tick);
  }
  // Gentle light on the original art, independent of cloth motion and scale.
  function setHighlight(id, immediate = false) {
    if (disposed) return;
    cancelAnimationFrame(highlightFrame);
    const start = performance.now();
    const from = entries.map(entry => entry.material.color.r);
    const paint = now => {
      if (disposed) return;
      const progress = immediate ? 1 : Math.min((now - start) / 420, 1);
      const eased = progress * progress * (3 - 2 * progress);
      entries.forEach((entry, index) => {
        if (!entry.illustrated) return;
        const target = entry.host.dataset.id === id ? 1.11 : 1;
        const light = from[index] + (target - from[index]) * eased;
        entry.material.color.setRGB(light, light, light);
      });
      if (paused) render();
      if (progress < 1) highlightFrame = requestAnimationFrame(paint);
    };
    paint(start);
  }
  signal?.addEventListener('abort', dispose, { once: true });
  view.addEventListener('webglcontextlost', contextLost, false);

  try {
    // Painted banners use unlit materials and never sample an environment map.
    if (standards.some(({host}) => !host.querySelector('.illustrated-standard'))) {
      const pmrem = new PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      try { environment = pmrem.fromScene(room, .06, .1, 100, { size: 128 }); }
      finally { room.dispose(); pmrem.dispose(); }
    }

    for (const { host, phase = 0, speed = 1 } of standards) {
      const illustration = host.querySelector('.illustrated-standard');
      if (illustration) {
        const { width, height, maps, material, shadowMaterials, viewPadding } = await illustratedBanner(illustration, renderer, { clock, phase, speed });
        if (disposed || renderer.getContext().isContextLost()) {
          material.dispose(); shadowMaterials.forEach(shadow=>shadow.dispose()); maps.map.dispose();
          throw disposed ? new DOMException('Cloth setup cancelled', 'AbortError') : new Error('Cloth context unavailable');
        }
        const size = new Vector2(width, height);
        const scene = new Scene();
        const padding=viewPadding||{x:VIEW_PADDING_X,top:0,bottom:VIEW_PADDING_BOTTOM};
        const camera = new OrthographicCamera(-width / 2 - padding.x, width / 2 + padding.x, height / 2 + padding.top, -height / 2 - padding.bottom, .1, 1000);
        camera.position.z = 500;
        const geometry = new PlaneGeometry(width, height, 48, 112);
        let shadowGeometry;
        if (shadowMaterials.length) {
          // Expand geometry as well as scissoring to include the penumbra.
          const halo=width*8/(Number(host.dataset.hallWidth)||width);
          shadowGeometry=new PlaneGeometry(width+2*halo,height+2*halo,48,112);
          const positions=shadowGeometry.attributes.position,uvs=shadowGeometry.attributes.uv;
          for(let i=0;i<positions.count;i++)uvs.setXY(i,positions.getX(i)/width+.5,positions.getY(i)/height+.5);
          shadowMaterials.forEach((shadowMaterial,index)=>{
            const shadow = new Mesh(shadowGeometry, shadowMaterial);
            shadow.position.z = -3+index;
            shadow.renderOrder=index;
            shadow.frustumCulled = false;
            scene.add(shadow);
          });
        }
        const banner = new Mesh(geometry, material);
        banner.renderOrder = 2;
        banner.frustumCulled = false;
        scene.add(banner);
        entries.push({host,geometry,shadowGeometry,material,shadowMaterials,maps,scene,camera,size,padding,bounds:{},illustrated:true});
        continue;
      }
      const source = host.querySelector('svg');
      const { width, height } = source.viewBox.baseVal;
      const size = new Vector2(width, height);
      const maps = await textileMaps(source, renderer, size);
      if (disposed) {
        Object.values(maps).forEach(texture => texture.dispose());
        throw new DOMException('Cloth setup cancelled', 'AbortError');
      }
      if (renderer.getContext().isContextLost()) {
        Object.values(maps).forEach(texture => texture.dispose());
        throw new Error('Cloth context unavailable');
      }
      const scene = new Scene();
      const camera = new OrthographicCamera(-width / 2 - VIEW_PADDING_X, width / 2 + VIEW_PADDING_X, height / 2, -height / 2 - VIEW_PADDING_BOTTOM, .1, 1000);
      camera.position.z = 500;
      scene.environment = environment.texture;
      scene.environmentIntensity = .38;
      scene.add(new HemisphereLight(0xf1ead8, 0x343933, .35));
      const key = new DirectionalLight(0xffeed0, 2.7);
      key.position.set(-300, 180, 145);
      scene.add(key);
      const fill = new DirectionalLight(0xb9c8dd, .25);
      fill.position.set(180, 70, 130);
      scene.add(fill);
      const material = new MeshPhysicalMaterial({
        map: maps.map, normalMap: maps.normalMap, normalScale: new Vector2(.55, .55),
        roughnessMap: maps.packed, metalnessMap: maps.packed, roughness: 1, metalness: 1,
        sheen: .32, sheenColor: 0xe0d7c4, sheenRoughness: .8,
        transparent: true, alphaTest: .08, depthWrite: true,
      });
      const motion = { clock, size, phase, speed };
      bindClothMaterial(material, motion);
      const main = host.dataset.id === 'imperial';
      const geometry = new PlaneGeometry(width, height, main ? 64 : 48, main ? 128 : 96);
      const cloth = new Mesh(geometry, material);
      cloth.frustumCulled = false;
      scene.add(cloth);
      const entry = { host, geometry, material, maps, scene, camera, size, bounds: {}, layers: [] };
      entries.push(entry);
      for (const [name, elevation] of [['cross', .4], ['badge', 2]]) {
        const layerMaps = await textileMaps(source, renderer, size, name);
        if (disposed) {
          Object.values(layerMaps).forEach(texture => texture.dispose());
          throw new DOMException('Cloth setup cancelled', 'AbortError');
        }
        const layerMaterial = new MeshPhysicalMaterial({
          map: layerMaps.map, normalMap: layerMaps.normalMap, normalScale: new Vector2(.38, .38),
          roughnessMap: layerMaps.packed, metalnessMap: layerMaps.packed,
          roughness: name === 'cross' ? 1 : .9, metalness: name === 'cross' ? 0 : .72,
          sheen: name === 'cross' ? .65 : .25, sheenColor: name === 'cross' ? 0x5e6257 : 0xd4b878,
          sheenRoughness: .85, transparent: true, alphaTest: .1, depthWrite: true,
        });
        bindClothMaterial(layerMaterial, motion);
        const layerGeometry = geometry.clone().translate(0, 0, elevation);
        const mesh = new Mesh(layerGeometry, layerMaterial);
        mesh.frustumCulled = false;
        scene.add(mesh);
        entry.layers.push({ geometry: layerGeometry, material: layerMaterial, maps: layerMaps });
      }
      entry.trim = createRaisedTrim(scene, motion);
      entry.hardware = createBannerHardware(scene);
      const sampleAt = point => createClothAnchor({ width, height, ...clothCoordinates(point), phase, speed });
      const anchors = [BANNER.left + 1, BANNER.right - 1].map(x => sampleAt([x, BANNER.bottom]));
      entry.tassels = createFlagTassels(scene, anchors, phase);
      entry.fringe = createHemFringe(scene, fringeRoots.map(sampleAt), phase);
    }

    stage.prepend(view);
    const resize = () => {
      if (disposed) return;
      const stageBounds = stage.getBoundingClientRect();
      const measurements = entries.map(entry => {
        const bounds=entry.host.getBoundingClientRect();
        const padding=entry.padding||{x:VIEW_PADDING_X,top:0,bottom:VIEW_PADDING_BOTTOM};
        return {entry,bounds,padX:padding.x*bounds.width/entry.size.x,
          padTop:padding.top*bounds.height/entry.size.y,padBottom:padding.bottom*bounds.height/entry.size.y};
      });
      const marginX = Math.max(...measurements.map(m=>m.padX));
      const marginTop = Math.max(...measurements.map(m=>m.padTop));
      const marginBottom = Math.max(...measurements.map(m=>m.padBottom));
      stageHeight = Math.max(1, stageBounds.height + marginTop + marginBottom);
      const canvasWidth = Math.max(1, stageBounds.width + marginX * 2);
      renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.5), stageBounds.width < 760 ? 1.5 : 1.75));
      renderer.setSize(canvasWidth, stageHeight, false);
      view.style.left = `${-marginX}px`;
      view.style.top = `${-marginTop}px`;
      view.style.width = `${canvasWidth}px`;
      view.style.height = `${stageHeight}px`;
      for (const { entry, bounds, padX, padTop, padBottom } of measurements) {
        entry.bounds = {
          left:bounds.left-stageBounds.left+marginX-padX,top:bounds.top-stageBounds.top+marginTop-padTop,
          width:bounds.width+padX*2,height:bounds.height+padTop+padBottom,
        };
      }
      render();
    };
    observer = new ResizeObserver(resize);
    observer.observe(stage);
    entries.forEach(entry => observer.observe(entry.host));
    resize();
    // All five viewports render before hiding the original image and SVGs.
    entries.forEach(entry => { entry.host.dataset.cloth = 'ready'; });
    stage.dataset.cloth = 'ready';
    view.dataset.flags = String(entries.length);
    const physicalFlags = entries.filter(entry => !entry.illustrated).length;
    view.dataset.tassels = String(physicalFlags * 2);
    view.dataset.fringe = String(physicalFlags * fringeRoots.length);
    view.dataset.illustrations = String(entries.length - physicalFlags);
    view.dataset.wallShadows = String(entries.reduce((count,entry)=>count+(entry.shadowMaterials?.length||0),0));
    view.dataset.construction = 'illustrated-main-with-cloth-companions';
    setPaused(paused);
    return { setPaused, setHighlight, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
