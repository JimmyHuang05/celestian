import { BANNER } from './imperial-banner-shape.js';
const CLOTH_WIDTH = BANNER.right - BANNER.left;
const CLOTH_DROP = BANNER.bottom - BANNER.top;
const TOP_OFFSET = BANNER.top - BANNER.viewTop;

export const clothVertexDeformation = /* glsl */`
  uniform float clothTime;
  uniform vec2 clothSize;
  uniform float motionPhase;
  uniform float motionSpeed;
  vec3 clothPoint(vec3 p) {
    float u = p.x / ${CLOTH_WIDTH.toFixed(1)} + .5;
    float v = clamp((clothSize.y * .5 - p.y - ${TOP_OFFSET.toFixed(1)}) / ${CLOTH_DROP.toFixed(1)}, 0.0, 1.0);
    float free = smoothstep(.025, .22, v);
    float phase = clothTime * .43 * motionSpeed + motionPhase;
    float fold = sin(u * 19.0 + .45 * sin(v * 3.0 - phase)) * 8.0;
    fold += sin(u * 37.0 + v * 2.8 - phase * .45) * 1.8;
    float breeze = sin(v * 7.0 - phase + u * 3.1) * 3.8 * v;
    p.z += free * (fold + breeze);
    p.x += free * (v * 1.7 * sin(phase + v * 3.2) + 1.2 * sin(u * 19.0 + v * 2.0 - phase * .35));
    p.y += free * (2.0 * sin(u * 19.0 + v * 3.0 - phase * .5) + v * 1.7);
    return p;
  }
`;

// CPU sampling uses the same surface as the vertex shader so tassel roots follow the hem.
export function createClothAnchor({ height, x, y, phase = 0, speed = 1 }) {
  const u = x / CLOTH_WIDTH + .5;
  const v = Math.min(1, Math.max(0, (height * .5 - y - TOP_OFFSET) / CLOTH_DROP));
  const t = Math.min(1, Math.max(0, (v - .025) / (.22 - .025)));
  const free = t * t * (3 - 2 * t);
  return (time, out) => {
    const angle = time * .43 * speed + phase;
    const fold = Math.sin(u * 19 + .45 * Math.sin(v * 3 - angle)) * 8
      + Math.sin(u * 37 + v * 2.8 - angle * .45) * 1.8;
    const breeze = Math.sin(v * 7 - angle + u * 3.1) * 3.8 * v;
    out[0] = x + free * (v * 1.7 * Math.sin(angle + v * 3.2) + 1.2 * Math.sin(u * 19 + v * 2 - angle * .35));
    out[1] = y + free * (2 * Math.sin(u * 19 + v * 3 - angle * .5) + v * 1.7);
    out[2] = free * (fold + breeze);
    return out;
  };
}

export function bindClothMaterial(material, { clock, size, phase, speed }, volumetric = false) {
  material.onBeforeCompile = shader => {
    shader.uniforms.clothTime = clock;
    shader.uniforms.clothSize = { value: size };
    shader.uniforms.motionPhase = { value: phase };
    shader.uniforms.motionSpeed = { value: speed };
    shader.vertexShader = clothVertexDeformation + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
      #include <beginnormal_vertex>
      vec3 tx = normalize(clothPoint(position + vec3(.1,0.,0.)) - clothPoint(position - vec3(.1,0.,0.)));
      vec3 ty = normalize(clothPoint(position + vec3(0.,.1,0.)) - clothPoint(position - vec3(0.,.1,0.)));
      vec3 nz = normalize(cross(tx, ty));
      objectNormal = ${volumetric ? 'normalize(tx * normal.x + ty * normal.y + nz * normal.z)' : 'nz'};
    `).replace('#include <begin_vertex>', 'vec3 transformed = clothPoint(position);');
  };
  material.customProgramCacheKey = () => `knightly-cloth-v3-${volumetric ? 'cord' : 'cloth'}`;
}

