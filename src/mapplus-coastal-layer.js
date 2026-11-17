import { stableImageOverlay, stableSvgOverlay } from './map-stable-svg.js'
import {coastalGeometryText} from './map-coastal-resource.js'

const namespace = 'http://www.w3.org/2000/svg'
let nextId = 0

export function createMapPlusCoastalLayer(L, map, bounds, geometryUrl, signal, waterwaysImageUrl) {
  let geometry, overlay
  const prefix = `mapplus-coast-${++nextId}`
  // Isolate the coastline mask and the world-sized water image from the tiles.
  map.createPane('mapPlusCoast').style.zIndex = '202'
  map.createPane('mapPlusWater').style.zIndex = '203'

  function replace(layer) {
    if (overlay) map.removeLayer(overlay)
    overlay = layer?.addTo(map) ?? null
  }

  async function prepare(variant) {
    const water = variant.endsWith('-w1-m0') ? 'w1' : 'w0'
    const waterLayer = water === 'w1' && waterwaysImageUrl ? prepareWaterImage() : null
    const coastLayer = geometryUrl && variant.startsWith('default-') ? prepareCoast() : null
    const layers = (await Promise.all([coastLayer, waterLayer])).filter(Boolean)
    if (!signal.aborted && layers.length) return L.layerGroup(layers)
  }

  async function prepareWaterImage() {
    const image = new Image()
    image.alt = ''
    image.src = waterwaysImageUrl
    await image.decode()
    return stableImageOverlay(L, image, bounds, {
      pane: 'mapPlusWater', interactive: false, className: 'mapplus-waterways-image',
    })
  }

  async function prepareCoast() {
    geometry ??= coastalGeometryText(geometryUrl).catch(error => {
      geometry = null
      throw error
    })
    const source = await geometry
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
    return stableSvgOverlay(L, svg, bounds, { pane: 'mapPlusCoast', interactive: false })
  }

  signal.addEventListener('abort', () => replace(null), { once: true })
  return { prepare, replace }
}
