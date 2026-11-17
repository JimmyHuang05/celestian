// Deterministic ink marks on the approved Bezier centerline. No positional
// jitter, SVG filters, per-frame work or zoom-dependent random regeneration.
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
function split(c, t) {
  const a = mix(c[0], c[1], t), b = mix(c[1], c[2], t), d = mix(c[2], c[3], t)
  const e = mix(a, b, t), f = mix(b, d, t), p = mix(e, f, t)
  return [[c[0], a, e, p], [p, f, d, c[3]]]
}
function section(c, start, end) {
  const left = end < 1 ? split(c, end)[0] : c
  return start > 0 ? split(left, start / end)[1] : left
}
function rng(id) {
  let seed = 2166136261
  for (const c of id) seed = Math.imul(seed ^ c.charCodeAt(0), 16777619)
  return () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296 }
}
export function routeInk(route, { pixelsPerUnit = 1 } = {}) {
  if (!route.curves?.length) return null
  // Keep approved geography on one artboard. At settled overview zooms, widen
  // ink and lengthen marks just enough to preserve a readable route hierarchy.
  const random = rng(route.id), hidden = new Set(route.hiddenCurves || [])
  const bins = new Map(), hiddenScale = route.seasonal ? .65 : 1
  const trunk = route.mode === 'ocean'
  const feeder = route.family === 'amber' || route.family === 'colonial'
  const tier = feeder ? .80 : trunk ? 1.10 : 1
  const minimum = feeder ? .68 : trunk ? 1.12 : .92
  const boost = Math.max(1, Math.min(1.6, minimum / (9.1 * tier * pixelsPerUnit)))
  const dashScale = Math.max(1, Math.min(2.3, (feeder ? 2.6 : trunk ? 4.3 : 3.4) / (32 * pixelsPerUnit)))
  const colors = feeder ? ['#908067', '#998870', '#89795f'] : trunk ? ['#806444', '#896e4c', '#785e40'] : ['#806b50', '#897357', '#78664e']
  const widths = [5.9, 9.1, 10.5].map(w => w * tier * boost * 1.12)
  let distance = 0, strokeStart = 0, strokeLength = (27 + random() * 10) * dashScale, tone = 0, weight = 1
  const pair = p => p.map(n => Number(n.toFixed(3))).join(' ')
  function add(c, bin, ink) {
    const key = `${bin}-${ink}`
    if (!bins.has(key)) bins.set(key, { d: '', width: widths[bin], color: colors[ink], opacity: (.82 + ink * .045) * hiddenScale })
    bins.get(key).d += `M${pair(c[0])}C${pair(c[1])} ${pair(c[2])} ${pair(c[3])}`
  }
  for (const [index, normalized] of route.curves.entries()) {
    const c = normalized.map(p => [p[0] * 21600, p[1] * 10800])
    const estimate = c.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - c[i][0], p[1] - c[i][1]), 0)
    const count = Math.max(8, Math.ceil(estimate / 2))
    const table = [{ t: 0, length: 0 }]
    let previous = c[0], length = 0
    for (let i = 1; i <= count; i++) {
      const t = i / count, p = split(c, t)[0][3]
      length += Math.hypot(p[0] - previous[0], p[1] - previous[1])
      table.push({ t, length }); previous = p
    }
    function parameter(s) {
      if (s <= 0) return 0
      if (s >= length) return 1
      let low = 0, high = table.length - 1
      while (high - low > 1) { const mid = (low + high) >> 1; if (table[mid].length < s) low = mid; else high = mid }
      const a = table[low], b = table[high]
      return a.t + (b.t - a.t) * (s - a.length) / (b.length - a.length)
    }
    const end = distance + length
    while (strokeStart < end) {
      const strokeEnd = strokeStart + strokeLength
      if (!hidden.has(index)) {
        // Pressure varies across the mark without displacing its centerline.
        const cuts = [strokeStart, strokeStart + strokeLength * .14, strokeStart + strokeLength * .84, strokeEnd]
        for (let j = 0; j < 3; j++) {
          const a = Math.max(distance, cuts[j]), b = Math.min(end, cuts[j + 1])
          if (b - a > .01) add(section(c, parameter(a - distance), parameter(b - distance)), j === 1 ? weight : 0, tone)
        }
      }
      if (strokeEnd >= end) break
      strokeStart = strokeEnd + (26 + random() * 8) * dashScale * 1.10
      strokeLength = ((route.seasonal ? 8 : 27) + random() * (route.seasonal ? 3 : 10)) * dashScale
      tone = Math.floor(random() * 3); weight = random() < .30 ? 2 : 1
    }
    distance = end
  }
  return [...bins.values()]
}
