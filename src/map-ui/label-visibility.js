export const overlaps = (a, b, gap = 0) => a[0] < b[2] + gap && a[2] > b[0] - gap && a[1] < b[3] + gap && a[3] > b[1] - gap

const area = b => Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1])
const crowded = (a, b, tolerance) => {
  const intersection = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]))
  return intersection > Math.max(1, Math.min(area(a), area(b))) * tolerance
}

// Compare individual text lines; whitespace between bilingual lines is not an obstacle.
export function visibleLabels(rows, zoom, { mode = 'auto', obstacles = [] } = {}) {
  if (mode === 'all') return new Set(rows.map(row => row.id))
  const boxes = row => row.boxes?.length ? row.boxes : [row.box]
  const permanent = rows.filter(row => row.alwaysVisible)
  const accepted = permanent.flatMap(boxes), result = new Set(permanent.map(row => row.id))
  const tolerance = Math.min(0.3, 0.08 + Math.max(0, zoom - 3) * 0.07)
  for (const row of [...rows].sort((a, b) => a.priority - b.priority || (b.effectiveFontSize || 0) - (a.effectiveFontSize || 0) || a.id.localeCompare(b.id))) {
    if (row.alwaysVisible || zoom < row.minZoom) continue
    const lines = boxes(row)
    if (!row.allowOverlap && lines.some(line =>
      (row.avoidMarkers !== false && obstacles.some(box => crowded(line, box, tolerance))) ||
      accepted.some(box => crowded(line, box, tolerance)))) continue
    accepted.push(...lines); result.add(row.id)
  }
  return result
}
