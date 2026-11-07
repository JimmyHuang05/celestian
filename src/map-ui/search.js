import { resolveRegion, regionDetails } from '../map-regions.js'

// Search dossiers rather than geometry fragments. Local overrides stay distinct.
export function indexRegions(records, validIDs) {
  const entries = new Map()
  for (const row of records) {
    if (!validIDs.has(row.region_id)) continue
    const primary = resolveRegion(row, records)
    const display = regionDetails(row, records)
    const key = JSON.stringify([primary.region_id, display.status])
    const existing = entries.get(key)
    const aliases = [row.title, row.foreign_title, row.group_id, row.sub_group_id].filter(Boolean)
    if (existing) {
      existing.aliases.push(...aliases)
      if (row.region_id === primary.region_id || (row.description && !existing.hasLocalDescription)) {
        existing.region_id = row.region_id
        existing.description = display.description
        existing.hasLocalDescription = Boolean(row.description)
      }
    } else {
      entries.set(key, { ...display, region_id: row.region_id, aliases, hasLocalDescription: Boolean(row.description),
        title: display.title || row.sub_group_id || row.group_id || '未命名区域' })
    }
  }
  return [...entries.values()]
}

export function searchMap(points, regions, query, type) {
  const q = query.trim().toLocaleLowerCase()
  const score = row => {
    const title = (row.title || '').toLocaleLowerCase()
    return title === q ? 0 : title.startsWith(q) ? 1 : 2
  }
  const matches = values => !q || values.some(value => value?.toLocaleLowerCase().includes(q))
  const types = Array.isArray(type) ? type : type ? [type] : []
  const pointResults = points.filter(row => (!types.length || types.includes(row.type)) &&
    matches([row.title, row.foreign_title, row.type])).sort((a, b) => score(a) - score(b))
  const regionResults = q ? regions.filter(row => matches([
    row.title, row.foreign_title, row.group_id, row.sub_group_id, row.status, ...row.aliases,
  ])).sort((a, b) => score(a) - score(b) ||
    Number(Boolean(b.is_primary || (b.is_sub_primary && b.sub_group_id === '本土'))) -
    Number(Boolean(a.is_primary || (a.is_sub_primary && a.sub_group_id === '本土')))) : []
  return [...regionResults.map(row => ({ kind: 'region', key: `region-${row.region_id}`, row })),
    ...pointResults.map(row => ({ kind: 'point', key: `point-${row.id}`, row }))]
}
