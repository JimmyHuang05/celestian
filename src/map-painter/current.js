import { CHUNK, WORLD } from './model.js'
import { MAP_ROOT } from '../map-assets.js'
import { pollutionStyle } from '../map-ui/region-presentation.js'

export async function loadCurrent(signal) {
  const texts = await Promise.all(['legacy-regions.svg', 'legacy-region-metadata.json'].map(async file => {
    const response = await fetch(`${MAP_ROOT}/${file}`, { signal, cache: 'no-cache' })
    if (!response.ok) throw Error('前台分区加载失败')
    return response.text()
  }))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texts.join('\n')))
  return { svg: texts[0], records: JSON.parse(texts[1]).data,
    version: [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('').slice(0, 16) }
}

export async function importCurrent(runtime, source) {
  const svg = new DOMParser().parseFromString(source.svg, 'image/svg+xml').documentElement
  const records = new Map(source.records.map(row => [row.region_id, row]))
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = CHUNK
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  runtime.model.regions = []
  for (const element of svg.querySelectorAll('[data-region-id]')) {
    if (runtime.destroyed) return
    const row = records.get(element.dataset.regionId)
    if (!row) continue
    const id = runtime.model.regions.length + 1
    const primary = source.records.find(r => r.group_id === row.group_id && r.is_primary)
    runtime.model.regions.push({ id, name: row.title || row.sub_group_id || primary?.title || row.group_id || row.region_id,
      color: row.status === '污染' ? pollutionStyle(row).color : row.color || '#d4b58e',
      source: { regionId: row.region_id, groupId: row.group_id || '', subGroupId: row.sub_group_id || '', metadata: { ...row } } })
    const d = element.getAttribute('d'), path = new Path2D(d)
    // Published legacy geometry uses an enclosing scale(2), in 21600 × 10400 coordinates.
    const points = [...d.matchAll(/[ML]([\d.-]+),([\d.-]+)/g)].map(m => [+m[1] * 2, +m[2] * 2])
    const xs = points.map(p => p[0]), ys = points.map(p => p[1])
    const minX = Math.max(0, Math.floor(Math.min(...xs) / CHUNK)), maxX = Math.min(Math.ceil(WORLD.width / CHUNK) - 1, Math.floor(Math.max(...xs) / CHUNK))
    const minY = Math.max(0, Math.floor(Math.min(...ys) / CHUNK)), maxY = Math.min(Math.ceil(WORLD.height / CHUNK) - 1, Math.floor(Math.max(...ys) / CHUNK))
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const mask = runtime.landMask(x, y); if (!mask) continue
      ctx.resetTransform(); ctx.clearRect(0, 0, CHUNK, CHUNK)
      ctx.setTransform(2, 0, 0, 2, -x * CHUNK, -y * CHUNK)
      ctx.fill(path, element.getAttribute('fill-rule') || 'nonzero')
      const pixels = ctx.getImageData(0, 0, CHUNK, CHUNK).data
      const key = `${x},${y}`
      let chunk = runtime.model.chunks.get(key)
      for (let i = 0; i < mask.length; i++) if (mask[i] && pixels[i * 4 + 3] >= 128) {
        if (!chunk) { chunk = { labels: new Uint16Array(CHUNK * CHUNK), version: 1 }; runtime.model.chunks.set(key, chunk) }
        chunk.labels[i] = id
      }
    }
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  runtime.model.dirty = new Set(runtime.model.chunks.keys())
  runtime.model.changed()
}
