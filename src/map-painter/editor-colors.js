import { CHUNK } from './model.js'

export function assignEditorColors(model) {
  const graph = new Map(model.regions.map(r => [r.id, new Set()]))
  const link = (a, b) => { if (a && b && a !== b && graph.has(a) && graph.has(b)) { graph.get(a).add(b); graph.get(b).add(a) } }
  for (const [key, chunk] of model.chunks) {
    const [x, y] = key.split(',').map(Number), right = model.chunks.get(`${x + 1},${y}`)?.labels, below = model.chunks.get(`${x},${y + 1}`)?.labels
    for (let i = 0; i < chunk.labels.length; i++) {
      const a = chunk.labels[i]
      link(a, i % CHUNK < CHUNK - 1 ? chunk.labels[i + 1] : right?.[i - CHUNK + 1])
      link(a, i < CHUNK * (CHUNK - 1) ? chunk.labels[i + CHUNK] : below?.[i % CHUNK])
      // Include narrow unassigned seams between imported polygons.
      if (a && i % CHUNK < CHUNK - 4) for (let d = 2; d <= 4; d++) link(a, chunk.labels[i + d])
    }
  }
  const candidates = Array.from({ length: Math.max(360, model.regions.length * 4) }, (_, i) => {
    const h = (i * 137.508 % 360) / 60, s = .72, l = [.58, .72, .46][i % 3], c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(h % 2 - 1)), m = l - c / 2
    const rgb = (h < 1 ? [c,x,0] : h < 2 ? [x,c,0] : h < 3 ? [0,c,x] : h < 4 ? [0,x,c] : h < 5 ? [x,0,c] : [c,0,x]).map(v => Math.round((v + m) * 255))
    return { rgb, hex: '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('') }
  })
  const assigned = new Map(), used = new Set()
  const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]))
  for (const region of [...model.regions].sort((a,b) => graph.get(b.id).size - graph.get(a.id).size || a.id - b.id)) {
    const adjacent = [...graph.get(region.id)].map(id => assigned.get(id)).filter(Boolean)
    let best, score = -1
    for (const candidate of candidates) {
      if (used.has(candidate.hex)) continue
      const global = Math.min(442, ...[...assigned.values()].map(rgb => distance(candidate.rgb, rgb)))
      const local = adjacent.length ? Math.min(...adjacent.map(rgb => distance(candidate.rgb, rgb))) : global
      const value = local + global * .15
      if (value > score) { score = value; best = candidate }
    }
    region.color = best.hex; used.add(best.hex); assigned.set(region.id, best.rgb)
  }
}
