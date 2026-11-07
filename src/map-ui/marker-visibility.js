export function markerPriority(type) {
  return type === '首都' ? 0 : type === '主要城市' ? 1 : ['要塞', '观测站', '港口'].includes(type) ? 2 : 3
}

// Projected world pixels make overlap decisions independent of pan position.
export function visibleMarkers(entries, zoom, { type = '', points = true, selected = '' } = {}) {
  const types = Array.isArray(type) ? type : type ? [type] : []
  const level = zoom < 2.75 ? 1 : zoom < 3.5 ? 2 : 3
  const shown = new Set(), occupied = []
  const sorted = [...entries].sort((a, b) => Number(b.id === selected) - Number(a.id === selected) || markerPriority(a.type) - markerPriority(b.type) || a.id.localeCompare(b.id))
  for (const entry of sorted) {
    const chosen = entry.id === selected
    if (!chosen && (!points || (types.length && !types.includes(entry.type)) || (!types.length && markerPriority(entry.type) > level))) continue
    const radius = entry.type === '首都' ? 16 : entry.type === '主要城市' ? 13 : 10
    if (!chosen && !types.length && occupied.some(other => Math.hypot(entry.x - other.x, entry.y - other.y) < radius + other.radius + 3)) continue
    shown.add(entry.id); occupied.push({ ...entry, radius })
  }
  return shown
}
