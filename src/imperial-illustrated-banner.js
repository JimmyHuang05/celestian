import { MeshBasicMaterial, SRGBColorSpace, Texture } from 'three';

// Preserve the painted folds and embroidery. The hall supplies restrained
// incident light over the baked artwork, rather than a second full PBR response.
export async function illustratedBanner(source, renderer, { clock, phase, speed }) {
  await source.decode();
  const host = source.closest('.standard-button, button');
  const projection = host?.dataset.hallProjection ? JSON.parse(host.dataset.hallProjection) : null;
  const width = 220;
  const height = width * (projection ? projection.bounds.height/projection.bounds.width : source.naturalHeight/source.naturalWidth);
  const wallLean = Number(host?.dataset.wallLean) || 0;
  const wallTaper = Number(host?.dataset.wallTaper) || 0;
  const hall = !!source.closest('.hall-scene');
  const silver = ['lynx', 'wolf'].includes(host?.dataset.id);
  // Niche visibility factors, not five independent lamps/exposure settings.
  const windowVisibility = { lion: .96, bear: .62, imperial: .83, lynx: .40, wolf: .22 }[host?.dataset.id] ?? 1;
  const hallWidth = Number(host?.dataset.hallWidth) || width;
  const hallX = Number(host?.dataset.hallX) || 0;
  const hallY = Number(host?.dataset.hallY) || 0;
  const hallHeight = hallWidth * height / width;
  // Composite SVGs rasterize at their intrinsic size, preserving the approved art.
  let textureSource = source;
  if (new URL(source.currentSrc || source.src).pathname.endsWith('.svg')) {
    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    textureSource = canvas;
  }
  const map = new Texture(textureSource);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  map.needsUpdate = true;
  const glMatrix = m => `mat3(${[m[0],m[3],m[6],m[1],m[4],m[7],m[2],m[5],m[8]].map(v=>Number(v).toFixed(10)).join(',')})`;
  const projectToWall = projection ? `
    vec2 sourceUv = vec2(transformed.x / ${width.toFixed(4)} + .5, .5 - transformed.y / ${height.toFixed(4)});
    vec3 projectedPoint;
    if(sourceUv.y < .082) projectedPoint = ${glMatrix(projection.rigging)} * vec3(sourceUv, 1.);
    else projectedPoint = ${glMatrix(projection.body)} * vec3(sourceUv, 1.);
    vec2 wallUv = projectedPoint.xy / projectedPoint.z;
    transformed.x = (wallUv.x - .5) * ${width.toFixed(4)};
    transformed.y = (.5 - wallUv.y) * ${height.toFixed(4)};
  ` : `
    float fullDrop = clamp(.5 - position.y / ${height.toFixed(4)}, 0., 1.);
    transformed.x *= 1. - fullDrop * ${wallTaper.toFixed(5)};
    transformed.y += transformed.x * ${wallLean.toFixed(5)};
  `;
  const vertexMotion = `
    vec3 transformed = position;
    float u = position.x / ${width.toFixed(4)} + .5;
    float drop = clamp((.5 - position.y / ${height.toFixed(4)} - .109) / .891, 0., 1.);
    float free = smoothstep(0., .16, drop) * drop;
    float phase = illustrationTime * .45 * illustrationSpeed + illustrationPhase;
    transformed.x += free * ${width.toFixed(4)} * (
      .008 * sin(phase - drop * 2.4) + .002 * sin(u * 9. + drop * 4. - phase * .65));
    transformed.y += free * ${width.toFixed(4)} * .002 * sin(u * 8. + drop * 3. - phase * .8);
    // Project the cloth and its moving shadow through the approved wall plane.
    // The short upper cord has its own continuous projection to the exact pin.
    ${projectToWall}
  `;
  const bindMotion = (shader, extra = '') => {
    shader.uniforms.illustrationTime = clock;
    shader.uniforms.illustrationPhase = { value: phase };
    shader.uniforms.illustrationSpeed = { value: speed };
    shader.vertexShader = `
      uniform float illustrationTime;
      uniform float illustrationPhase;
      uniform float illustrationSpeed;
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', vertexMotion + extra);
  };
  const material = new MeshBasicMaterial({
    map, transparent: true, alphaTest: .01, depthWrite: false, toneMapped: false,
  });
  material.onBeforeCompile = shader => {
    bindMotion(shader, hall ? `
      // All flags sample one fixed artboard, including their small displacement.
      vHallPosition = vec2(
        (${hallX.toFixed(4)} + (transformed.x / ${width.toFixed(4)} + .5) * ${hallWidth.toFixed(4)}) / 1672.,
        (${hallY.toFixed(4)} + (.5 - transformed.y / ${height.toFixed(4)}) * ${hallHeight.toFixed(4)}) / 941.);
      vFoldBreath = free * sin(phase - drop * 2.4);
    ` : '');
    if (!hall) return;
    shader.vertexShader = 'varying vec2 vHallPosition; varying float vFoldBreath;\n' + shader.vertexShader;
    shader.fragmentShader = `
      varying vec2 vHallPosition;
      varying float vFoldBreath;
      float hallPool(vec2 p, vec2 centre, vec2 radius) {
        vec2 delta = (p - centre) / radius;
        return exp(-dot(delta, delta));
      }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      vec2 p = vHallPosition;
      float belowRod = clamp((.891 - vMapUv.y) / .891, 0., 1.);
      // Diagonal window light and the warm pool on the lower central stonework.
      float shaft = exp(-pow((p.y - (1.12 * p.x + .07)) / .24, 2.));
      float direct = .48 * exp(-1.35 * p.x) * shaft * ${windowVisibility.toFixed(3)};
      float sky = mix(.36, .23, smoothstep(.10, .90, p.x));
      float stone = .105 * hallPool(p, vec2(.48, .64), vec2(.23, .38))
        + .045 * hallPool(p, vec2(.23, .50), vec2(.12, .26));
      float reveal = mix(.85, 1., smoothstep(.07, .19, vMapUv.x))
        * mix(1., .82, smoothstep(.80, .94, vMapUv.x));
      float underRod = 1. - .11 * exp(-pow((belowRod - .016) / .025, 2.));
      vec3 incident = (vec3(.94, .96, 1.) * sky
        + vec3(1., .89, .73) * direct
        + vec3(1., .91, .78) * stone) * reveal * underRod;

      // Conservative colour gates distinguish thread from dyed fabric. Ivory
      // cloth is excluded from the silver gate; no new texture replaces the art.
      vec3 paint = outgoingLight;
      float high = max(max(paint.r, paint.g), paint.b);
      float low = min(min(paint.r, paint.g), paint.b);
      float chroma = (high - low) / max(high, .001);
      float luma = dot(paint, vec3(.2126, .7152, .0722));
      float gold = smoothstep(1.03, 1.16, paint.r / max(paint.g, .001))
        * smoothstep(.40, .65, paint.g / max(paint.r, .001))
        * (1. - smoothstep(.48, .70, paint.b / max(paint.r, .001)));
      float silver = ${silver ? '1.' : '0.'} * (1. - smoothstep(.32, .57, chroma));
      float metal = clamp(gold + silver, 0., 1.) * smoothstep(.04, .16, luma);
      paint = mix(vec3(luma), paint, mix(.79, .88, metal));
      // Compress only the brightest cloth details, leaving heraldic edges sharp.
      paint *= 1. - (1. - metal) * .14 * smoothstep(.30, .90, luma);
      outgoingLight = paint * incident;
      // Small reflections occur only on existing raised highlights.
      float raised = smoothstep(.20, .78, luma);
      float reflection = (direct * .22 + stone * .13 + sky * .035)
        * (1. + .045 * vFoldBreath);
      outgoingLight += paint * metal * raised * reflection * vec3(1., .94, .83);
      outgoingLight += vec3(.0018, .00165, .00135) * (1. - metal) * (sky + stone);
      // A small exposure lift on the flag face, retaining the hall's light falloff.
      outgoingLight *= 1. + .14 * smoothstep(.09, .13, 1. - vMapUv.y);
      #include <opaque_fragment>
    `);
  };
  const cacheKey = `illustrated-hall-v8-${JSON.stringify(projection)}-${height}-${wallLean}-${wallTaper}-${hall}-${hallX}-${hallY}-${hallWidth}-${windowVisibility}-${silver}`;
  material.customProgramCacheKey = () => cacheKey;

  // Black alpha preserves the stone texture; nonzero RGB was too light after
  // sRGB conversion. Shared artboard units keep one light direction/depth.
  const shadowMaterials = [];
  let viewPadding;
  if (hall) {
    const pixel = width / hallWidth;
    viewPadding = {x:36*pixel,top:9*pixel,bottom:42*pixel};
    for (const contact of [false,true]) {
      const shadow = new MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false});
      shadow.onBeforeCompile = shader => {
        bindMotion(shader, `
          float lifted = smoothstep(.0, .13, drop);
          float clearance = ${contact ? '.75 + 1.35 * lifted' : '1.1 + lifted * (7.0 + 11.0 * drop) + 1.8 * free * sin(phase - drop * 2.4)'};
          transformed.x += clearance * ${pixel.toFixed(6)};
          transformed.y -= clearance * ${(1.12*pixel).toFixed(6)};
        `);
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_pars_fragment>', `
          #include <map_pars_fragment>
          float wallAlpha(vec2 uv) {
            if(uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) return 0.;
            return texture2D(map, uv).a;
          }
        `);
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
          float drop = clamp((.891 - vMapUv.y) / .891, 0., 1.);
          float softness = ${contact ? '.7 + .45 * smoothstep(.0,.13,drop)' : '.65 + smoothstep(.0,.13,drop) * (1.35 + 2.2 * drop)'};
          vec2 spread = vec2(softness / ${hallWidth.toFixed(4)}, softness / ${hallHeight.toFixed(4)}) * .5;
          float silhouette = 0.;
          float totalWeight = 0.;
          for(int y=-2;y<=2;y++) for(int x=-2;x<=2;x++) {
            float weight = exp(-.5 * float(x*x+y*y));
            silhouette += wallAlpha(vMapUv + vec2(float(x),float(y))*spread) * weight;
            totalWeight += weight;
          }
          diffuseColor.rgb = vec3(0.);
          diffuseColor.a *= silhouette / totalWeight * ${contact ? '.20' : (.34+.27*windowVisibility).toFixed(3)};
        `);
      };
      shadow.customProgramCacheKey = () => cacheKey + (contact ? '-contact-v2' : '-cast-v2');
      shadowMaterials.push(shadow);
    }
  }
  return {width,height,maps:{map},material,shadowMaterials,viewPadding};
}
