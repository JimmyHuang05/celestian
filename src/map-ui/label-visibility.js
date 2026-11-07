export const overlaps = (a, b, gap = 0) => a[0] < b[2] + gap && a[2] > b[0] - gap && a[1] < b[3] + gap && a[3] > b[1] - gap

// World-pixel boxes make the result independent of panning. Never move the artwork.
export function visibleLabels(rows, zoom, { mode = 'auto', obstacles = [] } = {}) {
  if (mode === 'all') return new Set(rows.map(row => row.id))
  const accepted = [], result = new Set()
  for (const row of [...rows].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))) {
    if (zoom < row.minZoom) continue
    if (obstacles.some(box => overlaps(row.box, box, 3)) || accepted.some(box => overlaps(row.box, box, 6))) continue
    accepted.push(row.box); result.add(row.id)
  }
  return result
}
