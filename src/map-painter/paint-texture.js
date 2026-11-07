import { CHUNK } from './model.js'

// A display-only texture. Ownership stays discrete; alpha and coverage never
// enter the editable labels, backups, hit testing, or country boundaries.
export function paintTexture(labels, coverage, width, halo, resolution, feather, palette) {
  const distance = new Float32Array(coverage.length)
  for (let i = 0; i < distance.length; i++) distance[i] = coverage[i] < 255 ? coverage[i] / 255 : feather + 1
  for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x
    if (x) distance[i] = Math.min(distance[i], distance[i - 1] + 1)
    if (y) {
      distance[i] = Math.min(distance[i], distance[i - width] + 1)
      if (x) distance[i] = Math.min(distance[i], distance[i - width - 1] + Math.SQRT2)
      if (x + 1 < width) distance[i] = Math.min(distance[i], distance[i - width + 1] + Math.SQRT2)
    }
  }
  for (let y = width - 1; y >= 0; y--) for (let x = width - 1; x >= 0; x--) {
    const i = y * width + x
    if (x + 1 < width) distance[i] = Math.min(distance[i], distance[i + 1] + 1)
    if (y + 1 < width) {
      distance[i] = Math.min(distance[i], distance[i + width] + 1)
      if (x) distance[i] = Math.min(distance[i], distance[i + width - 1] + Math.SQRT2)
      if (x + 1 < width) distance[i] = Math.min(distance[i], distance[i + width + 1] + Math.SQRT2)
    }
  }
  const step = CHUNK / resolution, side = resolution + 2
  const rgba = new Uint8ClampedArray(side * side * 4)
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    let alpha = 0, red = 0, green = 0, blue = 0
    for (let dy = 0; dy < step; dy++) for (let dx = 0; dx < step; dx++) {
      const i = (halo + (y - 1) * step + dy) * width + halo + (x - 1) * step + dx
      if (!coverage[i]) continue
      let owner = labels[i]
      // Only recover the fractional coastline discarded by the edit mask's
      // 50% threshold. Never hide a genuine empty land pixel or cross water.
      if (!owner && coverage[i] < 128) {
        for (const n of [i - 1, i + 1, i - width, i + width]) {
          if (!coverage[n] || !labels[n]) continue
          if (owner && owner !== labels[n]) { owner = 0; break }
          owner = labels[n]
        }
      }
      const color = palette.get(owner)
      if (!color) continue
      const t = Math.min(1, distance[i] / Math.max(1, feather))
      const a = coverage[i] / 255 * (t * t * (3 - 2 * t))
      alpha += a; red += color[0] * a; green += color[1] * a; blue += color[2] * a
    }
    if (!alpha) continue
    const out = (y * side + x) * 4
    rgba[out] = red / alpha; rgba[out + 1] = green / alpha; rgba[out + 2] = blue / alpha
    rgba[out + 3] = alpha / (step * step) * 255
  }
  return rgba
}
