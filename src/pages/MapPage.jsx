import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './map.css'
import '../page-actions.css'
import BackButton from '../components/BackButton.jsx'
import { useBackgroundMusic } from '../music-context.js'
import { soundIcon } from '../page-actions.js'
import { MAP_ROOT, MAP_TILE_ROOT, fetchMapLabels, fetchLegacyRegions } from '../map-assets.js'
import { attachMarkers } from '../map-markers.js'
import { attachRegions, focusMap, moveMap } from '../map-regions.js'
import { indexRegions } from '../map-ui/search.js'
import MapSearch from '../map-ui/MapSearch.jsx'
import MapControls from '../map-ui/MapControls.jsx'
import MapShare from '../map-ui/MapShare.jsx'
import { attachLabelDisplay } from '../map-labels.js'
import { attachMapFrame, coverMap, frameZoom } from '../map-frame.js'
import { buildMapShare, readMapShare } from '../map-ui/share.js'
import { DEFAULT_LAYERS, normalizePreferences, readPreferences, writePreferences, serializeView, restoreView } from '../map-ui/preferences.js'

const MapDetail = lazy(() => import('../map-ui/MapDetail.jsx'))

export default function MapPage() {
  const { enabled, toggleMusic } = useBackgroundMusic()
  const container = useRef(null)
  const viewer = useRef(null)
  const searchInput = useRef(null)
  const closeTimer = useRef(null)
  const history = useRef([])
  const [incoming] = useState(() => readMapShare(window.location.search))
  const [initial] = useState(() => incoming ? incoming.error ? normalizePreferences(null) : incoming : readPreferences())
  const settings = useRef(initial)
  const [status, setStatus] = useState('正在展开海陆图志…')
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [layers, setLayers] = useState(initial.layers)
  const [labelMode, setLabelMode] = useState(initial.labelMode)

  const [share, setShare] = useState(null)
  const [notice, setNotice] = useState(incoming?.error || '')
  const [query, setQuery] = useState(initial.query)
  const [canGoBack, setCanGoBack] = useState(false)
  const [legend, setLegend] = useState([])
  const [activeMarker, setActiveMarker] = useState(null)
  const [closing, setClosing] = useState(false)
  const [sheetSize, setSheetSize] = useState('half')
  const [zoomLimits, setZoomLimits] = useState({ min: false, max: false })
  const [markerError, setMarkerError] = useState('')
  const [markerRows, setMarkerRows] = useState([])
  const [regionRows, setRegionRows] = useState([])
  const [type, setType] = useState(initial.type)
  const [searchOpen, setSearchOpen] = useState(false)
  const rememberView = useCallback(() => {
    const map = viewer.current?.map
    if (!map) return
    map.stop()
    const center = map.getCenter(), current = { center: [center.lat, center.lng], zoom: map.getZoom() }
    const previous = history.current.at(-1)
    if (!previous || Math.abs(previous.zoom - current.zoom) > .001 || previous.center.some((value, i) => Math.abs(value - current.center[i]) > .001)) {
      history.current = [...history.current.slice(-7), current]
      setCanGoBack(true)
    }
  }, [])
  const openDetail = useCallback(row => {
    settings.current = { ...settings.current, selection: { kind: row.isRegion ? 'region' : 'point', id: String(row.sourceRegionId || row.id) } }
    writePreferences(settings.current)
    clearTimeout(closeTimer.current)
    setClosing(false); setSheetSize('half'); setSearchOpen(false); setActiveMarker(row)
  }, [])
  const closeMarker = useCallback((restoreFocus = false) => {
    settings.current = { ...settings.current, selection: null }
    writePreferences(settings.current)
    viewer.current?.points?.clear(); viewer.current?.territories?.clear()
    clearTimeout(closeTimer.current)
    setClosing(true)
    closeTimer.current = setTimeout(() => { setActiveMarker(null); setClosing(false) },
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180)
    if (restoreFocus) container.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => () => clearTimeout(closeTimer.current), [])
  useEffect(() => {
    const escape = event => {
      if (event.key === 'Escape' && !event.defaultPrevented) { setSearchOpen(false); closeMarker(true) }
    }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [closeMarker])

  useEffect(() => {
    settings.current = { ...settings.current, layers, labelMode, type, query }
    writePreferences(settings.current)
    viewer.current?.points?.configure({ points: layers.points, type })
    viewer.current?.territories?.configure(layers)
    const svg = viewer.current?.labels?.getElement()
    if (svg) svg.dataset.visible = String(layers.labels)
    viewer.current?.labelDisplay?.configure(labelMode)
  }, [layers, labelMode, type, query])

  useEffect(() => {
    const controller = new AbortController()
    let map, observer
    const markerRequest = fetch(`${MAP_ROOT}/markers.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('地点数据暂时无法加载'); return response.json() })
      .then(payload => { if (!Array.isArray(payload.data)) throw new Error('地点数据格式无效'); return payload.data })
      .catch(error => { if (!controller.signal.aborted) setMarkerError(error.message); return [] })
    async function open() {
      try {
        let metadata = attempt === 0 ? await window.__celestianMapManifest : null
        if (controller.signal.aborted) return
        if (!metadata) {
          const response = await fetch(`${MAP_ROOT}/manifest.json`, { signal: controller.signal, priority: 'high' })
          if (!response.ok) throw new Error('地图暂时无法打开，请重试。')
          metadata = await response.json()
        }
        if (controller.signal.aborted) return
        const scale = 2 ** metadata.maxZoom
        const bounds = L.latLngBounds([[-metadata.height / scale, 0], [0, metadata.width / scale]])
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
        map = L.map(container.current, {
          crs: L.CRS.Simple, zoomControl: false, attributionControl: false,
          minZoom: metadata.minZoom - 1, maxZoom: metadata.maxZoom, worldBounds: bounds,
          zoomSnap: 0, zoomDelta: 0.5, maxBoundsViscosity: 1, maxBounds: bounds,
          zoomAnimation: !reduced, fadeAnimation: !reduced, inertia: !reduced,
        })
        map.fitBounds(bounds, { animate: false })
        const frame = attachMapFrame(L, map, metadata, controller.signal)
        map.options.worldBounds = frame.bounds
        const fitZoom = () => frameZoom(map, frame.bounds, true)
        let coverZoom = frameZoom(map, frame.bounds, true)
        coverMap(map, frame.bounds)
        // Establish the camera before raising minZoom: otherwise Leaflet queues
        // a zoom animation that can later overwrite the restored saved view.
        map.setMinZoom(fitZoom())
        const saved = restoreView(settings.current.view, metadata)
        // Upgrade the old tiny overview once, while retaining intentional shared
        // views, open dossiers, and the user's later full-map preference.
        const oldOverview = saved && !incoming && settings.current.frameVersion !== 1 && !settings.current.selection && saved.zoom < coverZoom
        if (saved && !oldOverview) {
          map.setMinZoom(fitZoom())
          moveMap(map, saved.center, saved.zoom, { allowPadding: true, animate: false })
        } else {
          if (incoming?.view && incoming.view.coordinates !== metadata.coordinateSystemSha256) setNotice('这条链接来自其他版本的地图，已打开默认视野。')
          settings.current = { ...settings.current, selection: null }
        }
        const updateZoom = () => setZoomLimits({ min: map.getZoom() <= map.getMinZoom(), max: map.getZoom() >= map.getMaxZoom() })
        map.on('zoomend', updateZoom)
        updateZoom()
        const reportBasemapError = () => { setFailed(true); setStatus('部分地图未能加载，请重试。') }
        if (import.meta.env.DEV && window.__celestianLayeredPreview) {
          const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          ocean.style.backgroundColor = '#02243c'
          ocean.setAttribute('aria-hidden', 'true')
          L.svgOverlay(ocean, bounds, { pane: 'tilePane' }).addTo(map)
          let remaining = 2
          for (const name of ['land', 'mountains']) {
            L.imageOverlay(`/__local-map/${name}.svg`, bounds, { pane: 'tilePane', className: `map-preview-${name}` })
              .on('load', () => { if (--remaining === 0) setStatus('') })
              .on('error', reportBasemapError)
              .addTo(map)
          }
        } else {
          const tileRoot = import.meta.env.DEV && window.__celestianCompositePreview ? '/__local-map/composite' : MAP_TILE_ROOT
          const layer = L.tileLayer(`${tileRoot}/{z}/{x}/{y}.webp`, {
            tileSize: metadata.tileSize, minZoom: metadata.minZoom - 1, minNativeZoom: metadata.minZoom,
            maxZoom: metadata.maxZoom, maxNativeZoom: metadata.maxZoom,
            bounds, noWrap: true, keepBuffer: 1, updateWhenIdle: true, updateWhenZooming: false,
          })
          let tileFailed = false
          layer.on('tileloadstart', ({ tile }) => { tile.fetchPriority = 'high' })
          layer.on('load', () => { if (!tileFailed) setStatus('') })
          layer.on('tileerror', () => { tileFailed = true; reportBasemapError() })
          layer.addTo(map)
        }

        // Let the visible tiles claim bandwidth first without delaying search
        // or saved selections until every tile finishes.
        const overlayFetch = { signal: controller.signal, priority: 'low' }
        const regionRequest = Promise.all([
          fetchLegacyRegions(overlayFetch.signal, overlayFetch.priority),
          fetch(`${MAP_ROOT}/legacy-region-metadata.json`, overlayFetch).then(r => { if (!r.ok) throw Error('区域资料暂时无法加载'); return r.json() }),
        ]).catch(error => { if (!controller.signal.aborted) setMarkerError(error.message); return null })
        const labelRoot = import.meta.env.DEV && (window.__celestianCompositePreview || new URLSearchParams(window.location.search).get('labelPreview') === 'text')
          ? '/__local-map/text-labels' : MAP_ROOT
        const earlyLabels = attempt === 0 && window.__celestianMapLabels?.root === labelRoot ? window.__celestianMapLabels : null
        const labelRequest = Promise.all([
          fetchMapLabels(controller.signal, 'high', labelRoot, earlyLabels?.svg),
          Promise.resolve(earlyLabels?.index).then(index => {
            if (controller.signal.aborted || index) return index
            return fetch(`${labelRoot}/labels-index.json`, { signal: controller.signal, priority: 'high' })
              .then(r => { if (!r.ok) throw Error(); return r.json() })
          }).catch(() => null),
        ]).catch(error => { if (!controller.signal.aborted) setMarkerError(error.message); return null })
        map.createPane('mapLabelsPane').style.zIndex = '610'
        const saveView = () => {
          settings.current = { ...settings.current, frameVersion: 1, view: serializeView(map, metadata) }
          writePreferences(settings.current)
        }
        viewer.current = { map, bounds, frame, metadata, saveView }
        // Draw the base immediately. A slow or unavailable annotation layer must not block exploration.
        labelRequest.then(data => {
          if (controller.signal.aborted || !data) return
          const [labelsSVG, index] = data
          labelsSVG.classList.add('map-labels-overlay')
          viewer.current.labels = L.svgOverlay(labelsSVG, bounds, { interactive: false, pane: 'mapLabelsPane' }).addTo(map)
          labelsSVG.dataset.visible = String(settings.current.layers.labels)
          viewer.current.labelDisplay = attachLabelDisplay(map, labelsSVG, index, metadata, {
            mode: settings.current.labelMode, obstacles: () => viewer.current?.points?.obstacles() || [],
          })
          if (!viewer.current.labelDisplay.indexed) setNotice('地名分级暂不可用，已显示完整文字。')
        }).catch(() => { if (!controller.signal.aborted) setMarkerError('地图文字暂时无法加载，请重试。') })
        saveView()
        map.on('moveend', saveView)
        window.addEventListener('pagehide', saveView, { signal: controller.signal })
        observer = new ResizeObserver(() => {
          const wasCover = Math.abs(map.getZoom() - coverZoom) < .0001 && !settings.current.selection
          const center = map.getCenter()
          map.invalidateSize({ animate: false })
          map.setMinZoom(fitZoom())
          if (wasCover) moveMap(map, center, frameZoom(map, frame.bounds, true), { animate: false })
          coverZoom = frameZoom(map, frame.bounds, true)
          updateZoom()
        })
        observer.observe(container.current)
        const rows = await markerRequest
        if (controller.signal.aborted) return
        const points = attachMarkers(L, map, rows, metadata, row => {
          viewer.current?.territories?.clear(); openDetail(row)
        }, (position, zoom) => focusMap(map, position, zoom), { beforeNavigate: rememberView,
          settings: { points: settings.current.layers.points, type: settings.current.type } })
        viewer.current.points = points
        viewer.current.labelDisplay?.refresh()
        setMarkerRows(rows)
        const remembered = settings.current.selection
        if (remembered?.kind === 'point') {
          if (points.markers.has(remembered.id)) points.select(remembered.id, { navigate: false })
          else { settings.current.selection = null; if (incoming) setNotice('链接中的地点已不存在，仍可浏览分享时的视野。') }
        }
        map.on('click', () => { closeMarker(); setSearchOpen(false) })
        const regionData = await regionRequest
        if (controller.signal.aborted || !regionData) return
        const [regionsSVG, payload] = regionData
        const validIDs = new Set([...regionsSVG.querySelectorAll('[data-region-id]')].map(path => path.dataset.regionId))
        const territories = attachRegions(L, map, regionsSVG, payload.data, bounds, row => {
          points.clear(); openDetail(row)
        }, { beforeNavigate: rememberView, settings: settings.current.layers })
        viewer.current.territories = territories
        setLegend(territories.legend)
        setRegionRows(indexRegions(payload.data, validIDs))
        if (settings.current.selection?.kind === 'region') {
          const id = settings.current.selection.id
          if (validIDs.has(id) && payload.data.some(row => row.region_id === id)) territories.select(id, { navigate: false })
          else { settings.current.selection = null; if (incoming) setNotice('链接中的区域已不存在，仍可浏览分享时的视野。') }
        }
      } catch (error) {
        if (controller.signal.aborted) return
        setFailed(true)
        setStatus(error.message || '地图暂时无法打开，请重试。')
      }
    }
    open()
    return () => {
      if (map && viewer.current?.map === map) {
        viewer.current.saveView?.()
        viewer.current.points?.destroy()
        viewer.current.territories?.destroy()
        viewer.current.labelDisplay?.destroy()
      }
      controller.abort()
      observer?.disconnect()
      map?.off()
      map?.remove()
      viewer.current = null
    }
  }, [attempt, openDetail, closeMarker, rememberView, incoming])

  function retry() {
    clearTimeout(closeTimer.current)
    setFailed(false); setMarkerError(''); setActiveMarker(null); setClosing(false)
    setMarkerRows([]); setRegionRows([]); setStatus('正在展开海陆图志…'); setAttempt(value => value + 1)
  }
  function fullView() {
    rememberView()
    closeMarker(); setSearchOpen(false)
    if (viewer.current) {
      const { map, frame } = viewer.current
      const zoom = frameZoom(map, frame.bounds, true)
      map.setMinZoom(zoom)
      moveMap(map, frame.bounds.getCenter(), zoom)
    }
  }
  function centerMap() { rememberView(); closeMarker(); if (viewer.current) moveMap(viewer.current.map, viewer.current.bounds.getCenter()) }
  function previousView() {
    const previous = history.current.pop()
    if (!previous || !viewer.current) return
    closeMarker(); setSearchOpen(false); setCanGoBack(history.current.length > 0)
    const { map } = viewer.current
    moveMap(map, previous.center, previous.zoom, { allowPadding: true })
  }
  function resetView() {
    closeMarker(); setSearchOpen(false); setLayers({ ...DEFAULT_LAYERS }); setLabelMode('auto'); setType(''); setQuery('')
    history.current = []; setCanGoBack(false)
    if (!viewer.current) return
    const { map, frame } = viewer.current
    moveMap(map, frame.bounds.getCenter(), frameZoom(map, frame.bounds, true))
  }
  function changeType(value) {
    setType(value)
    const types = Array.isArray(value) ? value : value ? [value] : []
    if (types.length) setLayers(current => ({ ...current, points: true }))
    if (activeMarker && !activeMarker.isRegion && types.length && !types.includes(activeMarker.type)) closeMarker()
  }
  function shareView(withSelection = false) {
    if (!viewer.current) return
    const { map, metadata } = viewer.current
    map.stop()
    const selection = withSelection ? settings.current.selection : null
    const url = buildMapShare(window.location.href, { ...settings.current, view: serializeView(map, metadata) }, selection)
    setShare({ url, selection, title: selection ? `分享${activeMarker?.title || '此区域'}` : '分享当前视野' })
  }

  return (
    <main id="map-app" className="tiled-map" data-sheet={activeMarker ? sheetSize : 'closed'}>
      <div ref={container} className="tiled-map__canvas" aria-label="世界地图，可拖动和缩放" />
      <nav className="map-page-actions" aria-label="页面控制">
        <button className="page-action" type="button" onClick={toggleMusic} aria-pressed={!enabled} aria-label={enabled ? '静音' : '开启声音'} title={enabled ? '静音' : '开启声音'} dangerouslySetInnerHTML={{ __html: soundIcon(!enabled) }} />
        <BackButton className="page-action" aria-label="关闭并返回百科" title="关闭并返回百科"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></BackButton>
      </nav>
      <header className="tiled-map__header">
        <MapSearch points={markerRows} regions={regionRows} query={query} setQuery={setQuery} type={type} onType={changeType} open={searchOpen} onOpen={setSearchOpen} inputRef={searchInput} onSelect={({ kind, row }) => {
          if (kind === 'region') viewer.current?.territories?.select(row.region_id)
          else viewer.current?.points?.select(row.id)
        }} />
        <h1 className="sr-only">海陆图志</h1>
      </header>
      {failed && status && <div className="tiled-map__status" role="status"><span>{status}</span><button onClick={retry}>重试</button></div>}
      {markerError && <div className="map-marker-error" role="status">{markerError} <button onClick={retry}>重试</button></div>}
      {notice && <div className="map-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="关闭地图提示">知道了</button></div>}
      {share && <MapShare value={share} onClose={() => setShare(null)} />}
      {activeMarker && <Suspense fallback={null}><MapDetail row={activeMarker} closing={closing} size={sheetSize} onSize={setSheetSize} onClose={closeMarker} onShare={() => shareView(true)} onTerritoryView={all => {
        setSheetSize('half'); viewer.current?.territories?.focus(activeMarker.sourceRegionId, { all })
      }} /></Suspense>}
      <MapControls layers={layers} onLayer={key => setLayers(value => ({ ...value, [key]: !value[key] }))} labelMode={labelMode} onLabelMode={setLabelMode} onShare={() => shareView()} legend={legend} pointTypes={[...new Set(markerRows.map(row => row.type))]} onFull={fullView} onCenter={centerMap} onReset={resetView} onBack={previousView} canGoBack={canGoBack} zoomLimits={zoomLimits} onZoom={direction => {
        const map = viewer.current?.map
        if (!map) return
        map.stop()
        map.setZoom(map.getZoom() + direction * .5, { animate: !matchMedia('(prefers-reduced-motion: reduce)').matches })
      }} />
    </main>
  )
}
