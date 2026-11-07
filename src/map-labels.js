import { visibleLabels } from './map-ui/label-visibility.js'

export function attachLabelDisplay(map, svg, index, metadata, options = {}) {
  const elements = new Map(), paths = new Map([...svg.querySelectorAll('path[id]')].map(path => [path.id, path]))
  const rows = index?.data
  // Fail open to the complete original lettering if an index and artwork disagree.
  const used = new Set()
  const valid = index?.version === 1 && index.width === metadata.width && index.height === metadata.height && Array.isArray(rows) && rows.length && rows.every(row => {
    if (typeof row.id !== 'string' || !Array.isArray(row.parts) || !row.parts.length || !Array.isArray(row.bounds) || row.bounds.length !== 4 || !row.bounds.every(Number.isFinite) || !Number.isFinite(row.minZoom) || !Number.isFinite(row.priority)) return false
    return row.parts.every(id => { if (!paths.has(id) || used.has(id)) return false; used.add(id); return true })
  }) && used.size === paths.size && new Set(rows.map(row => row.id)).size === rows.length
  if (!valid) return { configure() {}, refresh() {}, destroy() {}, indexed: false }
  for (const row of rows) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.dataset.labelId = row.id
    group.dataset.labelTitle = row.title
    group.classList.add('map-place-label')
    for (const id of row.parts) group.append(paths.get(id))
    svg.append(group); elements.set(row.id, group)
  }
  let mode = options.mode || 'auto'
  function refresh() {
    const zoom = map.getZoom(), scale = 2 ** (zoom - metadata.maxZoom)
    const visible = visibleLabels(rows.map(row => ({ ...row, box: row.bounds.map(n => n * scale) })), zoom, { mode, obstacles: options.obstacles?.() || [] })
    for (const [id, group] of elements) group.dataset.visible = String(visible.has(id))
  }
  // Only visibility fades; Leaflet owns the shared transform on every animation frame.
  map.on('zoomend mapmarkerschange', refresh)
  refresh()
  return { indexed: true, refresh, configure(value) { mode = value; refresh() }, destroy() { map.off('zoomend mapmarkerschange', refresh) } }
}
