export const SPECIAL_STATUSES = ['污染', '深渊']
export const FIELD_LEVELS = { 1: '静滞', 2: '稳态', 3: '扰动', 4: '高压', 5: '超限', 6: '██' }
export const POLLUTION_STYLES = {
  3: { label: 'Ⅲ · 扰动', color: '#a30000', fill: '30', selected: '73', ink: '#b17966' },
  4: { label: 'Ⅳ · 高压', color: '#940000', fill: '60', selected: '99', ink: '#984b3d' },
  5: { label: 'Ⅴ · 超限', color: '#780000', fill: '90', selected: 'b3', ink: '#782e29' },
}
export function pollutionStyle(row) { return POLLUTION_STYLES[row?.pollution_level] || POLLUTION_STYLES[3] }
export function statusLabel(row) {
  if (row?.status !== '污染') return row?.status
  if (row.pollution_level === 6) return 'Ⅵ · ██'
  if (row.pollution_level === 1 || row.pollution_level === 2) return ''
  return pollutionStyle(row).label
}

export function regionMeta(row) {
  const affiliation = [...new Set([row.group_id, row.sub_group_id].map(value => value?.trim()).filter(Boolean))].join(' · ')
  return { affiliation, status: SPECIAL_STATUSES.includes(row.status) ? statusLabel(row) : '' }
}

// Presentation only: keep the empire's political grouping and map geometry intact.
export function territoryPreviewRows(row, related) {
  if (row.group_id !== '奥兰尼亚帝国') return related
  if (['克莱曼尼殖民地', '昂格莱德联合拓殖区'].includes(row.sub_group_id)) {
    return related.filter(item => item.sub_group_id === row.sub_group_id)
  }
  if (row.title === '北英普顿殖民地') {
    return related.filter(item => item.title === '北英普顿殖民地')
  }
  if (['本土', '维斯廷自治领'].includes(row.sub_group_id) || row.title === '女王陛下的奥兰尼亚帝国') {
    return related.filter(item => ['本土', '维斯廷自治领'].includes(item.sub_group_id))
  }
  return related
}
const palette = ['#c9a268', '#7fa6b3', '#9aac7e', '#ad8fb8', '#ca8c79', '#7fb4a4', '#b8ac72', '#8799bf', '#bc8da0', '#aab49e']

export function countryLegend(records) {
  return [...new Set(records.map(row => row.group_id).filter(Boolean))].sort().map((name, index) => ({ name, color: palette[index % palette.length] }))
}

export function focusRegionIDs(config, records, boxes) {
  const group = records.filter(row => row.group_id && row.group_id === config.group_id && boxes.has(row.region_id))
  const national = config.is_primary || (config.is_sub_primary && config.sub_group_id === '本土')
  if (!national) {
    if (!config.is_sub_primary) return [config.region_id]
    return group.filter(row => row.sub_group_id === config.sub_group_id).map(row => row.region_id)
  }
  const homeland = group.filter(row => row.sub_group_id === '本土')
  const candidates = homeland.length ? homeland : group
  if (!candidates.length) return [config.region_id]
  // Nearby fragments form a main territory; remote colonies remain in All territory.
  const remaining = new Set(candidates.map(row => row.region_id)), clusters = []
  while (remaining.size) {
    const seed = remaining.values().next().value, cluster = [seed]
    remaining.delete(seed)
    for (let i = 0; i < cluster.length; i++) {
      const a = boxes.get(cluster[i])
      for (const id of remaining) {
        const b = boxes.get(id), gap = 80
        if (a.x <= b.x + b.width + gap && b.x <= a.x + a.width + gap && a.y <= b.y + b.height + gap && b.y <= a.y + a.height + gap) {
          cluster.push(id); remaining.delete(id)
        }
      }
    }
    clusters.push(cluster)
  }
  const area = cluster => cluster.reduce((sum, id) => { const b = boxes.get(id); return sum + b.width * b.height }, 0)
  clusters.sort((a, b) => area(b) - area(a))
  return clusters[0]
}
