export const MAP_PREFERENCES_KEY = 'celestian-map-view-v2'
export const DEFAULT_LAYERS = Object.freeze({ labels: true, points: true, countries: false, statuses: true })
export const POINT_TYPES = ['首都', '主要城市', '城市/城镇', '城市', '要塞', '基地', '港口', '遗迹', '据点', '观测站', '异常', '资源', '其他']

export function normalizePreferences(value) {
  const result = { layers: { ...DEFAULT_LAYERS }, labelMode: 'auto', type: '', query: '', view: null, selection: null }
  if (!value || value.version !== 2) return result
  if (value.frameVersion === 1) result.frameVersion = 1
  for (const key of Object.keys(DEFAULT_LAYERS)) {
    if (typeof value.layers?.[key] === 'boolean') result.layers[key] = value.layers[key]
  }
  if (POINT_TYPES.includes(value.type)) result.type = value.type
  if (Array.isArray(value.type)) result.type = [...new Set(value.type.filter(type => POINT_TYPES.includes(type)))]
  if (value.labelMode === 'all') result.labelMode = 'all'
  if (typeof value.query === 'string') result.query = value.query.slice(0, 120)
  if (['point', 'region'].includes(value.selection?.kind) && typeof value.selection.id === 'string' && /^[\w-]{1,120}$/.test(value.selection.id)) {
    result.selection = { kind: value.selection.kind, id: value.selection.id }
  }
  const v = value.view
  if (v && typeof v.coordinates === 'string' && Array.isArray(v.center) && v.center.length === 2 &&
      v.center.every(n => typeof n === 'number' && Number.isFinite(n) && n >= -1 && n <= 2) &&
      typeof v.zoom === 'number' && Number.isFinite(v.zoom) && v.zoom >= -1 && v.zoom <= 6) {
    result.view = { coordinates: v.coordinates, center: [...v.center], zoom: v.zoom }
  }
  return result
}

export function readPreferences() {
  try { return normalizePreferences(JSON.parse(localStorage.getItem(MAP_PREFERENCES_KEY))) }
  catch { return normalizePreferences(null) }
}

export function writePreferences(value) {
  try { localStorage.setItem(MAP_PREFERENCES_KEY, JSON.stringify({ version: 2, ...value })) }
  catch { /* Browsing still works when persistent storage is unavailable. */ }
}

export function serializeView(map, metadata) {
  const center = map.getCenter(), scale = 2 ** metadata.maxZoom
  return { coordinates: metadata.coordinateSystemSha256, center: [center.lng * scale / metadata.width, -center.lat * scale / metadata.height], zoom: map.getZoom() }
}

export function restoreView(view, metadata) {
  if (!view || view.coordinates !== metadata.coordinateSystemSha256) return null
  const scale = 2 ** metadata.maxZoom
  return { center: [-view.center[1] * metadata.height / scale, view.center[0] * metadata.width / scale], zoom: Math.min(metadata.maxZoom, Math.max(metadata.minZoom - 1, view.zoom)) }
}
