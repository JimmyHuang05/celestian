// The landscape supplies its own dark surround. Sample the visible 21:9 crop,
// favouring midtones and the edges where the illustration dissolves into the page.
const palettes = new Map();
const transitions = new WeakMap();
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function extractSurround(image) {
  const canvas = document.createElement('canvas');
  canvas.width = 112;
  canvas.height = 48;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas is unavailable');
  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
  context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const sums = [0, 0, 0];
  let total = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const offset = (y * canvas.width + x) * 4;
      if (data[offset + 3] < 128) continue;
      const rgb = [data[offset], data[offset + 1], data[offset + 2]].map(v => v / 255);
      const high = Math.max(...rgb), low = Math.min(...rgb), light = (high + low) / 2;
      // Glints and near-black silhouettes should not dictate the whole page.
      if (light < .06 || light > .92) continue;
      const edge = Math.max(Math.abs(x / (canvas.width - 1) - .5) * 2, y / (canvas.height - 1));
      const weight = (.4 + (high - low) * 2) * (1 - Math.abs(light - .42) * 1.2) * (1 + edge * .65);
      rgb.forEach((channel, i) => { sums[i] += channel * weight; });
      total += weight;
    }
  }
  if (!total) return '26 28 29';
  const [r, g, b] = sums.map(value => value / total);
  const high = Math.max(r, g, b), low = Math.min(r, g, b), delta = high - low;
  const light = (high + low) / 2;
  const saturation = delta ? delta / (1 - Math.abs(2 * light - 1)) : 0;
  let hue = 0;
  if (delta) {
    if (high === r) hue = ((g - b) / delta + 6) % 6;
    else if (high === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  // Keep each scene's hue, with a restrained chroma and a readable dark value.
  // Almost monochrome images stay neutral rather than acquiring an invented tint.
  const s = saturation < .025 ? saturation : clamp(saturation * 1.15 + .06, 0, .38);
  const l = clamp(.10 + light * .16, .12, .20);
  const a = s * Math.min(l, 1 - l);
  return [0, 8, 4].map(n => {
    const k = (n + hue * 2) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  }).join(' ');
}

export function applyScenePalette(section, {image = section.querySelector('.picture img'), duration = 0} = {}) {
  if (!image) return;
  const source = image.src;
  const apply = rgb => {
    // A late image decode must not recolour a newer scene or another concept.
    if (!section.isConnected || image.src !== source) return;
    const previous = transitions.get(section);
    if (previous) cancelAnimationFrame(previous);
    const from = getComputedStyle(section).getPropertyValue('--scene-rgb').trim().split(/\s+/).map(Number);
    const to = rgb.split(' ').map(Number);
    const start = performance.now();
    const tick = now => {
      if (!section.isConnected) return;
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      const eased = t * t * (3 - 2 * t);
      section.style.setProperty('--scene-rgb', to.map((v, i) => Math.round(from[i] + (v - from[i]) * eased)).join(' '));
      if (t < 1) transitions.set(section, requestAnimationFrame(tick));
      else transitions.delete(section);
    };
    tick(start);
    section.dataset.palette = 'ready';
  };
  if (palettes.has(source)) {
    apply(palettes.get(source));
    return;
  }
  image.decode().then(() => {
    if (!section.isConnected || image.src !== source) return;
    const rgb = extractSurround(image);
    palettes.set(source, rgb);
    apply(rgb);
  }).catch(() => {
    // Keep the neutral CSS fallback if the image cannot load or be sampled.
    if (section.isConnected) section.dataset.palette = 'fallback';
  });
}
