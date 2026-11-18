import { isDefaultPollution, maskPollutedBorders, pollutionArtwork, pollutionCoast, readPollution } from './map-pollution.js'
import { stableImageOverlay, stableSvgOverlay } from './map-stable-svg.js'
import { rasterizeMapSVG } from './map-svg-raster.js'

export function attachMapPlusPollution(L, map, bounds, regions, { defaultBorder, previewUrl, coastUrl, signal }) {
  const paneName = 'mapPollutionPane'
  const pane = map.getPane(paneName) || map.createPane(paneName)
  pane.style.zIndex = '639'
  pane.style.pointerEvents = 'none'
  const options = { pane: paneName, interactive: false }
  let current, preview, coast, enabled, revision = 0

  function replace(layer, path) {
    if (layer !== current) {
      current?.remove()
      current = layer?.addTo(map)
    }
    maskPollutedBorders(regions, path)
  }

  async function loadPreview() {
    const image = new Image()
    image.alt = ''
    image.dataset.pollutionWash = ''
    image.src = previewUrl
    await image.decode()
    return stableImageOverlay(L, image, bounds, options)
  }

  async function rasterArtwork(svg) {
    // Freeze the edited wash at the same resolution as the release image.
    // Keep the border mask vector so country outlines and hit areas stay exact.
    const canvas = await rasterizeMapSVG(svg, 2048, 1024)
    canvas.dataset.pollutionWash = ''
    return stableSvgOverlay(L, canvas, bounds, options)
  }

  async function configure(show, force = false) {
    if (!force && enabled === show) return
    enabled = show
    const token = ++revision
    const isCurrent = () => !signal.aborted && token === revision
    if (!show) { replace(); return }
    const entries = readPollution()
    if (previewUrl && defaultBorder && isDefaultPollution(entries)) {
      try {
        preview ??= loadPreview().catch(error => { preview = null; throw error })
        const layer = await preview
        if (isCurrent()) replace(layer, defaultBorder)
        return
      } catch (error) {
        if (!isCurrent()) return
        console.warn('Unable to load the published pollution wash', error)
      }
    }
    if (!entries.length) { replace(); return }
    try {
      coast ??= pollutionCoast(coastUrl).catch(error => { coast = null; throw error })
      const coastline = await coast
      if (!isCurrent()) return
      const artwork = pollutionArtwork(regions, entries, { coast: coastline })
      const path = artwork.querySelector('[data-pollution-wash]')?.getAttribute('d')
      if (!path) { replace(); return }
      const layer = await rasterArtwork(artwork).catch(() => stableSvgOverlay(L, artwork, bounds, options))
      if (isCurrent()) replace(layer, path)
    } catch (error) {
      if (isCurrent()) console.warn('Unable to update the pollution wash', error)
    }
  }

  return {
    configure,
    destroy() { revision++; replace() },
  }
}
