export const atmosphereOptions = [
  { id: 4, name: '原画流动', description: '原画细纹缓缓舒展，白膜、金丝与暗部各自流动。' },
  { id: 1, name: '雾团', description: '三团雾体缓慢游移，细密的边缘不断聚散。' },
  { id: 2, name: '流纱', description: '黑、白、金三束流纱，舒展、交错、彼此遮映。' },
  { id: 3, name: '墨潮', description: '三片墨潮推移，清晰的分界生出细小的涟纹。' },
];

// Each material owns a separate field. White and gold never share a color ramp.
// A small repeating noise texture provides detail at native-sized rendering.
export const atmosphereFragment = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform int uVariant;
uniform sampler2D uNoise;
uniform sampler2D uArtwork;
uniform float uArtworkAspect;

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return texture2D(uNoise, (i + f + .5) / 256.).r;
}
float fbm(vec2 p) {
  float sum = 0., amp = .53;
  mat2 spin = mat2(.8, -.6, .6, .8);
  for (int i = 0; i < 5; i++) {
    sum += amp * noise(p);
    p = spin * p * 2.07 + vec2(11.7, 5.3);
    amp *= .48;
  }
  return sum;
}
mat2 rotate(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

// Alpha, internal light. Distinct moving seeds prevent synchronized morphing.
vec2 mist(vec2 p, vec2 center, vec2 size, float angle, float seed, float t) {
  vec2 d = rotate(angle) * (p - center) / size;
  vec2 drift = vec2(t * .15, -t * .12);
  vec2 warp = vec2(fbm(d * 1.9 + seed + drift), fbm(d * 1.9 + seed + 17. - drift));
  vec2 q = d + (warp - .5) * .72;
  float body = fbm(q * 3.2 + warp * 2. + seed - drift);
  float tendrils = fbm(q * 15. + warp * 8. + seed + drift * .5);
  float radius = length(q * vec2(1., 1.13));
  float edge = 1. - smoothstep(.57 + body * .38, 1.02 + body * .32, radius);
  float billows = smoothstep(.17, .76, body);
  float filaments = pow(clamp(tendrils * 1.45, 0., 1.), 3.);
  float alpha = edge * (.25 + .66 * billows + .23 * filaments);
  float glow = .19 + .61 * billows + .23 * filaments;
  return vec2(clamp(alpha, 0., 1.), glow);
}

vec2 silk(vec2 p, vec2 center, float angle, float seed, float t) {
  vec2 q = rotate(angle) * (p - center);
  float bend = .13 * sin(q.x * 4. + t + seed) + .045 * sin(q.x * 9. - t * .7);
  float grain = fbm(vec2(q.x * 3. - t * .18, q.y * 2.) + seed);
  float d = q.y - bend - (grain - .5) * .13;
  float width = .13 + .06 * sin(q.x * 2.5 + t * .6 + seed) + grain * .11;
  float envelope = (1. - smoothstep(width * .64, width + .07, abs(d)))
                 * (1. - smoothstep(.6, 1.25, abs(q.x)));
  float phase = d * 185. + grain * 14. + sin(q.x * 3. + t) * 4.;
  float pleat = pow(.5 + .5 * sin(phase), 5.);
  float thread = pow(.5 + .5 * sin(phase * 3.1 + noise(q * 55. + seed) * .8), 15.);
  float light = .14 + pleat * .6 + thread * .26;
  return vec2(envelope * (.36 + .64 * light), light);
}

vec3 separateLayers(vec3 base, vec2 white, vec2 gold, vec2 black) {
  vec3 pearl = vec3(.86, .865, .86) * white.y;
  vec3 oldGold = vec3(.76, .69, .53) * gold.y;
  // Select the front material, rather than averaging white with gold.
  vec3 color = white.x > gold.x ? mix(base, pearl, white.x) : mix(base, oldGold, gold.x);
  return mix(color, vec3(.003, .004, .004) + black.y * .007, black.x * .97);
}

vec3 mistScene(vec2 p, float aspect, float t) {
  vec2 cw = vec2(-.30 * aspect + .085 * sin(t * .8), .20 + .09 * cos(t * .61));
  vec2 cg = vec2(.30 * aspect + .09 * cos(t * .65), -.13 + .11 * sin(t * .71));
  vec2 cb = vec2(.08 * aspect * sin(t * .55 + .8), .09 * cos(t * .67));
  vec2 w = mist(p, cw, vec2(.46, .49), -.55 + .12 * sin(t * .4), 2.3, t);
  vec2 g = mist(p, cg, vec2(.45, .5), .65 + .18 * cos(t * .43), 19.6, t * .83);
  vec2 b = mist(p, cb, vec2(.36, .57), -.2 + .22 * sin(t * .49), 46.1, t * .91);
  return separateLayers(vec3(.027, .029, .03), w, g, b);
}

vec3 silkScene(vec2 p, float aspect, float t) {
  vec2 w = silk(p, vec2(-.15 * aspect + .06 * sin(t * .7), .14 + .045 * cos(t)), -.6 + .12 * sin(t * .43), 1.7, t);
  vec2 g = silk(p, vec2(.13 * aspect + .07 * cos(t * .61), -.1 + .05 * sin(t * .8)), .75 + .13 * cos(t * .48), 8.6, t * .77);
  vec2 b = silk(p, vec2(.1 * sin(t * .45), -.025 + .05 * cos(t * .63)), .12 + .3 * sin(t * .31), 15.3, t * .85);
  b.x = clamp(b.x * 1.35, 0., 1.);
  return separateLayers(vec3(.022, .025, .027), w, g, b);
}

vec3 inkScene(vec2 p, float aspect, float t) {
  vec2 warp = vec2(fbm(p * 3. + vec2(t * .1, 4.)), fbm(p * 3. + vec2(18., -t * .11)));
  vec2 q = p + (warp - .5) * .43;
  q += (vec2(noise(q * 47. + t * .1), noise(q * 43. - t * .13 + 9.)) - .5) * .006;
  vec2 cw = vec2(-.34 * aspect + .07 * sin(t * .7), .20 + .08 * cos(t * .5));
  vec2 cg = vec2(.34 * aspect + .07 * cos(t * .61), -.22 + .09 * sin(t * .63));
  vec2 cb = vec2(.11 * sin(t * .53), .02 + .09 * cos(t * .43));
  float w = length((q - cw) * vec2(.85, 1.));
  float g = length((q - cg) * vec2(.88, 1.));
  float b = length((q - cb) * vec2(1.3, .75)) * .88;
  float own, other, seed;
  vec3 pigment;
  if (w < g && w < b) { own = w; other = min(g, b); seed = 3.; pigment = vec3(.76, .77, .76); }
  else if (g < b) { own = g; other = min(w, b); seed = 19.; pigment = vec3(.70, .64, .49); }
  else { own = b; other = min(w, g); seed = 31.; pigment = vec3(.023, .025, .026); }
  float depth = fbm(q * 8. + warp * 4. + seed - t * .13);
  float fine = noise(q * 175. + warp * 11. + seed);
  float distanceToEdge = other - own;
  float rim = exp(-distanceToEdge * 95.);
  float ripples = pow(.5 + .5 * cos(distanceToEdge * 275. + depth * 7.), 14.) * exp(-distanceToEdge * 17.);
  vec3 color = pigment * (.28 + .5 * depth + .07 * fine + .25 * ripples);
  color *= 1. - rim * .67;
  return color;
}

vec3 artworkScene(vec2 uv, float aspect, float t) {
  vec2 fit = vec2(min(1., aspect / uArtworkAspect), min(1., uArtworkAspect / aspect));
  vec2 base = (uv - .5) * fit / 1.025 + .5;
  // Broad masks follow the artwork's composition; per-pixel luminance masks
  // would pull adjacent fine threads apart and damage the original detail.
  vec2 goldRegion = (base - vec2(.19, .19)) * vec2(2.8, 3.3);
  vec2 whiteRight = (base - vec2(.90, .84)) * vec2(3.2, 2.9);
  vec2 whiteLeft = (base - vec2(.07, .58)) * vec2(4.3, 3.7);
  float gold = exp(-dot(goldRegion, goldRegion));
  float white = clamp(exp(-dot(whiteRight, whiteRight)) + .9 * exp(-dot(whiteLeft, whiteLeft)), 0., 1.) * (1. - gold);
  float darkness = 1. - max(white, gold);
  vec2 p = base * vec2(uArtworkAspect, 1.);
  vec2 broad = vec2(
    sin(p.y * 6.3 + t * .61) - sin(p.y * 6.3),
    cos(p.x * 5.1 - t * .49) - cos(p.x * 5.1)
  );
  vec2 fine = vec2(fbm(p * 5. + vec2(t * .08, 6.)), fbm(p * 5. + vec2(19., -t * .07))) - .5;
  vec2 whiteFlow = broad * .019 + fine * .0085 * sin(t * .57);
  vec2 goldFlow = vec2(sin(p.y * 8. - t * .43) - sin(p.y * 8.),
                       sin(p.x * 7. + t * .38) - sin(p.x * 7.)) * .022;
  vec2 darkFlow = broad * .0095;
  vec2 flow = whiteFlow * white + goldFlow * gold + darkFlow * darkness;
  float quietCenter = smoothstep(.06, .42, length((base - .5) * vec2(1.5, 1.)));
  float edgeGuard = smoothstep(0., .10, min(min(base.x, 1. - base.x), min(base.y, 1. - base.y)));
  vec2 warped = base + flow * quietCenter * edgeGuard;
  vec3 color = texture2D(uArtwork, warped).rgb;
  color *= 1. + white * .025 * sin(t * .8 + p.y * 4.) + gold * .045 * sin(t * .67 + p.x * 5.);
  return color;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (uv - .5) * vec2(aspect, 1.);
  float t = uTime * .12;
  if (uVariant == 4) {
    gl_FragColor = vec4(artworkScene(uv, aspect, uTime * .50), 1.);
    return;
  }
  vec3 color;
  if (uVariant == 1) color = mistScene(p, aspect, t);
  else if (uVariant == 2) color = silkScene(p, aspect, t);
  else color = inkScene(p, aspect, t);
  float edge = smoothstep(.48, 1.05, length((uv - .5) * vec2(1., 1.15)));
  color *= 1. - edge * .22;
  color += (texture2D(uNoise, gl_FragCoord.xy / 256.).r - .5) * .002;
  gl_FragColor = vec4(color, 1.);
}
`;
