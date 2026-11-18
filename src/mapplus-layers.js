import { normalizeBasemapStyle } from './map-ui/basemap-styles.js'
import { MAPPLUS_WONDERS_ENABLED, resolveWonders } from './map-landmarks.js'
import { createMapPlusCoastalLayer } from './mapplus-coastal-layer.js'
import { createMapPlusWaterLayer } from './mapplus-water-layer.js'
import { stableImageOverlay, anchorWorldTileLayer } from './map-stable-svg.js'
import { mapPlusOverviewUrl, mapPlusReleaseWater } from './mapplus-startup.js'

// Keep decoded 30-degree tiles for the current style (72 tiles, ~33 MiB RGBA).
// A small overview covers newly exposed areas while detail tiles decode.
export function attachMapPlusLayers(L, map, bounds, metadata, initial, signal, onReady, onError, initialStyle = 'default', onLandmarkSelect = () => {}) {
  const grid = metadata.geographicTiles
  const extent = L.latLngBounds(bounds), cache = new Map()
  const failures = new Map(), retryTimers = new Set()
  const detail = grid.detail
  const pyramid = metadata.terrainPyramid
  let pyramidLayer = null
  if (pyramid) map.createPane('mapPlusPyramid').style.zIndex = '200'
  // Keep a complete overview on its own surface so a delayed tile repaint
  // cannot expose the canvas behind the map.
  const overviewPane = map.createPane('mapPlusOverview')
  overviewPane.style.zIndex = '199'
  overviewPane.style.willChange = 'transform'
  const coastalLayer = createMapPlusCoastalLayer(L, map, extent, metadata.coastalGeometryUrl, signal)
  const waterPyramid = mapPlusReleaseWater?.source === metadata.waterwaysImageUrl ? mapPlusReleaseWater : null
  const waterLayer = createMapPlusWaterLayer(L, map, extent, metadata, waterPyramid, signal)
  let variant, disposed = false, pending = 0, queue = [], frame = 0, generation = 0
  let preview = null, readyVariant = null, awaitingPreview = false
  function mount(item) {
    if (!item.layer) item.layer = stableImageOverlay(L, item.image, item.bounds, {
      pane: 'tilePane', zIndex: item.hd ? 3 : 2,
      className: item.hd ? 'mapplus-basemap-detail' : 'mapplus-basemap', interactive: false,
    })
    if (!map.hasLayer(item.layer)) item.layer.addTo(map)
  }
  function makeCells(source, hd = false) {
    const { sourceWidth: w, sourceHeight: h, bleedPixels: bleed, columns, rows } = source
    const lng = x => extent.getWest() + (extent.getEast() - extent.getWest()) * x / w
    const lat = y => extent.getNorth() - (extent.getNorth() - extent.getSouth()) * y / h
    const cells = []
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      const x0 = Math.max(0, Math.round(col * w / columns) - bleed)
      const x1 = Math.min(w, Math.round((col + 1) * w / columns) + bleed)
      const y0 = Math.max(0, Math.round(row * h / rows) - bleed)
      const y1 = Math.min(h, Math.round((row + 1) * h / rows) + bleed)
      cells.push({ row, col, hd, key: `${hd ? 'hd/' : ''}${row}-${col}`, bounds: L.latLngBounds([[lat(y1), lng(x0)], [lat(y0), lng(x1)]]) })
    }
    return cells
  }
  const cells = makeCells(grid)
  const detailCells = detail ? makeCells(detail, true) : []
  const cacheKey = cell => `${variant}/${cell.key}`
  function rasterVariant(value) {
    if (grid.baseVariant && value.startsWith('default-')) return grid.baseVariant
    return metadata.vectorLakes ? value.replace('-w1-', '-w0-') : value
  }
  function ready() {
    if (disposed || map._animatingZoom || readyVariant === variant) return
    const view = map.getBounds()
    if (cells.filter(cell => view.intersects(cell.bounds)).every(cell => cache.get(cacheKey(cell))?.loaded)) {
      readyVariant = variant
      onReady()
    }
  }
  function retirePrevious() {
    for (const [key, item] of cache) if (item.variant !== variant) {
      if (item.layer) map.removeLayer(item.layer)
      // Pending decodes will discard themselves when they finish.
      cache.delete(key)
    }
  }
  function pump() {
    while (!disposed && !awaitingPreview && pending < 6 && queue.length) {
      const cell = queue.shift(), key = cacheKey(cell)
      if (cache.has(key)) continue
      const item = { variant, bounds: cell.bounds, hd: cell.hd, loaded: false, image: new Image(), layer: null }
      cache.set(key, item); pending++
      const image = item.image
      image.decoding = 'async'
      image.src = (cell.hd ? detail.url : grid.url).replace('{variant}', rasterVariant(variant)).replace('{row}', cell.row).replace('{col}', cell.col)
      image.decode().then(() => {
        if (disposed || item.variant !== variant || cache.get(key) !== item) return
        item.loaded = true
        if (!map._animatingZoom && !map.touchZoom?._zooming && (cell.hd ? map.getBounds() : map.getBounds().pad(0.25)).intersects(item.bounds)) mount(item)
        image.dataset.basemapStyle = item.variant.split('-w')[0]
        ready()
      }).catch(() => {
        if (disposed || item.variant !== variant || cache.get(key) !== item) return
        cache.delete(key)
        const attempts = (failures.get(key) || 0) + 1
        failures.set(key, attempts)
        // Failed HD decodes used to remain cached forever as "not loaded",
        // leaving the overview/base tile visible until the next page refresh.
        if (attempts <= 3) {
          const timer = setTimeout(() => { retryTimers.delete(timer); scheduleUpdate() }, 500 * 2 ** (attempts - 1))
          retryTimers.add(timer)
        } else onError()
      }).finally(() => { pending--; pump() })
    }
  }
  function update() {
    if (pyramid && variant?.startsWith('default-')) return
    if (disposed || map._animatingZoom || map.touchZoom?._zooming || !variant || awaitingPreview) return
    const viewport = map.getBounds(), view = viewport.pad(0.25), center = map.getCenter()
    const showDetail = detail && variant.startsWith('default-') && map.getZoom() >= detail.minZoom
    for (const [key, item] of cache) if (item.variant === variant) {
      if (item.hd && (!showDetail || !viewport.intersects(item.bounds))) {
        if (item.layer) map.removeLayer(item.layer)
        cache.delete(key)
      } else if (!item.loaded) continue
      else if (view.intersects(item.bounds)) mount(item)
      else if (item.layer && map.hasLayer(item.layer)) map.removeLayer(item.layer)
    }
    const byDistance = (a, b) => a.bounds.getCenter().distanceTo(center) - b.bounds.getCenter().distanceTo(center)
    const missing = cell => !cache.has(cacheKey(cell)) && (failures.get(cacheKey(cell)) || 0) <= 3
    const base = cells.filter(cell => view.intersects(cell.bounds) && missing(cell)).sort(byDistance)
    const hd = showDetail ? detailCells.filter(cell => viewport.intersects(cell.bounds) && missing(cell)).sort(byDistance) : []
    queue = [...hd, ...base]
    pump(); ready()
  }
  function scheduleUpdate() {
    if (!disposed && !frame) frame = requestAnimationFrame(() => { frame = 0; update() })
  }
  async function configure(layers, value = 'default') {
    const style = normalizeBasemapStyle(value)
    const next = `${style}-w${layers.rivers === false ? 0 : 1}-m0`
    if (variant === next) return
    variant = next; readyVariant = null
    queue = []
    const token = ++generation
    awaitingPreview = true
    let image
    let overviewReady
    if (grid.previewUrl) {
      image = new Image()
      image.decoding = 'async'
      image.fetchPriority = 'high'
      image.src = mapPlusOverviewUrl(metadata, style, layers.rivers)
      overviewReady = image.decode()
    }
    // Fetch auxiliary layers concurrently, but never hold the overview/tiles
    // behind a slow coastline SVG or water-image decode.
    coastalLayer.configure(next, onError)
    waterLayer.configure(layers.rivers !== false, onError)
    const [base] = await Promise.allSettled([overviewReady])
    if (disposed || generation !== token) return
    // Show the overview immediately; full-quality auxiliaries arrive afterward.
    if (image && base.status === 'fulfilled') {
      const previous = preview
      preview = stableImageOverlay(L, image, extent, { pane: 'mapPlusOverview', className: 'mapplus-overview', interactive: false }).addTo(map)
      if (previous) map.removeLayer(previous)
    }
    retirePrevious()
    if (pyramidLayer && style !== 'default') { map.removeLayer(pyramidLayer); pyramidLayer = null }
    if (pyramid && style === 'default' && !pyramidLayer) {
      pyramidLayer = L.tileLayer(pyramid.url, {
        pane: 'mapPlusPyramid', tileSize: metadata.width / pyramid.width * pyramid.tileSize,
        minZoom: metadata.minZoom - 1, maxZoom: metadata.maxZoom,
        minNativeZoom: pyramid.minZoom, maxNativeZoom: pyramid.maxZoom,
        bounds: extent, noWrap: true, keepBuffer: 1,
        updateWhenIdle: true, updateWhenZooming: false,
      })
      // Fractional map scales expose antialiased gaps between separate raster tiles.
      anchorWorldTileLayer(pyramidLayer)
      // A narrow overlap covers both resampling edges at fractional zoom levels.
      const initTile = pyramidLayer._initTile
      pyramidLayer._initTile = function (tile) {
        initTile.call(this, tile)
        const size = this.getTileSize()
        tile.style.width = `${size.x + 1}px`
        tile.style.height = `${size.y + 1}px`
      }
      const createTile = pyramidLayer.createTile
      pyramidLayer.createTile = function (coords, done) {
        let attempts = 0
        return createTile.call(this, coords, (error, tile) => {
          if (error && attempts++ < 3 && !disposed) {
            const timer = setTimeout(() => { retryTimers.delete(timer); if (!disposed) tile.src = this.getTileUrl(coords) }, 500 * 2 ** attempts)
            retryTimers.add(timer)
          } else done(error, tile)
        })
      }
      const progress = () => {
        const tiles = Object.values(pyramidLayer?._tiles || {})
        map.fire('mapplusloadprogress', { loaded: tiles.filter(tile => tile.loaded).length, total: tiles.length })
      }
      pyramidLayer.on('tileloadstart tileload', progress)
      pyramidLayer.on('load', async () => {
        const tiles = Object.values(pyramidLayer?._tiles || {})
        try {
          await Promise.all(tiles.map(tile => tile.el.decode()))
          if (!disposed) { progress(); onReady() }
        } catch { if (!disposed) onError() }
      })
      pyramidLayer.on('tileerror', onError).addTo(map)
    }
    awaitingPreview = false
    if (preview && !(pyramid && style === 'default')) onReady()
    if (preview) map.fire('mapplusoverviewready')
    scheduleUpdate()
  }
  map.on('move', scheduleUpdate)
  map.on('moveend zoomend', scheduleUpdate)
  signal.addEventListener('abort', () => {
    disposed = true; generation++; cancelAnimationFrame(frame)
    for (const timer of retryTimers) clearTimeout(timer)
    map.off('move', scheduleUpdate); map.off('moveend zoomend', scheduleUpdate)
    queue = []
    for (const item of cache.values()) if (item.layer) map.removeLayer(item.layer)
    cache.clear()
    if (preview) map.removeLayer(preview)
    if (pyramidLayer) map.removeLayer(pyramidLayer)
  }, { once: true })
  if (!MAPPLUS_WONDERS_ENABLED) {
    configure(initial, initialStyle)
    return { configure }
  }
  // Landmarks share the migration page's bottom-centre anchor and world-space size.
  const wonderOverviewZoom = 2
  let selectedLandmark = null, landmarkMinZoom = wonderOverviewZoom
  let landmarkRows = resolveWonders(), landmarkLayers = []
  function setSelectedLandmark(id) {
    selectedLandmark = id
    for (const {row,layer} of landmarkLayers) {
      const el=layer.getElement(); if(!el)continue
      el.setAttribute('aria-pressed',String(row.id===id))
    }
  }
  function updateLandmark() {
    if(disposed)return
    for(const {row,layer} of landmarkLayers) {
      if(!map.hasLayer(layer))layer.addTo(map)
      const el=layer.getElement()
      if(el){const visible=map.getZoom()>=landmarkMinZoom;el.style.visibility=visible?'visible':'hidden';el.style.pointerEvents=visible?'auto':'none';el.tabIndex=visible?0:-1}
    }
    resizeLandmarks()
  }
  function resizeLandmarks(event) {
    const zoom=Number.isFinite(event?.zoom)?event.zoom:map.getZoom()
    for(const {row,layer} of landmarkLayers){
      const el=layer.getElement();if(!el)continue
      // Stable SVG viewport: zoom the composited content, not the SVG dimensions.
      if(!el.dataset.wonderSized){
        const pixels=(extent.getEast()-extent.getWest())*row.size/2048*map.getZoomScale(3,0)
        el.style.width=pixels+'px';el.style.height=pixels/row.aspect+'px'
        el.style.marginLeft=-pixels/2+'px';el.style.marginTop=-pixels/row.aspect+'px'
        el.dataset.wonderSized='true'
      }
      const content=el.firstElementChild,scale=String(map.getZoomScale(zoom,3))
      if(content.style.scale!==scale){
        content.style.scale=scale
      }
    }
  }
  function configureLandmarks(rows) {
    if(disposed)return
    for(const {layer} of landmarkLayers)map.removeLayer(layer)
    landmarkRows=rows;landmarkLayers=[]
    const height=extent.getNorth()-extent.getSouth(),width=extent.getEast()-extent.getWest()
    for(const row of rows) {
      if(!row.position)continue
      const [y,x]=row.position,half=row.size/2,top=y+row.size/row.aspect
      const b=[[extent.getNorth()+height*y/1024,extent.getWest()+width*(x-half)/2048],
        [extent.getNorth()+height*top/1024,extent.getWest()+width*(x+half)/2048]]
      const content=document.createElement('div'),img=document.createElement('img')
      img.src=row.svg;img.alt='';img.draggable=false
      content.append(img)
      const layer=L.marker([b[0][0],(b[0][1]+b[1][1])/2],{keyboard:false,autoPanOnFocus:false,bubblingMouseEvents:false,
        icon:L.divIcon({className:'restored-map-marker map-wonder-marker',html:content,iconSize:[0,0],iconAnchor:[0,0]})})
      const select=()=>onLandmarkSelect(row)
      layer.on('click',select)
      layer.on('add',()=>{
        const el=layer.getElement();resizeLandmarks();setSelectedLandmark(selectedLandmark)
        if(el.dataset.landmarkId)return
        el.dataset.landmarkId=row.id;el.setAttribute('role','button');el.tabIndex=0
        el.setAttribute('aria-label',row.id==='landmark-ash-island-volcano'?'查看'+row.title+'：蒙特索姆布拉火山口、门多萨火山湖':'查看'+row.title)
        el.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key))return;event.preventDefault();event.stopPropagation();select()},{signal})
      })
      landmarkLayers.push({row,layer})
    }
    updateLandmark()
  }
  function configureLabelTier(minZoom) {
    landmarkMinZoom = Number.isFinite(minZoom) ? Math.min(minZoom, wonderOverviewZoom) : wonderOverviewZoom
    updateLandmark()
  }
  map.on('zoomend',updateLandmark)
  map.on('zoom',resizeLandmarks)
  map.on('zoomanim',resizeLandmarks)
  signal.addEventListener('abort',()=>{map.off('zoomend',updateLandmark);map.off('zoom',resizeLandmarks);map.off('zoomanim',resizeLandmarks);for(const {layer} of landmarkLayers)map.removeLayer(layer)},{once:true})
  configureLandmarks(landmarkRows)
  configure(initial, initialStyle)
  return { configure, configureLabelTier, setSelectedLandmark, configureLandmarks }
}
