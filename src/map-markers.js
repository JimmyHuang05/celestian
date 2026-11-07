import { visibleMarkers } from './map-ui/marker-visibility.js'

// Old image overlays used a bottom-left origin; the tiled image uses top-left.
export function markerPosition(marker, metadata) {
  if (marker.lat === null || marker.lng === null || marker.lat === '' || marker.lng === '') return null
  const lat = Number(marker.lat), lng = Number(marker.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 0 || lat > 5200 || lng < 0 || lng > 10800) return null
  const scale = 2 ** metadata.maxZoom
  return [-metadata.height * (1 - lat / 5200) / scale, metadata.width * lng / 10800 / scale]
}

export function markerIcon(type, color) {
  const safeColor = /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#d4b58e'
  let shape
  switch (type) {
    case '首都': shape = '<circle cx="16" cy="16" r="12" fill="none" stroke-width="3"/><circle cx="16" cy="16" r="4.5" stroke="none"/>'; break
    case '主要城市': shape = '<circle cx="16" cy="16" r="8" fill="none" stroke-width="2.5"/><circle cx="16" cy="16" r="3" stroke="none"/>'; break
    case '要塞': shape = '<polygon points="27,16 21.5,25.5 10.5,25.5 5,16 10.5,6.5 21.5,6.5" fill="none" stroke-width="2.5"/><circle cx="16" cy="16" r="3" stroke="none"/>'; break
    case '据点': shape = '<circle cx="16" cy="16" r="4" fill="none" stroke-width="2"/>'; break
    case '基地': shape = '<rect x="10" y="10" width="12" height="12" fill="none" stroke-width="2"/>'; break
    case '观测站': shape = '<circle cx="16" cy="16" r="6" fill="none" stroke-width="2"/><path d="M16 5v6m0 10v6M5 16h6m10 0h6" fill="none" stroke-width="2"/>'; break
    case '异常': shape = '<polygon points="16,2.6 29.4,16 16,29.4 2.6,16" fill="none" stroke-width="2.5"/><circle cx="16" cy="16" r="3" stroke="none"/>'; break
    default: shape = '<circle cx="16" cy="16" r="4.5" stroke="none"/>'
  }
  return `<div><svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="${safeColor}" stroke="${safeColor}" aria-hidden="true">${shape}</svg></div>`
}

export function attachMarkers(L, map, rows, metadata, select, focus, options = {}) {
  const layer = L.layerGroup().addTo(map), markers = new Map()
  let settings = { type: '', points: true, ...options.settings }, selected = ''
  function refresh() {
    const entries = rows.filter(row => markers.has(String(row.id))).map(row => {
      const p = map.project(markers.get(String(row.id)).getLatLng(), map.getZoom())
      return { id: String(row.id), type: row.type, x: p.x, y: p.y }
    })
    const visible = visibleMarkers(entries, map.getZoom(), { ...settings, selected })
    for (const [id, marker] of markers) {
      const el = marker.getElement(), show = visible.has(id)
      el.style.display = show ? '' : 'none'
      el.setAttribute('tabindex', show ? '0' : '-1')
    }
    map.fire('mapmarkerschange')
  }
  for (const row of rows) {
    const position = markerPosition(row, metadata)
    if (!position) continue
    const title = row.title || '未命名地点'
    const marker = L.marker(position, { alt: title, keyboard: true, autoPanOnFocus: false,
      icon: L.divIcon({ className: 'geo-pin-map restored-map-marker', html: markerIcon(row.type, row.color), iconSize: [28, 28], iconAnchor: [14, 14] }),
    }).addTo(layer)
    marker.getElement().dataset.markerId = String(row.id)
    marker.getElement().dataset.markerType = row.type
    marker.getElement().setAttribute('aria-label', title)
    const activate = ({ navigate = true } = {}) => {
      if (navigate) options.beforeNavigate?.()
      selected = String(row.id)
      for (const m of markers.values()) { m.getElement()?.classList.remove('geo-pin-map-active'); m.setZIndexOffset(0) }
      marker.getElement()?.classList.add('geo-pin-map-active'); marker.setZIndexOffset(1000)
      select(row)
      refresh()
      if (navigate) {
        if (focus) focus(position, Math.max(map.getZoom(), 3.5))
        else map.setView(position, Math.max(map.getZoom(), 3.5), { animate: false })
      }
    }
    marker.on('click', activate)
    marker.getElement().addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault(); event.stopImmediatePropagation(); activate()
    })
    marker.activate = activate
    markers.set(String(row.id), marker)
  }
  map.on('zoomend', refresh)
  refresh()
  return {
    layer, markers, select(id, value) { markers.get(String(id))?.activate(value) },
    obstacles() {
      return [...markers.values()].filter(marker => marker.getElement()?.style.display !== 'none').map(marker => {
        const p = map.project(marker.getLatLng(), map.getZoom())
        return [p.x - 16, p.y - 16, p.x + 16, p.y + 16]
      })
    },
    filter(type) { settings.type = type; refresh() },
    configure(value) { settings = { ...settings, ...value }; refresh() },
    clear() { selected = ''; for (const m of markers.values()) { m.getElement()?.classList.remove('geo-pin-map-active'); m.setZIndexOffset(0) }; refresh() },
    destroy() { map.off('zoomend', refresh) },
  }
}
