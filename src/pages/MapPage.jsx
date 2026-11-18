import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './map.css'
import { migratedMarkers, migratedLabels, watchMigratedResources } from '../map-migrated-resources.js'
import '../page-actions.css'
import BackButton from '../components/BackButton.jsx'
import { useBackgroundMusic } from '../music-context.js'
import { soundIcon } from '../page-actions.js'
import { MAP_ROOT, MAP_TILE_ROOT, fetchMapLabels, fetchLegacyRegions } from '../map-assets.js'
import { attachMarkers } from '../map-markers.js'
import { pollutionCoreMarkers } from '../map-pollution-cores.js'
import { sanVidalMarkers } from '../san-vidal-places.js'
import { southernSettlementMarkers } from '../map-southern-nations.js'
import { attachRegions, focusMap, moveMap } from '../map-regions.js'
import { loadPoliticalStudy, parsePoliticalSVG } from '../map-political-study.js'
import { watchPoliticalDraft } from '../political-live.js'
import { indexRegions } from '../map-ui/search.js'
import MapSearch from '../map-ui/MapSearch.jsx'
import MapControls from '../map-ui/MapControls.jsx'
import MapShare from '../map-ui/MapShare.jsx'
import { attachLabelDisplay } from '../map-labels.js'
import { stableSvgOverlay } from '../map-stable-svg.js'
import { watchPollution } from '../map-pollution.js'
import { attachMapPlusPollution } from '../mapplus-pollution-layer.js'
import { attachMapFrame, coverMap, frameZoom } from '../map-frame.js'
import { attachMapPlusLayers } from '../mapplus-layers.js'
import MapStudyRoutes from '../studies/MapStudyRoutes.jsx'
import MapShips from '../studies/MapShips.jsx'
import MapCottonTexture from '../studies/MapCottonTexture.jsx'
import MapOceanRelief from '../studies/MapOceanRelief.jsx'
import { WONDER_KEY, resolveWonders } from '../map-landmarks.js'
import { placementEntries } from '../map-placement-archive.js'
import { buildMapShare, readMapShare } from '../map-ui/share.js'
import { MAPPLUS_PREFERENCES_KEY, mapPlusManifest, mapPlusReleasePolitics, mapPlusReleasePollution } from '../mapplus-startup.js'
import { DEFAULT_LAYERS, MAP_PREFERENCES_KEY, normalizePreferences, readPreferences, writePreferences, serializeView, restoreView } from '../map-ui/preferences.js'

const loadMapDetail = () => import('../map-ui/MapDetail.jsx')
const MapDetail = lazy(loadMapDetail)
export default function MapPage({ mapPlus = false }) {
  const { enabled, toggleMusic } = useBackgroundMusic()
  const preferencesKey = mapPlus ? MAPPLUS_PREFERENCES_KEY : MAP_PREFERENCES_KEY
  const title = mapPlus ? '新世界地图' : '海陆图志'
  const container = useRef(null)
  const viewer = useRef(null)
  const [routeViewer,setRouteViewer] = useState(null)
  const searchInput = useRef(null)
  const closeTimer = useRef(null)
  const history = useRef([])
  const [incoming] = useState(() => readMapShare(window.location.search))
  const [initial] = useState(() => {
    const value = incoming ? incoming.error ? normalizePreferences(null) : incoming : readPreferences(preferencesKey)
    if (mapPlus) value.layers.countries = false
    return value
  })
  const settings = useRef(initial)
  const [status, setStatus] = useState(`正在展开${title}…`)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [layers, setLayers] = useState(initial.layers)
  const [labelMode, setLabelMode] = useState(initial.labelMode)
  const [basemapStyle, setBasemapStyle] = useState(initial.basemapStyle || 'default')

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
    viewer.current?.terrainLayers?.setSelectedLandmark?.(row.isLandmark ? row.id : null)
    settings.current = { ...settings.current, selection: { kind: row.isRegion ? 'region' : 'point', id: String(row.sourceRegionId || row.id) } }
    writePreferences(settings.current, preferencesKey)
    clearTimeout(closeTimer.current)
    setClosing(false); setSheetSize('half'); setSearchOpen(false); setActiveMarker(row)
  }, [preferencesKey])
  const closeMarker = useCallback((restoreFocus = false) => {
    viewer.current?.terrainLayers?.setSelectedLandmark?.(null)
    settings.current = { ...settings.current, selection: null }
    writePreferences(settings.current, preferencesKey)
    viewer.current?.points?.clear(); viewer.current?.territories?.clear()
    clearTimeout(closeTimer.current)
    setClosing(true)
    closeTimer.current = setTimeout(() => { setActiveMarker(null); setClosing(false) },
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180)
    if (restoreFocus) container.current?.focus({ preventScroll: true })
  }, [preferencesKey])

  useEffect(() => () => clearTimeout(closeTimer.current), [])
  useEffect(() => {
    const escape = event => {
      if (event.key === 'Escape' && !event.defaultPrevented) { setSearchOpen(false); closeMarker(true) }
    }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [closeMarker])

  useEffect(() => {
    settings.current = { ...settings.current, layers, labelMode, basemapStyle, type, query }
    writePreferences(settings.current, preferencesKey)
  }, [layers, labelMode, basemapStyle, type, query, preferencesKey])

  useEffect(() => {
    viewer.current?.points?.configure({ points: layers.points, type })
    viewer.current?.territories?.configure(layers)
    viewer.current?.refreshPollution?.()
    const svg = viewer.current?.labels?.getElement()
    if (svg) svg.dataset.visible = String(layers.labels)
    viewer.current?.labelDisplay?.configure(labelMode)
    viewer.current?.terrainLayers?.configure(layers, basemapStyle)
  }, [layers, labelMode, basemapStyle, type])

  useEffect(() => {
    if (layers.countries || searchOpen) viewer.current?.loadTerritories?.()
  }, [layers.countries, searchOpen])

  useEffect(() => {
    const controller = new AbortController()
    let map, observer
    if (mapPlus) void loadMapDetail().catch(() => {})
    const markerRequest = mapPlus ? migratedMarkers(controller.signal).catch(error => { if (!controller.signal.aborted) setMarkerError(error.message); return [] }) : fetch(`${MAP_ROOT}/markers.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('地点数据暂时无法加载'); return response.json() })
      .then(payload => { if (!Array.isArray(payload.data)) throw new Error('地点数据格式无效'); return payload.data })
      .catch(error => { if (!controller.signal.aborted) setMarkerError(error.message); return [] })
    async function open() {
      try {
        let metadata = mapPlus
          ? await mapPlusManifest({ fresh: attempt > 0 })
          : attempt === 0 ? await window.__celestianMapManifest : null
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
        const reportBasemapError = () => { setFailed(true); setStatus('部分地图未能加载，请重试。') }
        const frame = attachMapFrame(L, map, metadata, controller.signal, {openCorners:mapPlus})
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
          moveMap(map, saved.center, saved.zoom, { animate: false })
        } else {
          if (incoming?.view && incoming.view.coordinates !== metadata.coordinateSystemSha256) setNotice('这条链接来自其他版本的地图，已打开默认视野。')
          settings.current = { ...settings.current, selection: null }
        }
        const updateZoom = () => setZoomLimits({ min: map.getZoom() <= map.getMinZoom(), max: map.getZoom() >= map.getMaxZoom() })
        map.on('zoomend', updateZoom)
        updateZoom()
        const layeredPreview = import.meta.env.DEV && window.__celestianLayeredPreview
        let terrainLayers
        if (mapPlus && metadata.vectorLayers) {
          const originalResolution = new URLSearchParams(window.location.search).get('resolution') === '4k'
          const basemap = originalResolution
            ? { ...metadata, geographicTiles: { ...metadata.geographicTiles, detail: undefined } }
            : metadata
          terrainLayers = attachMapPlusLayers(L, map, bounds, basemap, settings.current.layers, controller.signal, () => { setStatus(''); setFailed(false) }, reportBasemapError, settings.current.basemapStyle, row => {
            rememberView()
            viewer.current?.points?.clear(); viewer.current?.territories?.clear()
            openDetail(row)
            const position=[-metadata.height*(1-row.lat/5200)/2**metadata.maxZoom,metadata.width*row.lng/10800/2**metadata.maxZoom]
            focusMap(map,position)
          })
        } else if (mapPlus) {
          L.imageOverlay(metadata.compositeImageUrl || metadata.imageUrl, bounds, { pane: 'tilePane', className: 'mapplus-basemap' })
            .on('load', () => setStatus(''))
            .on('error', reportBasemapError)
            .addTo(map)
          // Keep the vector source, but display its lossless high-resolution cache:
          // scaling the full coastline SVG repeatedly stalls browser rasterization.
          for (const [url, className] of [[metadata.mountainsUrl, 'mapplus-mountains'], [metadata.coastlineCacheUrl || metadata.coastlineUrl, 'mapplus-coastline'], [metadata.textureUrl, 'mapplus-texture']]) {
            if (url && !metadata.compositeImageUrl) L.imageOverlay(url, bounds, { pane: 'tilePane', className, interactive: false })
              .on('error', reportBasemapError).addTo(map)
          }
        } else if (layeredPreview) {
          const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          ocean.classList.add('map-ocean')
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
          const tileUrl = `${tileRoot}/{z}/{x}/{y}.webp`
          const layer = L.tileLayer(tileUrl, {
            tileSize: metadata.tileSize,
            minZoom: metadata.minZoom - 1,
            minNativeZoom: metadata.minZoom,
            maxZoom: metadata.maxZoom,
            maxNativeZoom: metadata.maxZoom,
            bounds, noWrap: true, keepBuffer: 1, updateWhenIdle: true, updateWhenZooming: false,
          })
          let tileFailed = false
          layer.on('tileloadstart', ({ tile }) => { tile.fetchPriority = 'high' })
          layer.on('load', () => { if (!tileFailed) setStatus('') })
          layer.on('tileerror', () => { tileFailed = true; reportBasemapError() })
          layer.addTo(map)
        }
        const saveView = () => {
          settings.current = { ...settings.current, frameVersion: 1, view: serializeView(map, metadata) }
          writePreferences(settings.current, preferencesKey)
        }
        viewer.current = { map, bounds, frame, metadata, saveView, terrainLayers }
        setRouteViewer(viewer.current)
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
        // Let the visible tiles claim bandwidth first without delaying search
        // or saved selections until every tile finishes.
        const overlayFetch = { signal: controller.signal, priority: 'low' }
        let regionMetadata
        const fetchRegionMetadata = () => regionMetadata ||= fetch(`${MAP_ROOT}/legacy-region-metadata.json`, overlayFetch)
          .then(r => { if (!r.ok) throw Error('区域资料暂时无法加载'); return r.json() })
          .catch(error => { regionMetadata = null; throw error })
        const labelRoot = import.meta.env.DEV && (window.__celestianCompositePreview || new URLSearchParams(window.location.search).get('labelPreview') === 'text')
          ? '/__local-map/text-labels' : MAP_ROOT
        const earlyLabels = attempt === 0 && window.__celestianMapLabels?.root === labelRoot ? window.__celestianMapLabels : null
        const labelRequest = mapPlus ? migratedLabels(metadata, controller.signal) : Promise.all([
          fetchMapLabels(controller.signal, 'high', labelRoot, earlyLabels?.svg),
          Promise.resolve(earlyLabels?.index).then(index => {
            if (controller.signal.aborted || index) return index
            return fetch(`${labelRoot}/labels-index.json`, { signal: controller.signal, priority: 'high' })
              .then(r => { if (!r.ok) throw Error(); return r.json() })
          }).catch(() => null),
        ]).catch(error => { if (!controller.signal.aborted) setMarkerError(error.message); return null })
        async function openPolitics(liveDraft) {
          const snapshot = !liveDraft && await mapPlusReleasePolitics()?.catch(() => null)
          controller.signal.throwIfAborted()
          if (!snapshot) return loadPoliticalStudy(metadata, controller.signal, liveDraft)
          if (snapshot.coordinateSystemSha256 !== metadata.coordinateSystemSha256) throw Error('政区资料与当前地图坐标不匹配。')
          return [parsePoliticalSVG(snapshot.svg), snapshot.records, snapshot.pollutionBorder]
        }
        const initialPolitical = mapPlus ? openPolitics().then(data => ({ data }), error => ({ error })) : null
        map.createPane('mapLabelsPane').style.zIndex = '610'
        // Draw the base immediately. A slow or unavailable annotation layer must not block exploration.
        const installLabels = data => {
          if (controller.signal.aborted || !data) return
          viewer.current.labelDisplay?.destroy()
          if (viewer.current.labels) map.removeLayer(viewer.current.labels)
          const [labelsSVG, index] = data
          viewer.current.terrainLayers?.configureLabelTier?.(index?.detailMinZoom)
          labelsSVG.classList.add('map-labels-overlay')
          viewer.current.labels = (mapPlus
            ? stableSvgOverlay(L, labelsSVG, bounds, { interactive: false, pane: 'mapLabelsPane' })
            : L.svgOverlay(labelsSVG, bounds, { interactive: false, pane: 'mapLabelsPane' })).addTo(map)
          labelsSVG.dataset.visible = String(settings.current.layers.labels)
          viewer.current.labelDisplay = attachLabelDisplay(map, labelsSVG, index, metadata, {
            mode: settings.current.labelMode, obstacles: () => viewer.current?.points?.obstacles() || [],
          })
          if (index?.data?.length && !viewer.current.labelDisplay.indexed) setNotice('地名分级暂不可用，已显示完整文字。')
        }
        labelRequest.then(async data => {
          installLabels(data)
          await new Promise(resolve => requestAnimationFrame(resolve))
          await document.fonts.ready
          if(mapPlus&&!controller.signal.aborted)document.documentElement.classList.add('atlas-fonts-ready')
        }).catch(error => { if (!controller.signal.aborted) setMarkerError(error.message || '地图文字暂时无法加载，请重试。') })
        let points
        let currentLandmarks = []
        const installPoints = sourceRows => {
          const rows = mapPlus ? [...sourceRows, ...pollutionCoreMarkers, ...sanVidalMarkers, ...southernSettlementMarkers] : sourceRows
          points?.destroy()
          if (points) map.removeLayer(points.layer)
          points = attachMarkers(L, map, rows, metadata, row => {
            viewer.current?.territories?.clear(); openDetail(row)
          }, (position, zoom) => focusMap(map, position, zoom), { beforeNavigate: rememberView, sharedCamera: mapPlus,
            settings: { points: settings.current.layers.points, type: settings.current.type } })
          viewer.current.points = points
          viewer.current.labelDisplay?.refresh()
          setMarkerRows(rows)
        }
        async function openPoints() {
          const rows = await markerRequest
          if (controller.signal.aborted) return
          installPoints(rows)
          const loadLandmarks = terrainLayers?.configureLandmarks
            ? async () => resolveWonders(await placementEntries(WONDER_KEY))
            : null
          if (mapPlus) {
            if (loadLandmarks) {
              currentLandmarks = await loadLandmarks()
              if (controller.signal.aborted) return
              terrainLayers.configureLandmarks(currentLandmarks)
            }
            let revision = 0
            watchMigratedResources(controller.signal, async () => {
              const version = ++revision
              try {
                const [nextRows, nextLabels, nextLandmarks] = await Promise.all([migratedMarkers(controller.signal), migratedLabels(metadata, controller.signal), loadLandmarks?.()])
                if (controller.signal.aborted || version !== revision) return
                installPoints(nextRows); installLabels(nextLabels)
                if (nextLandmarks) {
                  currentLandmarks = nextLandmarks
                  terrainLayers.configureLandmarks(currentLandmarks)
                }
              } catch (error) { if (!controller.signal.aborted) setMarkerError(error.message) }
            })
          }
          const remembered = settings.current.selection
          if (remembered?.kind === 'point') {
            const landmark = mapPlus && currentLandmarks.find(row => row.position && row.id === remembered.id)
            if (landmark) openDetail(landmark)
            else if (points.markers.has(remembered.id)) points.select(remembered.id, { navigate: false })
            else { settings.current.selection = null; if (incoming) setNotice('链接中的地点已不存在，仍可浏览分享时的视野。') }
          }
        }
        map.on('click', () => { closeMarker(); setSearchOpen(false) })
        let regionTask, regionRevision = 0, livePoliticalDraft
        const loadTerritories = (refresh = false) => {
          if (regionTask && !refresh) return regionTask
          const revision = ++regionRevision
          regionTask = (async () => {
            const [regionsSVG, records, defaultBorder] = mapPlus
              ? await (revision === 1 ? initialPolitical.then(({ data, error }) => {
                if (error) throw error
                return data
              }) : openPolitics(livePoliticalDraft))
              : await Promise.all([fetchLegacyRegions(overlayFetch.signal, overlayFetch.priority), fetchRegionMetadata().then(payload => payload.data)])
            if (controller.signal.aborted || revision !== regionRevision) return
            let updatingSelection = Boolean(viewer.current.territories)
            viewer.current.territories?.destroy()
            const territories = attachRegions(L, map, regionsSVG, records, bounds, row => {
              if (updatingSelection) setActiveMarker(row)
              else { points?.clear(); openDetail(row) }
            }, { beforeNavigate: rememberView, settings: settings.current.layers, political: mapPlus })
            viewer.current.territories = territories
            if (mapPlus) {
              viewer.current.pollution?.destroy()
              const pollution = attachMapPlusPollution(L, map, bounds, regionsSVG, {
                defaultBorder, previewUrl: mapPlusReleasePollution, coastUrl: metadata.coastalGeometryUrl, signal: controller.signal,
              })
              viewer.current.pollution = pollution
              viewer.current.refreshPollution = force => pollution.configure(settings.current.layers.statuses !== false, force)
              void viewer.current.refreshPollution()
            }
            setLegend(territories.legend)
            const validIDs = new Set([...regionsSVG.querySelectorAll('[data-region-id]')].map(path => path.dataset.regionId))
            setRegionRows(indexRegions(records, validIDs))
            if (settings.current.selection?.kind === 'region') {
              const id = settings.current.selection.id
              if (validIDs.has(id) && records.some(row => row.region_id === id)) territories.select(id, { navigate: false })
              else if (updatingSelection) closeMarker()
              else { settings.current.selection = null; if (incoming) setNotice('链接中的区域已不存在，仍可浏览分享时的视野。') }
            }
            updatingSelection = false
          })().catch(error => {
            if (controller.signal.aborted || revision !== regionRevision) return
            regionTask = null
            setMarkerError(error.message)
          })
          return regionTask
        }
        viewer.current.loadTerritories = loadTerritories
        if (mapPlus) {
          watchPollution(() => viewer.current?.refreshPollution?.(true), controller.signal)
          let timer
          const stop = watchPoliticalDraft(draft => {
            livePoliticalDraft = draft
            clearTimeout(timer)
            timer = setTimeout(() => loadTerritories(true), 60)
          })
          controller.signal.addEventListener('abort', () => {clearTimeout(timer);stop()}, {once:true})
        }
        loadTerritories()
        await openPoints()
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
        viewer.current.pollution?.destroy()
        viewer.current.labelDisplay?.destroy()
      }
      controller.abort()
      observer?.disconnect()
      map?.off()
      map?.remove()
      viewer.current = null
      setRouteViewer(null)
    }
  }, [attempt, openDetail, closeMarker, rememberView, incoming, mapPlus, preferencesKey])

  function retry() {
    clearTimeout(closeTimer.current)
    setFailed(false); setMarkerError(''); setActiveMarker(null); setClosing(false)
    setMarkerRows([]); setRegionRows([]); setStatus(`正在展开${title}…`); setAttempt(value => value + 1)
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
    moveMap(map, previous.center, previous.zoom)
  }
  function resetView() {
    closeMarker(); setSearchOpen(false); setLayers({ ...DEFAULT_LAYERS }); setLabelMode('auto'); setBasemapStyle('default'); setType(''); setQuery('')
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
    const url = buildMapShare(window.location.href, { ...settings.current, view: serializeView(map, metadata) }, selection, mapPlus ? '/mapplus/' : '/map/')
    setShare({ url, selection, title: selection ? `分享${activeMarker?.title || '此区域'}` : '分享当前视野' })
  }

  return (
    <main id="map-app" className="tiled-map" data-atlas-fonts={mapPlus ? 'true' : undefined} data-basemap-style={mapPlus ? basemapStyle : 'default'} data-sheet={activeMarker ? sheetSize : 'closed'}>
      <div ref={container} className="tiled-map__canvas" style={{ position: 'absolute', inset: 0 }} aria-label="世界地图，可拖动和缩放" />
      {mapPlus && <MapStudyRoutes viewer={routeViewer} visible={layers.routes!==false} />}
      {mapPlus && <MapShips viewer={routeViewer} />}
      {mapPlus && <MapCottonTexture viewer={routeViewer} />}
      {mapPlus && <MapOceanRelief viewer={routeViewer} enabled={basemapStyle==='default'} />}
      <nav className="map-page-actions" aria-label="页面控制">
        <button className="page-action" type="button" onClick={toggleMusic} aria-pressed={!enabled} aria-label={enabled ? '静音' : '开启声音'} title={enabled ? '静音' : '开启声音'} dangerouslySetInnerHTML={{ __html: soundIcon(!enabled) }} />
        <BackButton className="page-action" aria-label="关闭并返回百科" title="关闭并返回百科"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></BackButton>
      </nav>
      <header className="tiled-map__header">
        <MapSearch points={markerRows} regions={regionRows} pointsOnly={mapPlus} query={query} setQuery={setQuery} type={type} onType={changeType} open={searchOpen} onOpen={setSearchOpen} inputRef={searchInput} onSelect={({ kind, row }) => {
          if (kind === 'region') viewer.current?.territories?.select(row.region_id)
          else viewer.current?.points?.select(row.id)
        }} />
        <h1 className="sr-only">{title}</h1>
      </header>
      {failed && status && <div className="tiled-map__status" role="status"><span>{status}</span><button onClick={retry}>重试</button></div>}
      {markerError && <div className="map-marker-error" role="status">{markerError} <button onClick={retry}>重试</button></div>}
      {notice && <div className="map-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="关闭地图提示">知道了</button></div>}
      {share && <MapShare value={share} onClose={() => setShare(null)} />}
      {activeMarker && <Suspense fallback={null}><MapDetail row={activeMarker} localCopy={mapPlus} closing={closing} size={sheetSize} onSize={setSheetSize} onClose={closeMarker} onShare={() => shareView(true)} onTerritoryView={all => {
        setSheetSize('half'); viewer.current?.territories?.focus(activeMarker.sourceRegionId, { all })
      }} /></Suspense>}
      <MapControls mapPlus={mapPlus} basemapStyle={basemapStyle} onBasemapStyle={setBasemapStyle} layers={layers} onLayer={key => setLayers(value => ({ ...value, [key]: !value[key], ...(key === 'rivers' ? { lakes: !value.rivers } : {}) }))} labelMode={labelMode} onLabelMode={setLabelMode} onShare={() => shareView()} legend={legend} pointTypes={[...new Set(markerRows.map(row => row.type))]} onFull={fullView} onCenter={centerMap} onReset={resetView} onBack={previousView} canGoBack={canGoBack} zoomLimits={zoomLimits} onZoom={direction => {
        const map = viewer.current?.map
        if (!map) return
        map.stop()
        map.setZoom(map.getZoom() + direction * .5, { animate: !matchMedia('(prefers-reduced-motion: reduce)').matches })
      }} />
    </main>
  )
}
