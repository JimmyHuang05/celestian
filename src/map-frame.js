import artworkUrl from './assets/map/atlas-frame.svg?url'

// Match the basemap to the innermost rail (23.525–24.881 SVG units).
// A small overlap under the metal prevents a hairline gap during zooming.
const FRAME_VIEWBOX = { width: 2232, height: 1112, apertureInset: 24.6 }

export function attachMapFrame(L, map, metadata, signal) {
  const scale = 2 ** metadata.maxZoom
  const { width, height, apertureInset } = FRAME_VIEWBOX
  const insetX = metadata.width * apertureInset / (width - 2 * apertureInset)
  const insetY = metadata.height * apertureInset / (height - 2 * apertureInset)
  const bounds = L.latLngBounds([
    [-(metadata.height + insetY) / scale, -insetX / scale],
    [insetY / scale, (metadata.width + insetX) / scale],
  ])
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 2232 1112')
  svg.setAttribute('fill', 'none')
  // Bounds align each axis to the inner rail independently; SVG's default
  // aspect-ratio fitting would pull the left/right rails inside those bounds.
  svg.setAttribute('preserveAspectRatio', 'none')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add('map-atlas-frame')
  map.createPane('mapFramePane').style.zIndex = '470'
  map.getPane('mapFramePane').style.pointerEvents = 'none'
  const layer = L.svgOverlay(svg, bounds, { interactive: false, pane: 'mapFramePane' }).addTo(map)
  // Frame geometry is immediate; its decorative paths need not block the map bundle.
  fetch(artworkUrl, { signal, priority: 'low' }).then(async response => {
    if (!response.ok) return
    const artwork = await response.text()
    if (signal?.aborted) return
    const parsed = new DOMParser().parseFromString(artwork, 'image/svg+xml').documentElement
    if (parsed.localName === 'svg') svg.replaceChildren(...parsed.childNodes)
  }).catch(() => { /* A missing ornament must not prevent browsing the atlas. */ })
  return { bounds, layer }
}

export function frameZoom(map, bounds, cover = false) {
  // Unlike getBoundsZoom this is not clamped to the previous viewport's minZoom.
  // A wide desktop can therefore be resized all the way down to a narrow phone.
  const a = map.project(bounds.getNorthWest(), 0), b = map.project(bounds.getSouthEast(), 0)
  const size = map.getSize(), x = size.x / (b.x - a.x), y = size.y / (b.y - a.y)
  return Math.max(-1, Math.min(map.getMaxZoom(), Math.log2(cover ? Math.max(x, y) : Math.min(x, y))))
}

export function coverMap(map, bounds) {
  const zoom = frameZoom(map, bounds, true)
  map.options.maxBounds = bounds
  map.setView(bounds.getCenter(), zoom, { animate: false })
}
