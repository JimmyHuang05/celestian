// New-world names retain original IDs so saved placements remain valid.
export function newWorldLabel(row) {
  if (row.id === 'place-label-01292') return { ...row, title: '内珊瑚海' }
  if (row.id === 'place-label-01317') return { ...row, title: '外珊瑚海' }
  if (row.id === 'place-label-tanghai') return { ...row, title: '鲸海', foreignTitle: 'Whale Sea' }
  if (row.id === 'place-label-00638') return { ...row, title: '宝石海', foreignTitle: 'Jewel Sea' }
  if (row.id === 'place-label-00559') return { ...row, title: '琥珀海', foreignTitle: 'Mare d’Ambra' }
  if (row.id === 'place-label-monteran') return { ...row, title: '蒙特兰海', foreignTitle: 'Monteran Sea' }
  if (row.id === 'place-label-hengshan') return { ...row, title: '波托文托海峡', foreignTitle: 'Portovento Strait' }
  if (row.id === 'place-label-00385') return { ...row, title: '东方海', foreignTitle: 'Eastern Sea' }
  return row.id === 'place-label-chaohai'
    ? { ...row, title: '南梅里迪亚海峡', foreignTitle: 'South Meridia Strait' }
    : row
}

// Shared by the placement editor and the published map.
export function mergedWorldLabels(source, entries) {
  const rows = source.map(newWorldLabel)
  const known = new Set(rows.map(row => row.id))
  for (const [id, entry] of Object.entries(entries)) {
    if (!known.has(id) && entry?.custom === true && typeof entry.title === 'string') {
      rows.push({ id, title: entry.title, foreignTitle: '', kind: entry.kind || 'geography', minZoom: 3, priority: 2 })
    }
  }
  return rows.map(row => {
    const entry = entries[row.id]
    return { ...row, curve: entry?.curve, ...(typeof entry?.title === 'string' ? { title: entry.title } : {}),
      ...(typeof entry?.foreignTitle === 'string' ? { foreignTitle: entry.foreignTitle } : {}) }
  })
}
