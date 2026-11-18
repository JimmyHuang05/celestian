import { anchorWorldTileLayer, stableImageOverlay } from './map-stable-svg.js'

export function createMapPlusWaterLayer(L, map, bounds, metadata, pyramid, signal) {
  const pane = map.createPane('mapPlusWater')
  pane.style.zIndex = '203'
  pane.style.pointerEvents = 'none'
  if (pyramid) {
    // The preview pane follows the shared camera. Tile levels already apply
    // that transform themselves, so keep them outside the transformed pane.
    const detailPane = map.createPane('mapPlusWaterDetail')
    detailPane.style.zIndex = '204'
    detailPane.style.pointerEvents = 'none'
  }
  const previewUrl = pyramid?.preview || metadata.waterwaysImageUrl
  let previewRequest, preview, image, detail, frame
  let enabled = false
  const failed = new WeakSet()

  function showDetail(show) {
    detail?.setOpacity(show ? 1 : 0)
    if (image) image.style.visibility = show ? 'hidden' : ''
  }

  function showPreview() { showDetail(false) }

  function settle() {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      if (!detail || map._animatingZoom || map.touchZoom?._zooming || map.dragging?.moving()) return
      if (detail.isLoading()) { showPreview(); return }
      const visible = Object.values(detail._tiles).filter(tile => tile.current)
      showDetail(visible.length > 0 && visible.every(tile => tile.loaded && !failed.has(tile.el)))
    })
  }

  function updateZoom() {
    if (!pyramid || !enabled || !preview || !map.hasLayer(preview)) return
    if (map.getZoom() < (detail ? 3.25 : 3.5)) {
      showPreview()
      detail?.remove()
      detail = null
      return
    }
    if (!detail) {
      detail = anchorWorldTileLayer(L.tileLayer(pyramid.tiles, {
        pane: 'mapPlusWaterDetail', className: 'mapplus-waterways-tiles',
        tileSize: metadata.width / 8192 * 512, bounds, noWrap: true,
        minZoom: 3, minNativeZoom: 4, maxNativeZoom: 6, maxZoom: metadata.maxZoom,
        keepBuffer: 1, updateWhenIdle: true, updateWhenZooming: false, opacity: 0,
      }))
      detail.on('tileloadstart', () => {
        if (!map._animatingZoom && !map.touchZoom?._zooming) showPreview()
      })
      detail.on('tileerror', ({ tile }) => failed.add(tile))
      detail.on('load', settle)
      detail.addTo(map)
    }
    settle()
  }

  async function loadPreview() {
    const element = new Image()
    element.alt = ''
    element.src = previewUrl
    await element.decode()
    image = element
    return stableImageOverlay(L, element, bounds, {
      pane: 'mapPlusWater', interactive: false, className: 'mapplus-waterways-image',
    })
  }

  function configure(show, onError) {
    enabled = show && Boolean(previewUrl)
    if (!enabled) {
      showPreview()
      detail?.remove()
      detail = null
      preview?.remove()
      return
    }
    previewRequest ??= loadPreview().catch(error => { previewRequest = null; throw error })
    previewRequest.then(layer => {
      if (!enabled || signal.aborted) return
      preview = layer
      if (!map.hasLayer(preview)) preview.addTo(map)
      updateZoom()
    }, () => { if (enabled && !signal.aborted) onError() })
  }

  if (pyramid) {
    map.on('dragstart', showPreview)
    map.on('zoomend', updateZoom)
    map.on('moveend', settle)
  }
  signal.addEventListener('abort', () => {
    map.off('dragstart', showPreview)
    map.off('zoomend', updateZoom)
    map.off('moveend', settle)
    cancelAnimationFrame(frame)
    configure(false)
  }, { once: true })
  return { configure }
}
