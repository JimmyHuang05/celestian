import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qunhjfulchaurfxtjoeg.supabase.co'
const supabaseKey = 'sb_publishable_Nkbcb5N92HUqJAGB9TYnJQ_W_09BC-T'
let supabaseClient = null
try { supabaseClient = createClient(supabaseUrl, supabaseKey) } catch (e) { console.error('Supabase init error', e) }

const MAP_TRUE_WIDTH = 10800
const MAP_TRUE_HEIGHT = 5200
const IMAGE_BOUNDS = [[0, 0], [MAP_TRUE_HEIGHT, MAP_TRUE_WIDTH]]
const MAX_BOUNDS = [[0, 0], [MAP_TRUE_HEIGHT, MAP_TRUE_WIDTH]]
const MAP_IMAGE_PATH = '/data/map/basemap.webp'

const filterOptions = ['首都', '主要城市', '城市/城镇', '要塞', '基地', '港口', '遗迹', '据点', '观测站', '异常', '资源', '其他']

function getGeoSvg(type, color, size = 32) {
  let svgContent = ''
  switch(type) {
    case '首都': svgContent = `<circle cx="16" cy="16" r="12" fill="none" stroke="${color}" stroke-width="3"/><circle cx="16" cy="16" r="4.5" fill="${color}"/>`; break
    case '主要城市': svgContent = `<circle cx="16" cy="16" r="8" fill="none" stroke="${color}" stroke-width="2.5"/><circle cx="16" cy="16" r="3" fill="${color}"/>`; break
    case '要塞': svgContent = `<polygon points="27,16 21.5,25.5 10.5,25.5 5,16 10.5,6.5 21.5,6.5" fill="none" stroke="${color}" stroke-width="2.5"/><circle cx="16" cy="16" r="3" fill="${color}"/>`; break
    case '据点': case '基地': svgContent = `<circle cx="16" cy="16" r="3" fill="none" stroke="${color}" stroke-width="2"/>`; break
    case '异常': svgContent = `<polygon points="16,2.6 29.4,16 16,29.4 2.6,16" fill="none" stroke="${color}" stroke-width="2.5"/><circle cx="16" cy="16" r="3" fill="${color}"/>`; break
    default: svgContent = `<circle cx="16" cy="16" r="4.5" fill="${color}"/>`; break
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:auto;">${svgContent}</svg>`
}

function MapPage() {
  const navigate = useNavigate()
  const mapContainerRef = useRef(null)
  const adminMapRef = useRef(null)
  const mapMarkersLayerRef = useRef(null)
  const markerLeafletRefs = useRef({})
  const allMarkersRef = useRef([])
  const regionSettingsDBRef = useRef({})
  const domIdToDbIdRef = useRef({})
  const lockedTooltipRegionRef = useRef(null)
  const activeMarkerIdRef = useRef(null)
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)

  const [isMapReady, setIsMapReady] = useState(false)
  const [loadingPercent, setLoadingPercent] = useState(0)
  const [loadingStatus, setLoadingStatus] = useState('正在向A.R.K.请求访问许可...')
  const [loadingDetail, setLoadingDetail] = useState('DECRYPTING_BLOCK: 0x000000')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeDetail, setActiveDetail] = useState(null)

  const searchDebounceRef = useRef(null)

  const activeThemeColor = activeDetail?.color || '#d4b58e'
  const activeStatusColor = activeDetail?.status_color || activeThemeColor

  const filteredSearchList = (searchQuery || filterType)
    ? allMarkersRef.current.filter(m => {
        const q = searchQuery.toLowerCase()
        const searchMatch = (m.title && m.title.toLowerCase().includes(q)) || (m.foreign_title && m.foreign_title.toLowerCase().includes(q)) || (m.type && m.type.toLowerCase().includes(q))
        const typeMatch = filterType === '' || m.type === filterType
        return searchMatch && typeMatch
      }).slice(0, 8)
    : []

  const refreshIcons = useCallback(() => {
    if (window.lucide) window.lucide.createIcons()
  }, [])

  useEffect(() => {
    if (window.lucide) requestAnimationFrame(() => window.lucide.createIcons())
  })
  const clearActiveStates = useCallback(() => {
    const amID = activeMarkerIdRef.current
    if (amID && markerLeafletRefs.current[amID]) {
      const el = markerLeafletRefs.current[amID].getElement()
      if (el) el.classList.remove('geo-pin-map-active')
    }
    activeMarkerIdRef.current = null

    if (lockedTooltipRegionRef.current) {
      const regionsSvg = document.getElementById('map-regions-svg-layer')
      if (regionsSvg) {
        const paths = regionsSvg.querySelectorAll('path, polygon')
        paths.forEach(sib => {
          const domId = sib.id
          const sibDbRid = domIdToDbIdRef.current[domId]
          const sibConfig = sibDbRid ? regionSettingsDBRef.current[sibDbRid] : null
          const isSpecialStatus = sibConfig && ['污染', '沦陷', '深渊'].includes(sibConfig.status)
          if (isSpecialStatus && (sibConfig.status_color || sibConfig.color)) {
            const c = sibConfig.status_color || sibConfig.color
            sib.style.fill = c + '20'
            sib.style.stroke = c + '60'
          } else {
            sib.style.fill = 'transparent'
            sib.style.stroke = 'transparent'
          }
          sib.style.strokeWidth = '6'
        })
      }
      lockedTooltipRegionRef.current = null
    }
  }, [])

  const closePanel = useCallback(() => {
    setActiveDetail(null)
    clearActiveStates()
  }, [clearActiveStates])

  const flyToWithOffset = useCallback((latlng, zoomTarget = null) => {
    if (!adminMapRef.current) return
    const minZ = adminMapRef.current.getBoundsZoom(MAX_BOUNDS, true)
    let currentZoom = zoomTarget !== null ? zoomTarget : adminMapRef.current.getZoom()
    currentZoom = Math.max(currentZoom, minZ)
    let targetPoint = adminMapRef.current.project(latlng, currentZoom)
    if (window.innerWidth >= 640) targetPoint = targetPoint.subtract([200, 0])
    else targetPoint = targetPoint.subtract([0, window.innerHeight * 0.22])
    const offsetLatLng = adminMapRef.current.unproject(targetPoint, currentZoom)
    adminMapRef.current.setView(offsetLatLng, currentZoom, { animate: true, duration: 0.6 })
  }, [])

  const triggerSearchClick = useCallback((markerData) => {
    setShowDropdown(false)
    clearActiveStates()

    activeMarkerIdRef.current = markerData.id
    const leafMarker = markerLeafletRefs.current[markerData.id]
    if (leafMarker && leafMarker.getElement()) {
      leafMarker.getElement().classList.add('geo-pin-map-active')
    }
    setActiveDetail({ ...markerData, isRegion: false })
    refreshIcons()

    const latlng = window.L.latLng(markerData.lat, markerData.lng)
    flyToWithOffset(latlng, adminMapRef.current.getZoom() > -2 ? null : -1.5)
  }, [clearActiveStates, flyToWithOffset, refreshIcons])

  const applyFilterVisibility = useCallback((currentFilter) => {
    allMarkersRef.current.forEach(marker => {
      const m = markerLeafletRefs.current[marker.id]
      if (m && m.getElement()) {
        if (currentFilter === '' || marker.type === currentFilter) {
          m.getElement().style.display = 'flex'
        } else {
          m.getElement().style.display = 'none'
        }
      }
    })
  }, [])

  const renderAllMarkersToLeaflet = useCallback(() => {
    if (!mapMarkersLayerRef.current) return
    mapMarkersLayerRef.current.clearLayers()
    markerLeafletRefs.current = {}

    allMarkersRef.current.forEach(marker => {
      const iconColor = marker.color || '#d4b58e'
      const markerType = marker.type || '城市'
      const mapSvg = getGeoSvg(markerType, iconColor, 28)

      const mIcon = window.L.divIcon({
        className: 'geo-pin-map',
        html: `<div>${mapSvg}</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14]
      })

      const m = window.L.marker([marker.lat, marker.lng], { icon: mIcon }).addTo(mapMarkersLayerRef.current)
      markerLeafletRefs.current[marker.id] = m

      m.on('click', (e) => {
        window.L.DomEvent.stopPropagation(e)
        setShowDropdown(false)
        clearActiveStates()

        activeMarkerIdRef.current = marker.id
        m.getElement().classList.add('geo-pin-map-active')

        setActiveDetail({ ...marker, isRegion: false })
        refreshIcons()

        flyToWithOffset(e.latlng, adminMapRef.current.getZoom() > -2 ? null : -1.5)
      })
    })

    applyFilterVisibility(filterType)
  }, [clearActiveStates, flyToWithOffset, refreshIcons, applyFilterVisibility, filterType])

  const fetchMapData = useCallback(async () => {
    try {
      const [markersRes, regionsRes] = await Promise.all([
        supabaseClient.from('map_markers').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('map_regions').select('*')
      ])

      if (regionsRes.data) {
        const db = {}, map = {}
        regionsRes.data.forEach(r => {
          if (r.region_id) { db[r.region_id] = r; map[r.region_id.trim()] = r.region_id }
        })
        regionSettingsDBRef.current = db
        domIdToDbIdRef.current = map
      }

      if (markersRes.data) {
        allMarkersRef.current = markersRes.data
        renderAllMarkersToLeaflet()
      }
    } catch (e) {
      console.error('Data loading error', e)
    }
  }, [renderAllMarkersToLeaflet])

  const loadRegionsSVG = useCallback(() => {
    fetch('/data/map/regions.svg')
      .then(res => { if (!res.ok) throw new Error('SVG load failed'); return res.text() })
      .then(svgText => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(svgText, 'image/svg+xml')
        const svgEl = doc.querySelector('svg')
        if (!svgEl) return

        svgEl.id = 'map-regions-svg-layer'
        svgEl.setAttribute('viewBox', '0 0 10800 5200')
        svgEl.removeAttribute('width')
        svgEl.removeAttribute('height')

        adminMapRef.current.createPane('regionsPane')
        adminMapRef.current.getPane('regionsPane').style.zIndex = 450
        svgEl.style.pointerEvents = 'auto'

        const paths = svgEl.querySelectorAll('path, polygon')

        paths.forEach((p, idx) => {
          const domId = p.id || p.getAttribute('name') || `region_${idx}`
          p.id = domId
          const dbRid = domIdToDbIdRef.current[domId]
          const config = dbRid ? regionSettingsDBRef.current[dbRid] : null

          if (!config) {
            p.style.pointerEvents = 'none'
            p.style.fill = 'transparent'
            p.style.stroke = 'transparent'
            return
          }

          p.style.cursor = 'pointer'
          p.style.transition = 'fill 0.4s ease, stroke 0.4s ease'

          const activeColor = config.status_color || config.color || '#d4b58e'
          const isSpecialStatus = ['污染', '沦陷', '深渊'].includes(config.status)

          if (isSpecialStatus) {
            p.style.fill = activeColor + '20'
            p.style.stroke = activeColor + '60'
          } else {
            p.style.fill = 'transparent'
            p.style.stroke = 'transparent'
          }
          p.style.strokeWidth = '6'
        })

        svgEl.addEventListener('click', (e) => {
          const p = e.target.closest('path, polygon')
          if (!p) return

          window.L.DomEvent.stopPropagation(e)
          setShowDropdown(false)
          clearActiveStates()

          const domId = p.id
          const dbRid = domIdToDbIdRef.current[domId]
          const config = dbRid ? regionSettingsDBRef.current[dbRid] : null
          if (!config) return

          const currentId = dbRid || domId
          lockedTooltipRegionRef.current = currentId

          const groupId = config.group_id
          const subGroupId = config.sub_group_id

          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
          const clonedPaths = []

          paths.forEach(sib => {
            const sibDbRid = domIdToDbIdRef.current[sib.id]
            const sibConfig = sibDbRid ? regionSettingsDBRef.current[sibDbRid] : null
            const isSameGroup = groupId && sibConfig && sibConfig.group_id === groupId
            const isSameSubGroup = subGroupId && sibConfig && sibConfig.sub_group_id === subGroupId
            const isSameRegion = sibDbRid === currentId

            if (isSameGroup || isSameSubGroup || isSameRegion) {
              const sibColor = (sibConfig && (sibConfig.status_color || sibConfig.color)) || '#d4b58e'
              sib.style.fill = sibColor + '50'
              sib.style.stroke = sibColor + 'B0'

              try {
                const box = sib.getBBox()
                if (box.width > 0 && box.height > 0) {
                  minX = Math.min(minX, box.x)
                  minY = Math.min(minY, box.y)
                  maxX = Math.max(maxX, box.x + box.width)
                  maxY = Math.max(maxY, box.y + box.height)
                  const clone = sib.cloneNode(true)
                  clone.style.fill = sibColor + '40'
                  clone.style.stroke = sibColor + 'A0'
                  clone.style.strokeWidth = Math.max((maxX - minX), (maxY - minY)) * 0.015 + 'px'
                  clone.style.pointerEvents = 'none'
                  clonedPaths.push(clone.outerHTML)
                }
              } catch (err) {}
            }
          })

          let displayConfig = config
          if (config.follow_primary) {
            for (const key in regionSettingsDBRef.current) {
              if ((config.sub_group_id && regionSettingsDBRef.current[key].sub_group_id === config.sub_group_id && regionSettingsDBRef.current[key].is_sub_primary) ||
                  (!config.sub_group_id && config.group_id && regionSettingsDBRef.current[key].group_id === config.group_id && regionSettingsDBRef.current[key].is_primary)) {
                displayConfig = regionSettingsDBRef.current[key]
                break
              }
            }
          }

          let previewHtml = null
          if (clonedPaths.length > 0 && minX !== Infinity) {
            const pad = Math.max((maxX - minX) * 0.1, (maxY - minY) * 0.1, 10)
            const vBox = `${minX - pad} ${minY - pad} ${maxX - minX + 2*pad} ${maxY - minY + 2*pad}`
            previewHtml = `<svg viewBox="${vBox}" class="w-full h-auto max-h-32 drop-shadow-lg" preserveAspectRatio="xMidYMid meet">${clonedPaths.join('')}</svg>`
          }

          setActiveDetail({ ...displayConfig, isRegion: true, svgPreview: previewHtml })
          refreshIcons()

          const mapLatLng = adminMapRef.current.mouseEventToLatLng(e)
          flyToWithOffset(mapLatLng)
        })

        if (!isTouchDevice) {
          svgEl.addEventListener('mouseover', (e) => {
            const p = e.target.closest('path, polygon')
            if (p && p.style.pointerEvents !== 'none' && !lockedTooltipRegionRef.current) {
              p.style.strokeWidth = '12'
            }
          })
          svgEl.addEventListener('mouseout', (e) => {
            const p = e.target.closest('path, polygon')
            if (p && p.style.pointerEvents !== 'none' && !lockedTooltipRegionRef.current) {
              p.style.strokeWidth = '6'
            }
          })
        }

        window.L.svgOverlay(svgEl, IMAGE_BOUNDS, { interactive: true, pane: 'regionsPane' }).addTo(adminMapRef.current)
      })
  }, [clearActiveStates, flyToWithOffset, refreshIcons, isTouchDevice])

  const startImageLoading = useCallback(() => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', MAP_IMAGE_PATH, true)
    xhr.responseType = 'blob'

    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.floor((e.loaded / e.total) * 100)
        setLoadingPercent(percent)
        setLoadingDetail(`DECRYPTING_BLOCK: 0x${Math.floor(e.loaded).toString(16).toUpperCase()}`)
        if (percent > 95) setLoadingStatus('许可已批复，视界现已开放')
      }
    }

    xhr.onload = function() {
      if (this.status === 200) {
        const blobUrl = URL.createObjectURL(this.response)
        window.L.imageOverlay(blobUrl, IMAGE_BOUNDS).addTo(adminMapRef.current)

        const svgWidth = MAP_TRUE_WIDTH + 1500
        const topSvgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} 600"><defs><linearGradient id="gradLeft" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#d4b58e" stop-opacity="0" /><stop offset="100%" stop-color="#d4b58e" stop-opacity="0.4" /></linearGradient><linearGradient id="gradRight" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#d4b58e" stop-opacity="0.4" /><stop offset="100%" stop-color="#d4b58e" stop-opacity="0" /></linearGradient></defs><g transform="translate(${svgWidth / 2}, 300)"><line x1="-8000" y1="0" x2="-1600" y2="0" stroke="url(#gradLeft)" stroke-width="6"/><text x="0" y="32" font-family="'Noto Serif SC', serif" font-size="90" font-weight="bold" fill="#d4b58e" opacity="0.4" text-anchor="middle" letter-spacing="15">O R B I S ◆ T E R R A R U M ◆ T A B U L A</text><line x1="1600" y1="0" x2="8000" y2="0" stroke="url(#gradRight)" stroke-width="6"/></g></svg>`
        const div = document.createElement('div')
        div.innerHTML = topSvgStr
        window.L.svgOverlay(div.firstChild, [[MAP_TRUE_HEIGHT, -750], [MAP_TRUE_HEIGHT + 600, MAP_TRUE_WIDTH + 750]], { interactive: false }).addTo(adminMapRef.current)

        const minZNoBorders = adminMapRef.current.getBoundsZoom(MAX_BOUNDS, true)
        adminMapRef.current.setMinZoom(minZNoBorders)
        adminMapRef.current.setMaxBounds(MAX_BOUNDS)
        adminMapRef.current.setView([MAP_TRUE_HEIGHT / 2, MAP_TRUE_WIDTH / 2], minZNoBorders)

        Promise.all([fetchMapData()]).then(() => {
          loadRegionsSVG()
          setTimeout(() => { setIsMapReady(true) }, 800)
        })
      }
    }
    xhr.onerror = () => setLoadingStatus('网络阵列接入失败...')
    xhr.send()
  }, [fetchMapData, loadRegionsSVG])

  useEffect(() => {
    const L = window.L
    if (!L || !mapContainerRef.current) return

    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.Simple, zoomControl: false, attributionControl: false,
      maxBoundsViscosity: 1.0, bounceAtZoomLimits: false,
      minZoom: -5, maxZoom: 0.5, zoomSnap: 0.1, zoomDelta: 0.5,
      wheelPxPerZoomLevel: 100
    })

    map.on('click', () => {
      closePanel()
      setShowDropdown(false)
    })

    adminMapRef.current = map
    mapMarkersLayerRef.current = L.layerGroup().addTo(map)

    startImageLoading()
    refreshIcons()

    const handleDocClick = (e) => {
      if (!e.target.closest('#map-app .relative.ml-2')) setIsFilterMenuOpen(false)
      if (!e.target.closest('#map-app .absolute.top-4.sm\\:top-6')) setShowDropdown(false)
    }
    document.addEventListener('click', handleDocClick)

    const handleResize = () => {
      if (adminMapRef.current) {
        const minZNoBorders = adminMapRef.current.getBoundsZoom(MAX_BOUNDS, true)
        adminMapRef.current.setMinZoom(minZNoBorders)
        if (adminMapRef.current.getZoom() < minZNoBorders) {
          adminMapRef.current.setZoom(minZNoBorders)
        }
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('click', handleDocClick)
      window.removeEventListener('resize', handleResize)
      if (adminMapRef.current) {
        adminMapRef.current.remove()
        adminMapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 300)
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current) }
  }, [searchInput])

  const zoomIn = () => adminMapRef.current?.zoomIn()
  const zoomOut = () => adminMapRef.current?.zoomOut()
  const panToCenter = () => {
    closePanel()
    adminMapRef.current?.setView([MAP_TRUE_HEIGHT / 2, MAP_TRUE_WIDTH / 2], adminMapRef.current.getZoom(), { animate: true, duration: 0.8 })
  }
  const zoomToMaxBounds = () => {
    closePanel()
    const minZ = adminMapRef.current.getBoundsZoom(MAX_BOUNDS, true)
    adminMapRef.current?.setView([MAP_TRUE_HEIGHT / 2, MAP_TRUE_WIDTH / 2], minZ, { animate: true, duration: 0.8 })
  }
  const toggleFilterMenu = () => setIsFilterMenuOpen(prev => !prev)
  const setFilter = (type) => { setFilterType(type); setIsFilterMenuOpen(false) }

  const handleBack = () => navigate('/')

  return (
    <div id="map-app" className="w-full h-full relative" onContextMenu={(e) => e.preventDefault()}>
      <div className="noise-overlay-map" />

      {!isMapReady && (
        <div className="fixed inset-0 z-[3000] bg-[#050505] flex flex-col items-center justify-center p-6 pointer-events-auto">
          <div className="w-full max-w-md">
            <div className="flex justify-between items-end mb-3">
              <div className="flex flex-col">
                <span className="text-[#d4b58e] font-mono text-[10px] tracking-[0.3em] uppercase opacity-60 mb-1">Encryption Enabled</span>
                <h2 className="text-[#dcd6cc] font-serif-sc text-xl font-bold tracking-widest">{loadingStatus}</h2>
              </div>
              <span className="text-[#d4b58e] font-mono text-2xl font-light">{loadingPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#1a1817] border border-stoneBorder/30 rounded-full overflow-hidden relative">
              <div className="h-full bg-[#d4b58e] progress-glow" style={{ width: loadingPercent + '%' }} />
            </div>
            <div className="mt-4 flex justify-between items-center opacity-40 font-mono text-[9px] text-[#d4b58e] tracking-tighter">
              <span>巴别塔全向广播系统</span>
              <span>{loadingDetail}</span>
            </div>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} id="map-container" className="map-container-leaflet absolute inset-0 z-10 w-full h-full transition-opacity duration-1000"
        style={{ opacity: isMapReady ? 1 : 0 }} />

      <div className="absolute inset-0 z-[20] bg-transparent pointer-events-none w-full h-full" />

      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-[1000] w-[calc(100vw-2rem)] sm:w-[400px] flex flex-col gap-2 pointer-events-none">
        <div className="bg-[#141211]/95 backdrop-blur-md rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-gray-800 flex items-center px-4 py-3 pointer-events-auto transition-all focus-within:border-[#d4b58e] focus-within:shadow-[0_0_20px_rgba(212,181,142,0.15)]">
          <button className="mr-3 text-gray-500 hover:text-[#d4b58e] transition-colors" title="菜单" onClick={handleBack}>
            <i data-lucide="menu" className="w-5 h-5" />
          </button>
          <div className="h-5 w-[1px] bg-gray-800 mr-3" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onFocus={() => setShowDropdown(true)}
            className="flex-1 bg-transparent border-none text-sm text-gray-200 focus:outline-none focus:ring-0 font-serif-sc placeholder:text-gray-600"
            placeholder="检索地图点位或区域..." />

          <div className="relative ml-2">
            <button onClick={(e) => { e.stopPropagation(); toggleFilterMenu() }}
              className={`transition-colors outline-none ${filterType ? 'text-[#d4b58e]' : 'text-gray-500 hover:text-[#d4b58e]'}`}>
              <i data-lucide="sliders-horizontal" className="w-4 h-4" />
            </button>
            {isFilterMenuOpen && (
              <div className="absolute right-0 top-[150%] w-32 bg-[#141211]/95 backdrop-blur-sm border border-gray-800 rounded-xl shadow-2xl flex flex-col py-1.5 z-[1001] font-serif-sc">
                <button className="w-full text-left px-4 py-2 text-[13px] text-gray-200 hover:bg-[#d4b58e]/10 hover:text-[#d4b58e] font-bold transition-colors" onClick={(e) => { e.stopPropagation(); setFilter('') }}>全部分类</button>
                <div className="h-[1px] bg-gray-800 mx-3 my-1" />
                {filterOptions.map(type => (
                  <button key={type} className="w-full text-left px-4 py-1.5 text-[13px] text-gray-400 hover:bg-[#d4b58e]/10 hover:text-[#d4b58e] transition-colors"
                    onClick={(e) => { e.stopPropagation(); setFilter(type) }}>{type}</button>
                ))}
              </div>
            )}
          </div>

          <div className="ml-3 h-5 w-[1px] bg-gray-800 hidden sm:block" />
          <button onClick={zoomToMaxBounds} className="ml-3 text-gray-500 hover:text-white transition-colors hidden sm:block" title="全局视图">
            <i data-lucide="globe" className="w-4 h-4" />
          </button>
        </div>

        {showDropdown && (searchQuery || filterType) && (
          <div className="bg-[#141211]/95 backdrop-blur-md rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-gray-800 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pointer-events-auto custom-dropdown-scroll p-2 flex flex-col gap-1">
            {filteredSearchList.length === 0 && (
              <div className="p-3 text-xs text-gray-500 text-center font-serif-sc">未在数据库中检索到匹配坐标...</div>
            )}
            {filteredSearchList.map(marker => (
              <div key={marker.id} onClick={() => triggerSearchClick(marker)}
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-800">
                <div className="w-8 h-8 rounded-full bg-[#1a1817] flex items-center justify-center border border-gray-800 shrink-0 shadow-inner" style={{ color: marker.color || '#d4b58e' }}>
                  <i data-lucide="map-pin" className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[13px] text-gray-200 font-bold font-serif-sc truncate leading-tight">{marker.title}</span>
                  <span className="text-[10px] text-gray-500 font-mono tracking-widest truncate">{marker.type || '未知'} {marker.foreign_title ? '| ' + marker.foreign_title : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeDetail && (
        <div className="absolute z-[990] bg-[#141211]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] pointer-events-auto flex flex-col overflow-hidden
          w-full h-[45vh] bottom-0 left-0 rounded-t-3xl border-t border-gray-800
          sm:w-[400px] sm:h-auto sm:max-h-[calc(100vh-8rem)] sm:bottom-auto sm:top-24 sm:left-6 sm:rounded-2xl sm:border border-gray-800">

          <div className="w-full pt-3 pb-2 flex justify-center sm:hidden cursor-pointer shrink-0 absolute top-0 z-20" onClick={closePanel}>
            <div className="w-12 h-1.5 bg-gray-700/50 rounded-full" />
          </div>

          <div className="pt-8 sm:pt-6 p-6 bg-gradient-to-b from-[#1a1817] to-[#141211] flex justify-between items-start shrink-0 relative overflow-hidden border-b border-gray-800">
            <div className="absolute -right-10 -top-10 opacity-5 scale-[2.5] pointer-events-none" style={{ color: activeThemeColor }}>
              <i data-lucide={activeDetail.isRegion ? 'hexagon' : 'map-pin'} className="w-40 h-40" />
            </div>

            <div className="relative z-10 flex flex-col gap-1.5 w-full pr-8">
              <h2 className="text-2xl font-black font-serif-sc leading-tight tracking-wide drop-shadow-sm" style={{ color: activeThemeColor }}>
                {activeDetail.title || '未知目标'}
              </h2>
              {activeDetail.foreign_title && (
                <p className="text-[11px] font-mono tracking-widest text-[#d4b58e] uppercase opacity-80 leading-none">{activeDetail.foreign_title}</p>
              )}
              <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                <span className="px-2 py-1 bg-[#1a1817] text-gray-300 border border-gray-700 rounded text-xs font-serif-sc tracking-widest shadow-sm">
                  {activeDetail.type || (activeDetail.isRegion ? '管制区域' : '标定点')}
                </span>
                {activeDetail.status && (
                  <span className="px-2 py-1 rounded text-xs font-serif-sc tracking-widest shadow-sm border"
                    style={{ color: activeStatusColor, borderColor: activeStatusColor + '50', backgroundColor: activeStatusColor + '15' }}>
                    {activeDetail.status}
                  </span>
                )}
              </div>
            </div>

            <button onClick={closePanel}
              className="absolute top-6 right-5 text-gray-500 hover:text-white bg-[#0a0908]/80 backdrop-blur p-2 rounded-full border border-gray-700/50 z-20 transition-all hover:scale-110 hover:bg-gray-800 shadow-lg hidden sm:block">
              <i data-lucide="x" className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 font-serif-sc text-[14px] text-gray-300 leading-loose custom-dropdown-scroll bg-[#141211]">
            <p className="whitespace-pre-line text-justify">{activeDetail.description || 'A.R.K.中暂无关于该目标的进一步公开档案'}</p>

            {activeDetail.svgPreview && (
              <div className="mt-6 w-full rounded-xl bg-[#0a0908] border border-gray-800 p-4 flex items-center justify-center relative overflow-hidden"
                dangerouslySetInnerHTML={{ __html: activeDetail.svgPreview }} />
            )}

            <div className="mt-8 pt-4 border-t border-gray-800/50 flex flex-col gap-1">
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-2">TELEMETRY DATA</div>
              <div className="font-mono text-xs text-gray-400 bg-[#0a0908] p-2.5 rounded border border-gray-800 flex items-center gap-2">
                <i data-lucide="satellite" className="w-3.5 h-3.5 text-[#d4b58e]" />
                {!activeDetail.isRegion ? (
                  <span>LAT: {Number(activeDetail.lat).toFixed(2)} // LNG: {Number(activeDetail.lng).toFixed(2)}</span>
                ) : (
                  <span>TERRITORY DATA CLASSIFIED</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 sm:bottom-8 right-4 sm:right-6 z-[1000] flex flex-col gap-3 pointer-events-none items-end">
        <button onClick={panToCenter} className="pointer-events-auto w-10 h-10 bg-[#1a1817]/90 backdrop-blur text-gray-400 hover:text-blue-400 rounded-full shadow-xl border border-gray-700 flex items-center justify-center transition-all hover:scale-110 mb-2">
          <i data-lucide="crosshair" className="w-5 h-5" />
        </button>
        <div className="pointer-events-auto flex flex-col bg-[#1a1817]/90 backdrop-blur rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <button onClick={zoomIn} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border-b border-gray-700/50">
            <i data-lucide="plus" className="w-5 h-5" />
          </button>
          <button onClick={zoomOut} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <i data-lucide="minus" className="w-5 h-5" />
          </button>
        </div>
        <button className="pointer-events-auto w-10 h-10 mt-2 bg-[#1a1817]/90 backdrop-blur text-gray-400 hover:text-[#d4b58e] rounded-xl shadow-xl border border-gray-700 flex items-center justify-center transition-all hover:scale-110">
          <i data-lucide="layers" className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default MapPage
