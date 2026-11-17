import { newWorldMarker } from './map-marker-overrides.js'
import {cultureText} from './mapplus-culture.js'
import { placementEntries, readProjectPlacements } from './map-placement-archive.js'
import { watchProjectData } from './map-painter/shared-draft.js'
import { mergedWorldLabels } from './map-label-overrides.js'
import { MAP_ROOT } from './map-assets.js'
import { MAPPLUS_WONDERS_ENABLED, WONDER_KEY } from './map-landmarks.js'
import './map-text-overlay.css'
import { curveSeaLabel } from './map-curved-sea-label.js'
export const PLACEMENT_KEYS = ['celestian-placement-new-estra-20cbce0ed04d', 'celestian-text-placement-v1', ...(MAPPLUS_WONDERS_ENABLED ? [WONDER_KEY] : [])]
const valid = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0] >= -1024 && p[0] <= 0 && p[1] >= 0 && p[1] <= 2048
const read = placementEntries
async function json(name, signal) {
  const root = import.meta.env.DEV ? MAP_ROOT : '/mapplus/source-v20261113'
  const r = await fetch(`${root}/${name}.json`, { signal })
  if (!r.ok) throw new Error('地图迁移资料加载失败')
  return r.json()
}
export async function migratedMarkers(signal) {
  const source = await json('markers', signal), entries = await read(PLACEMENT_KEYS[0])
  // Adapt to the original map's marker coordinate contract; keep source data intact.
  return source.data.map(newWorldMarker).filter(row => valid(entries[row.id])).map(row => ({ ...row,
    sourcePosition: { lat: row.lat, lng: row.lng },
    lat: (1 + entries[row.id][0] / 1024) * 5200, lng: entries[row.id][1] / 2048 * 10800,
  }))
}

export async function migratedLabels(metadata, signal) {
  const [source, entries] = await Promise.all([
    json('labels-index', signal),
    read(PLACEMENT_KEYS[1]),
  ])
  const latestLabelZoom = source.data.find(row => row.id === 'place-label-00196')?.minZoom ?? 3
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('viewBox', `0 0 ${metadata.width} ${metadata.height}`)
  svg.setAttribute('width', metadata.width); svg.setAttribute('height', metadata.height)
  svg.setAttribute('aria-hidden', 'true'); svg.style.pointerEvents = 'none'
  const data = []
  for (const original of mergedWorldLabels(source.data, entries)) {
    const row={...original,title:cultureText(original.title),foreignTitle:cultureText(original.foreignTitle),foreign_title:cultureText(original.foreign_title)}
    const entry = entries[row.id]
    if (!valid(entry?.position)) continue
    const size = Number.isFinite(entry.size) ? Math.min(160, Math.max(8, entry.size)) : 28
    const f = size * metadata.width / 2048, x = entry.position[1] / 2048 * metadata.width, y = -entry.position[0] / 1024 * metadata.height
    const group = document.createElementNS(ns, 'g'), id = `${row.id}-migrated`
    group.id = id; group.dataset.mapText = ''; group.dataset.fontSize = size
    group.classList.add('mapplus-map-ink')
    const rotation = Number.isFinite(entry.rotation) ? Math.max(-180, Math.min(180, entry.rotation)) : 0
    group.dataset.rotation = rotation
    group.setAttribute('transform', `translate(${x} ${y}) rotate(${rotation})`)
    group.setAttribute('fill', '#665132'); group.setAttribute('text-anchor', 'middle')
    const foreign = row.foreignTitle || row.foreign_title
    const add = (text, family, fontSize, baseline, spacing) => {
      const node = document.createElementNS(ns, 'text'); node.textContent = text
      node.setAttribute('font-family', family); node.setAttribute('font-size', fontSize)
      node.setAttribute('font-weight', '400'); node.setAttribute('y', baseline); node.setAttribute('letter-spacing', spacing)
      group.append(node)
    }
    add(row.title, 'CelestianAtlasZh, serif', f, foreign ? -.05*f : .35*f, '.1em')
    if (foreign) add(foreign, 'CelestianAtlasEn, serif', f*.42, .65*f, '.06em')
    const curvedBounds = curveSeaLabel(group,row,f,x,y)
    svg.append(group)
    const width = Math.max(row.title.length*f*1.1, (foreign?.length||0)*f*.3)
    const radians = rotation * Math.PI / 180
    const halfWidth = Math.abs(Math.cos(radians))*width/2 + Math.abs(Math.sin(radians))*f
    const halfHeight = Math.abs(Math.sin(radians))*width/2 + Math.abs(Math.cos(radians))*f
    // The Amber Sea label must appear at the Twincape tier even near coastal markers.
    const displayOverride = row.id === 'place-label-00124'
      // This ocean-wide arc has a large bounding box containing empty sea.
      // Coastal marker collisions must not hide both language lines.
      ? { minZoom: 0, allowOverlap: true, avoidMarkers: false }
      : ['place-label-01373','place-label-monteran','place-label-01292','place-label-01317'].includes(row.id)
      // The bay arc spans empty water surrounded by coastal route markers.
      ? { minZoom: 2, allowOverlap: true, avoidMarkers: false }
      : row.id === 'place-label-00559'
      ? { minZoom: latestLabelZoom, allowOverlap: true }
      : {}
    const waterLabel = row.kind !== 'route' && (
      /(?:洋|海|海峡|海峽|海湾|海灣|湾|灣|海域|深渊|深淵)$/.test(row.title) ||
      /\b(?:sea|ocean|bay|gulf|strait|abyss)\b/i.test(foreign || '')
    )
    // Sea names remain visible at every scale, including curved bilingual names.
    // Other geographic labels retain their original zoom and collision rules.
    data.push({ ...row, parts: [id], minZoom: Math.min(Number.isFinite(row.minZoom) ? row.minZoom : latestLabelZoom, latestLabelZoom), effectiveFontSize: f, bounds: curvedBounds || [x-halfWidth,y-halfHeight,x+halfWidth,y+halfHeight], priority: curvedBounds ? 0 : row.priority??1, ...displayOverride, ...(waterLabel ? {alwaysVisible:true} : {}) })
  }
  return [svg, { version: 1, width: metadata.width, height: metadata.height, detailMinZoom: latestLabelZoom, data }]
}
export function watchMigratedResources(signal, refresh) {
  if (import.meta.env.DEV) {
    watchProjectData(signal, async () => {
      const saved = await readProjectPlacements()
      return JSON.stringify(PLACEMENT_KEYS.map(key => saved[key]))
    }, refresh)
    return
  }
  let previous = PLACEMENT_KEYS.map(key => localStorage.getItem(key)).join('|')
  const check = () => {
    const current = PLACEMENT_KEYS.map(key => localStorage.getItem(key)).join('|')
    if (current !== previous) { previous = current; refresh() }
  }
  window.addEventListener('storage', check, { signal })
  window.addEventListener('focus', check, { signal })
}
