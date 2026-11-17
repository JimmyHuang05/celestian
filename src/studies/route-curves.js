// Coordinates remain normalized to the map, independent of zoom and viewport.
export function routePath(points, width, height, smooth = .75, curves, hiddenCurves = []) {
  if (curves?.length) {
    const pair = p => `${Number((p[0] * width).toFixed(2))} ${Number((p[1] * height).toFixed(2))}`
    const hidden = new Set(hiddenCurves)
    return curves.map((c, i) => hidden.has(i) ? '' :
      `${i === 0 || hidden.has(i-1) ? `M${pair(c[0])}` : ''} C${pair(c[1])} ${pair(c[2])} ${pair(c[3])}`).join('')
  }
  const p = points.map(([x, y]) => [x * width, y * height])
  const pair = a => a.map(v => Number(v.toFixed(2))).join(' ')
  if (!p.length) return ''
  if (p.length === 1) return `M${pair(p[0])}`
  if (p.length === 2) return `M${pair(p[0])} L${pair(p[1])}`
  let path = `M${pair(p[0])}`
  for (let i = 0; i < p.length - 1; i++) {
    const prev = p[Math.max(0, i - 1)], a = p[i], b = p[i + 1], next = p[Math.min(p.length - 1, i + 2)]
    const c1 = a.map((v, axis) => v + (b[axis] - prev[axis]) * smooth / 6)
    const c2 = b.map((v, axis) => v - (next[axis] - a[axis]) * smooth / 6)
    path += ` C${pair(c1)} ${pair(c2)} ${pair(b)}`
  }
  return path
}

export function validRoutes(data) {
  return data?.version === 1 && Array.isArray(data.routes) && data.routes.length <= 100 &&
    new Set(data.routes.map(r => r.id)).size === data.routes.length &&
    data.routes.every(r => typeof r.id === 'string' && /^[\w-]{1,100}$/.test(r.id) &&
      typeof r.name === 'string' && r.name.length <= 120 &&
      Number.isFinite(r.smooth) && r.smooth >= 0 && r.smooth <= 1 &&
      (r.hiddenCurves === undefined || (Array.isArray(r.hiddenCurves) && r.hiddenCurves.every(i => Number.isInteger(i) && i >= 0 && i < (r.curves?.length || 0)))) &&
      Array.isArray(r.points) && r.points.length <= 300 && r.points.every(p =>
        Array.isArray(p) && p.length === 2 && p.every(n => Number.isFinite(n) && n >= 0 && n <= 1)) &&
      (r.curves === undefined || (Array.isArray(r.curves) && r.curves.length <= 600 && r.curves.every((c, i) =>
        Array.isArray(c) && c.length === 4 && c.every(p => Array.isArray(p) && p.length === 2 &&
          Number.isFinite(p[0]) && p[0] >= -1 && p[0] <= 2 && Number.isFinite(p[1]) && p[1] >= 0 && p[1] <= 1) &&
        (i === 0 || c[0].every((v, axis) => Math.abs(v - r.curves[i-1][3][axis]) < 1e-8))))))
}
