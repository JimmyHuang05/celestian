import artwork from './assets/map/atlas-frame.svg?raw'

// Match the basemap to the innermost rail (23.525–24.881 SVG units).
// A small overlap under the metal prevents a hairline gap during zooming.
const FRAME_VIEWBOX = { width: 2232, height: 1112, apertureInset: 24.6 }

export function attachMapFrame(L, map, metadata) {
  const scale = 2 ** metadata.maxZoom
  const { width, height, apertureInset } = FRAME_VIEWBOX
  const insetX = metadata.width * apertureInset / (width - 2 * apertureInset)
  const insetY = metadata.height * apertureInset / (height - 2 * apertureInset)
  const bounds = L.latLngBounds([
    [-(metadata.height + insetY) / scale, -insetX / scale],
    [insetY / scale, (metadata.width + insetX) / scale],
  ])
  const svg = new DOMParser().parseFromString(artwork, 'image/svg+xml').documentElement
  // Bounds align each axis to the inner rail independently; SVG's default
  // aspect-ratio fitting would pull the left/right rails inside those bounds.
  svg.setAttribute('preserveAspectRatio', 'none')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add('map-atlas-frame')
  map.createPane('mapFramePane').style.zIndex = '470'
  map.getPane('mapFramePane').style.pointerEvents = 'none'
  const layer = L.svgOverlay(svg, bounds, { interactive: false, pane: 'mapFramePane' }).addTo(map)
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
