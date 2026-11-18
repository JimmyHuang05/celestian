import { stableSvgOverlay } from './map-stable-svg.js'
import {coastalGeometryText} from './map-coastal-resource.js'
import { rasterizeMapSVG } from './map-svg-raster.js'

const namespace = 'http://www.w3.org/2000/svg'
let nextId = 0

export function createMapPlusCoastalLayer(L, map, bounds, geometryUrl, signal) {
  let coast, activeCoast, generation = 0
  const prefix = `mapplus-coast-${++nextId}`
  // Isolate the coastline mask from the raster tile surfaces.
  map.createPane('mapPlusCoast').style.zIndex = '202'

  function replace(current, next) {
    if (current === next) return current
    if (current) map.removeLayer(current)
    return next?.addTo(map)
  }

  function configure(variant, onError) {
    const token = ++generation
    const coastLayer = geometryUrl && variant.startsWith('default-')
      ? coast ??= prepareCoast().catch(error => { coast = null; throw error })
      : null
    const isCurrent = () => !signal.aborted && token === generation
    const reportError = () => { if (isCurrent()) onError() }
    if (coastLayer) coastLayer.then(layer => {
      if (isCurrent()) activeCoast = replace(activeCoast, layer)
    }, reportError)
    else activeCoast = replace(activeCoast, null)
  }

  async function prepareCoast() {
    const source = await coastalGeometryText(geometryUrl)
    if (signal.aborted) return
    const markup = source.replaceAll('mapplus-land-shape', `${prefix}-shape`)
      .replaceAll('mapplus-land-clip', `${prefix}-clip`)
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml')
    const svg = document.importNode(parsed.documentElement, true)
    if (svg.namespaceURI !== namespace || svg.localName !== 'svg') throw new Error('Invalid coastline SVG')
    svg.setAttribute('preserveAspectRatio', 'none')
    svg.setAttribute('aria-hidden', 'true')
    svg.style.pointerEvents = 'none'
    const outline = svg.querySelector('.mapplus-coast-outline')
    outline.setAttribute('stroke-width', '.68')
    outline.setAttribute('mask', `url(#${prefix}-clip)`)
    // Draw the intricate clipped coast once so zoom does not rerasterize it
    // at each scale. The source geometry stays available to editors.
    const surface = await rasterizeMapSVG(svg, 4096, 2048).catch(() => svg)
    if (signal.aborted) return
    return stableSvgOverlay(L, surface, bounds, { pane: 'mapPlusCoast', interactive: false })
  }

  signal.addEventListener('abort', () => {
    replace(activeCoast, null)
  }, { once: true })
  return { configure }
}
