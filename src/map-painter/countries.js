function colorAt(index) {
  const hue = (index * 137.508 + 28) % 360 / 360, saturation = .48, lightness = .61
  const a = saturation * Math.min(lightness, 1 - lightness)
  const channel = n => {
    const k = (n + hue * 12) % 12
    return Math.round(255 * (lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0')
  }
  return '#' + channel(0) + channel(8) + channel(4)
}

// Ownership comes from authored group IDs, never from reused display colors.
export function consolidateCountries(regions) {
  const groups = new Map(), mapping = new Map()
  let pendingNumber = 0
  for (const region of regions) {
    const group = region.source?.groupId?.trim()
    const key = group ? `group:${group}` : `independent:${region.id}`
    let country = groups.get(key)
    if (!country) {
      country = { id: groups.size + 1, name: group || region.name, color: colorAt(groups.size) }
      if (region.source && !group) {
        country.pending = true
        pendingNumber++
        if (/^区域 [\d_]+$/.test(country.name)) country.name = `待归属区域 ${pendingNumber}`
      }
      if (region.source) country.sources = []
      groups.set(key, country)
    }
    if (region.source) country.sources.push({ ...region.source, originalName: region.name, originalColor: region.color })
    mapping.set(region.id, country.id)
  }
  const countries = [...groups.values()]
  const conflicts = []
  for (const country of countries) {
    const fields = {}
    for (const field of ['title', 'description', 'status', 'color', 'status_color']) {
      const values = [...new Set((country.sources || []).map(source => source.metadata?.[field]).filter(Boolean))]
      if (values.length > 1) fields[field] = values
    }
    if (Object.keys(fields).length) conflicts.push({ id: country.id, name: country.name, fields })
  }
  return { regions: countries, mapping, summary: { before: regions.length, after: countries.length,
    confirmedGroups: [...groups.keys()].filter(key => key.startsWith('group:')).length,
    unassigned: countries.filter(r => r.pending).length, conflicts } }
}

export function remapOwnership(chunks, mapping) {
  const lookup = new Uint16Array(65536)
  for (const [before, after] of mapping) lookup[before] = after
  for (const chunk of chunks.values()) {
    for (let i = 0; i < chunk.labels.length; i++) chunk.labels[i] = lookup[chunk.labels[i]]
    chunk.version++
  }
}
