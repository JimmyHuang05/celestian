import { visibleLabels } from './map-ui/label-visibility.js'

export function attachLabelDisplay(map, svg, index, metadata, options = {}) {
  const elements = new Map()
  const parts = new Map([...svg.querySelectorAll('path[id], g[data-map-text][id]')].filter(part => !part.closest('defs') && !(part.tagName.toLowerCase()==='path' && part.closest('g[data-map-text]'))).map(part => [part.id, part]))
  const rows = index?.data
  // Fail open to the complete original lettering if an index and artwork disagree.
  const used = new Set()
  const valid = index?.version === 1 && index.width === metadata.width && index.height === metadata.height && Array.isArray(rows) && rows.length && rows.every(row => {
    if (typeof row.id !== 'string' || !Array.isArray(row.parts) || !row.parts.length || !Array.isArray(row.bounds) || row.bounds.length !== 4 || !row.bounds.every(Number.isFinite) || !Number.isFinite(row.minZoom) || !Number.isFinite(row.priority)) return false
    return row.parts.every(id => { if (!parts.has(id) || used.has(id)) return false; used.add(id); return true })
  }) && used.size === parts.size && new Set(rows.map(row => row.id)).size === rows.length
  if (!valid) return { configure() {}, refresh() {}, destroy() {}, indexed: false }
  for (const row of rows) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.dataset.labelId = row.id
    group.dataset.labelTitle = row.title
    group.classList.add('map-place-label')
    for (const id of row.parts) group.append(parts.get(id))
    svg.append(group); elements.set(row.id, group)
  }
  const lineBounds = new Map()
  let destroyed = false, refreshFrame = 0
  function measureLines() {
    if (destroyed) return
    const matrix = svg.getCTM()
    if (!matrix) return
    const inverse = matrix.inverse()
    for (const [id, group] of elements) {
      const boxes = [...group.querySelectorAll('text')].map(text => {
        const r = text.getBBox(), m = inverse.multiply(text.getCTM())
        const points = [[r.x, r.y], [r.x + r.width, r.y], [r.x, r.y + r.height], [r.x + r.width, r.y + r.height]]
          .map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f])
        return [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))]
      })
      if (boxes.length) lineBounds.set(id, boxes)
    }
    refresh()
  }
  let mode = options.mode || 'auto'
  function applyVisibility() {
    refreshFrame = 0
    if (destroyed) return
    const zoom = map.getZoom(), scale = 2 ** (zoom - metadata.maxZoom)
    const visible = visibleLabels(rows.map(row => ({ ...row, box: row.bounds.map(n => n * scale), boxes: lineBounds.get(row.id)?.map(box => box.map(n => n * scale)) })), zoom, { mode, obstacles: options.obstacles?.() || [] })
    for (const [id, group] of elements) {
      const value = String(visible.has(id))
      if (group.dataset.visible !== value) group.dataset.visible = value
    }
  }
  function refresh() {
    // zoomend and mapmarkerschange occur together; decide visibility once per frame.
    if (!destroyed && !refreshFrame) refreshFrame = requestAnimationFrame(applyVisibility)
  }
  // Leaflet owns the shared transform; hidden labels do not paint during zoom.
  map.on('zoomend mapmarkerschange', refresh)
  refresh()
  document.fonts.ready.then(measureLines)
  return { indexed: true, refresh, configure(value) { if (mode !== value) { mode = value; refresh() } }, destroy() { destroyed = true; cancelAnimationFrame(refreshFrame); map.off('zoomend mapmarkerschange', refresh) } }
}
