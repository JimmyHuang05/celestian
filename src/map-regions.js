import { pollutionStyle, statusLabel, countryLegend, focusRegionIDs, SPECIAL_STATUSES, territoryPreviewRows } from './map-ui/region-presentation.js'
import { softenCoast } from './map-coast-display.js'
import { countryFlagHover } from './map-country-flags.js'
import { stableSvgOverlay } from './map-stable-svg.js'

const special = new Set(SPECIAL_STATUSES)
const color = value => /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#d4b58e'

export function resolveRegion(config, records) {
  if (!config.follow_primary) return config
  return records.find(row => row.group_id === config.group_id && (config.sub_group_id
    ? row.sub_group_id === config.sub_group_id && row.is_sub_primary
    : row.is_primary)) || config
}

export function regionDetails(config, records) {
  const primary = resolveRegion(config, records)
  if (primary === config || !special.has(config.status) || (config.status === primary.status && config.pollution_level === primary.pollution_level)) return primary
  return { ...primary, status: config.status, status_color: config.status_color, pollution_level: config.pollution_level,
    description: config.description || primary.description }
}

export function relatedRegions(config, records) {
  return records.filter(row => row.region_id === config.region_id || (config.group_id && row.group_id === config.group_id) ||
    (config.sub_group_id && row.group_id === config.group_id && row.sub_group_id === config.sub_group_id))
}

export function focusMap(map, latlng, zoom = map.getZoom()) {
  const point = map.project(latlng, zoom)
  const size = map.getSize()
  const sheet = Math.min(size.y * .46, 420, Math.max(120, size.y - 180))
  const offset = size.x > 640 ? [204, 0] : [0, 24 - sheet / 2]
  moveMap(map, map.unproject(point.subtract(offset), zoom), zoom)
}

export function fitRegionBounds(map, bounds) {
  const size = map.getSize(), mobile = size.x <= 640
  const sheet = Math.min(size.y * .46, 420, Math.max(120, size.y - 180))
  const topLeft = [mobile ? 24 : 408, mobile ? 132 : 142]
  const bottomRight = [mobile ? 24 : 80, mobile ? sheet + 76 : 56]
  // Compute before applying minZoom: an explicit whole-territory view may need
  // to go below the normal overview limit to leave room for the dossier.
  const worldA = map.project(bounds.getNorthWest(), 0), worldB = map.project(bounds.getSouthEast(), 0)
  const available = size.subtract(topLeft).subtract(bottomRight)
  const zoom = Math.max(map.getMinZoom(), Math.min(5, Math.log2(Math.min(
    Math.max(1, available.x) / Math.max(.001, worldB.x - worldA.x),
    Math.max(1, available.y) / Math.max(.001, worldB.y - worldA.y),
  ))))
  const a = map.project(bounds.getNorthWest(), zoom), b = map.project(bounds.getSouthEast(), zoom)
  const center = a.add(b).divideBy(2).add([(bottomRight[0] - topLeft[0]) / 2, (bottomRight[1] - topLeft[1]) / 2])
  moveMap(map, map.unproject(center, zoom), zoom)
}

export function moveMap(map, position, zoom = map.getZoom(), { animate = true } = {}) {
  map.stop()
  zoom = Math.max(map.getMinZoom(), zoom)
  if (map.options.worldBounds) map.options.maxBounds = map.options.worldBounds
  // Clamp before animating, so maxBounds cannot trigger a second corrective pan.
  const bounds = map.options.maxBounds
  if (bounds) {
    const point = map.project(position, zoom), size = map.getSize()
    const min = map.project(bounds.getNorthWest(), zoom), max = map.project(bounds.getSouthEast(), zoom)
    const clamp = (value, start, end, viewport) => end - start <= viewport
      ? (start + end) / 2 : Math.max(start + viewport / 2, Math.min(end - viewport / 2, value))
    point.x = clamp(point.x, min.x, max.x, size.x)
    point.y = clamp(point.y, min.y, max.y, size.y)
    position = map.unproject(point, zoom)
  }
  if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) map.setView(position, zoom, { animate: false })
  else if (zoom === map.getZoom()) map.panTo(position, { animate: true, duration: .32 })
  else map.setView(position, zoom, { animate: true })
}

// Draft outlines use clockwise land rings and counterclockwise holes.
function simplifyInsetPath(path, span, removeSpecks) {
  return path.replace(/M[^Z]+Z/g, ring => {
    const points = ring.slice(1, -1).split('L').map(point => point.split(' ').map(Number))
    let area = 0, left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity
    for (const [i, [x, y]] of points.entries()) {
      const [nextX, nextY] = points[(i + 1) % points.length]
      area += x * nextY - nextX * y
      left = Math.min(left, x); right = Math.max(right, x)
      top = Math.min(top, y); bottom = Math.max(bottom, y)
    }
    const width = right - left, height = bottom - top
    const smallHole = area < 0 && Math.min(width, height) < span * .015 && Math.max(width, height) < span * .05
    const speck = removeSpecks && area > 0 && Math.max(width, height) < span * .015
    return smallHole || speck ? '' : ring
  })
}

export function attachRegions(L, map, svg, records, bounds, select, options = {}) {
  const data = new Map(records.map(row => [row.region_id.trim(), row]))
  const allPaths = [...svg.querySelectorAll('[data-region-id]')]
  let settings = { countries: false, statuses: true, ...options.settings }
  const selected = new Set()
  let hovered = null
  const pane = map.getPane('territoriesPane') || map.createPane('territoriesPane')
  pane.style.zIndex = '450'
  svg.style.pointerEvents = 'none'; svg.removeAttribute('aria-hidden')
  svg.classList.add('map-territories')
  if (options.political) svg.classList.add('map-territories--political')
  const overlayOptions = { interactive: true, pane: 'territoriesPane' }
  const layer = (options.political ? stableSvgOverlay(L, svg, bounds, overlayOptions) : L.svgOverlay(svg, bounds, overlayOptions)).addTo(map)
  // MapPlus already clips the entire layer to its own coast below. Avoid
  // rasterizing the old, blurred full-map mask inside that clip on every pan.
  const removeCoastDisplay = options.coastline || options.political ? () => {} : softenCoast(svg, map)
  // Keep interaction outlines outside the feathered coastline mask.
  const outlineLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  outlineLayer.style.pointerEvents = 'none'
  outlineLayer.setAttribute('aria-hidden', 'true')
  svg.append(outlineLayer)
  if (options.coastline) {
    const ns = svg.namespaceURI, box = svg.viewBox.baseVal
    const source = new DOMParser().parseFromString(options.coastline, 'image/svg+xml').querySelector('#river-land')
    if (source) {
      const clip = document.createElementNS(ns, 'clipPath'), group = document.createElementNS(ns, 'g')
      clip.id = 'mapplus-legacy-coast-clip'
      for (const offset of [-2048, 0, 2048]) for (const path of source.children) {
        const shape = document.importNode(path, true)
        shape.setAttribute('transform', `scale(${box.width/2048} ${box.height/1024}) translate(${offset-options.centralMeridian/360*2048} 0)`)
        clip.append(shape)
      }
      const defs = svg.querySelector('defs')
      defs.append(clip)
      for (const child of [...svg.children]) if (child !== defs) group.append(child)
      group.setAttribute('clip-path', `url(#${clip.id})`)
      svg.append(group)
      svg.setAttribute('preserveAspectRatio', 'none')
    }
  }
  const normalOutlines = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  const pollutionOutlines = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  outlineLayer.append(normalOutlines, pollutionOutlines)
  const outlines = new Map()
  function updateOutline(path, visible, polluted) {
    let outline = outlines.get(path)
    if (!visible) { outline?.remove(); outlines.delete(path); return }
    if (!outline) {
      outline = path.cloneNode(false)
      for (const attr of [...outline.attributes]) {
        if (!['d', 'points', 'transform'].includes(attr.name)) outline.removeAttribute(attr.name)
      }
      const transforms = []
      for (let parent = path.parentElement; parent && parent !== svg; parent = parent.parentElement) {
        if (parent.hasAttribute('transform')) transforms.unshift(parent.getAttribute('transform'))
      }
      if (path.hasAttribute('transform')) transforms.push(path.getAttribute('transform'))
      outline.setAttribute('transform', transforms.join(' '))
      outlines.set(path, outline)
    }
    const parent = polluted ? pollutionOutlines : normalOutlines
    if (outline.parentNode !== parent) parent.append(outline)
    outline.style.cssText = path.style.cssText
    outline.style.fill = 'none'
    outline.style.pointerEvents = 'none'
    outline.style.vectorEffect = 'none'
    outline.style.strokeLinejoin = 'miter'
    outline.style.strokeLinecap = 'butt'
    outline.style.strokeMiterlimit = '4'
  }
  // Measure after mounting; erased painter regions can retain an M0,0Z placeholder.
  // Keep their source data, but exclude empty geometry from every interactive extent.
  const boxes = new Map(allPaths.map(path => {
    const b = path.getBBox()
    return [path.dataset.regionId, { x: b.x, y: b.y, width: b.width, height: b.height }]
  }).filter(([, b]) => Object.values(b).every(Number.isFinite) && b.width > 0 && b.height > 0))
  const paths = allPaths.filter(path => boxes.has(path.dataset.regionId))
  for (const path of allPaths) {
    if (boxes.has(path.dataset.regionId)) continue
    path.style.pointerEvents = 'none'
    path.removeAttribute('tabindex'); path.removeAttribute('role')
  }
  const byID = new Map(paths.map(path => [path.dataset.regionId, path]))
  const configured = records.filter(row => byID.has(row.region_id))
  const legend = options.political ? configured.map(row => ({ name: row.group_id, color: '#8c7049' })) : countryLegend(configured)
  const colors = new Map(legend.map(item => [item.name, item.color]))
  const flags = options.political ? countryFlagHover(svg, outlineLayer) : null
  function paint(path) {
    const id = path.dataset.regionId, row = data.get(id)
    const specialVisible = settings.statuses && special.has(row?.status)
    const active = selected.has(id), over = hovered === path
    if (options.political) {
      const visible = active || over
      path.style.mask = visible ? 'var(--map-pollution-border-mask, none)' : ''
      const disputes = svg.querySelector('[data-political-disputes]')
      if (disputes) disputes.style.display = 'none'
      const liveBorder = svg.querySelector('[data-live-border]')
      if (liveBorder) liveBorder.style.display = 'none'
      const brush = svg.querySelector('[data-brush-overlay]')
      if (brush) brush.style.display = visible ? '' : 'none'
      const ink = '#8c7049'
      const flagVisible = flags.show(path, row, visible)
      path.style.fill = flagVisible || !visible ? 'transparent' : active ? '#9c805873' : ink + '30'
      path.style.stroke = visible ? ink + 'B0' : 'transparent'
      path.style.strokeWidth = '1.05'
      path.style.strokeLinejoin = 'round'
      path.style.strokeDasharray = row?.provisional ? '2 1.4' : ''
      path.style.pointerEvents = row ? 'all' : 'none'
      if (row) path.setAttribute('tabindex', '0')
      else path.removeAttribute('tabindex')
      if (active) path.dataset.selected = 'true'
      else path.removeAttribute('data-selected')
      return
    }
    const pollution = row?.status === '污染' ? pollutionStyle(row) : null
    const c = specialVisible ? (pollution?.color || color(row.status_color)) : active || over ? '#8c7049' : colors.get(row?.group_id) || '#8c7049'
    // Stronger selected tint, retaining the basemap detail beneath it.
    path.style.fill = active ? (specialVisible ? c : '#9c8058') + (specialVisible && pollution ? pollution.selected : '73') : specialVisible ? c + (pollution?.fill || '30') : 'transparent'
    path.style.stroke = active || over ? c + 'B0' : specialVisible ? c + '60' : settings.countries && !options.hideCountryBorders && row ? c + '70' : 'transparent'
    // Map-space widths scale with the SVG, including during zoom animations.
    path.style.strokeWidth = active || over ? '12' : '6'
    path.style.strokeDasharray = ''
    const polluted = specialVisible && row.status === '污染'
    updateOutline(path, active || over || polluted, polluted)
    // Draw each translucent edge once; the crisp overlay owns visible outlines.
    if (active || over || polluted) path.style.stroke = 'transparent'
    if (active) path.dataset.selected = 'true'
    else path.removeAttribute('data-selected')
  }
  function endHover() {
    const previous = hovered; hovered = null
    if (previous) paint(previous)
  }
  function clear() { endHover(); selected.clear(); paths.forEach(paint) }
  for (const path of paths) {
    const row = data.get(path.dataset.regionId)
    paint(path)
    path.style.pointerEvents = row ? 'all' : 'none'
    if (!row) continue
    const display = regionDetails(row, records)
    path.style.cursor = 'pointer'; path.setAttribute('tabindex', '0'); path.setAttribute('role', 'button')
    path.setAttribute('aria-label', display.title || row.sub_group_id || row.group_id || row.region_id)
    if (options.political) paint(path)
  }
  function groupPaths(row) {
    const related = row.mergedEmpire ? [row] : relatedRegions(row, configured)
    return related.map(r => byID.get(r.region_id)).filter(Boolean)
  }
  function focusedPaths(row) {
    if (row.mergedEmpire) return groupPaths(row)
    const primary = resolveRegion(row, records)
    const local = special.has(row.status) && row.status !== primary.status
    const ids = focusRegionIDs(local ? { ...row, is_primary: false, is_sub_primary: false } : primary, configured, boxes)
    const result = ids.map(id => byID.get(id)).filter(Boolean)
    return result.length ? result : [byID.get(row.region_id)]
  }
  function extent(targets) {
    const result = L.latLngBounds([])
    for (const path of targets) {
      const box = boxes.get(path.dataset.regionId)
      const sx = bounds.getEast() / svg.viewBox.baseVal.width, sy = -bounds.getSouth() / svg.viewBox.baseVal.height
      result.extend([-(box.y + box.height) * sy, box.x * sx])
      result.extend([-box.y * sy, (box.x + box.width) * sx])
    }
    return result
  }
  function focus(id, { all = false, remember = true } = {}) {
    const row = data.get(id)
    if (!row || !byID.has(id)) return
    if (remember) options.beforeNavigate?.()
    fitRegionBounds(map, extent(all ? groupPaths(row) : focusedPaths(row)))
  }
  function previewFor(targets) {
    const preview = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
    for (const path of targets) {
      const box = boxes.get(path.dataset.regionId)
      left = Math.min(left, box.x); top = Math.min(top, box.y)
      right = Math.max(right, box.x + box.width); bottom = Math.max(bottom, box.y + box.height)
      // The inset needs the complete geometry. Main-map masks and styles
      // would hide the affected part of the country here as well.
      const clone = document.createElementNS(preview.namespaceURI, 'path')
      for (const attr of ['d', 'fill-rule', 'transform']) {
        if (path.hasAttribute(attr)) clone.setAttribute(attr, path.getAttribute(attr))
      }
      if (options.political) clone.dataset.regionId = path.dataset.regionId
      const config = options.political ? null : data.get(path.dataset.regionId)
      if (options.simplifyInset && clone.hasAttribute('d')) {
        clone.setAttribute('d', simplifyInsetPath(clone.getAttribute('d'), Math.max(box.width, box.height), config?.mergedEmpire))
      }
      clone.style.pointerEvents = 'none'
      // The inset uses restrained printed-ink colors, independent of map highlights.
      const ink = config?.status === '深渊' ? '#92809b' : config?.status === '污染' ? pollutionStyle(config).ink : '#bca274'
      clone.style.fill = ink + '70'
      clone.style.stroke = ink
      clone.style.strokeWidth = '.85'
      clone.style.vectorEffect = 'non-scaling-stroke'
      clone.style.strokeDasharray = config?.status === '污染' ? '3 2' : config?.status === '深渊' ? '1 2' : ''
      preview.append(clone)
    }
    if (Number.isFinite(left)) {
      const pad = Math.max(right - left, bottom - top) * .08 + 4
      preview.setAttribute('viewBox', [left - pad, top - pad, right - left + pad * 2, bottom - top + pad * 2].join(' '))
    }
    return preview.outerHTML
  }
  function activate(path, latlng, { navigate = true } = {}) {
    if (!path || !byID.has(path.dataset.regionId)) return
    const row = data.get(path.dataset.regionId)
    if (!row) return
    if (navigate) options.beforeNavigate?.()
    clear()
    const related = groupPaths(row), focused = focusedPaths(row), primary = resolveRegion(row, records)
    for (const sibling of related) selected.add(sibling.dataset.regionId)
    paths.forEach(paint)
    const national = primary.is_primary || (primary.is_sub_primary && primary.sub_group_id === '本土')
    // Assigned political regions already contain the country's complete current
    // geometry; legacy homeland/colony filters would discard that unified row.
    const previewPaths = options.political ? related : territoryPreviewRows(row, related.map(p => data.get(p.dataset.regionId))).map(r => byID.get(r.region_id))
    select({ ...regionDetails(row, records), isRegion: true, sourceRegionId: row.region_id,
      preview: previewFor(previewPaths), focusLabel: row.mergedEmpire ? '帝国版图' : national ? '主要领土' : '此区域',
      previewStatuses: options.political ? [] : [...new Set(previewPaths.map(p => data.get(p.dataset.regionId)).filter(r => special.has(r?.status)).map(statusLabel))],
      hasWholeTerritory: related.length > focused.length })
    if (navigate) {
      if (latlng && !row.mergedEmpire) focusMap(map, latlng)
      else focus(row.region_id, { remember: false })
    }
  }
  svg.addEventListener('click', event => {
    const path = event.target.closest('[data-region-id]')
    if (!path || !data.has(path.dataset.regionId)) return
    L.DomEvent.stopPropagation(event); activate(path, map.mouseEventToLatLng(event))
  })
  svg.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key) || !event.target.matches('[data-region-id]')) return
    event.preventDefault(); event.stopPropagation(); activate(event.target)
  })
  svg.addEventListener('pointerover', event => {
    const path = event.target.closest('[data-region-id]')
    if (event.pointerType === 'touch' || !path || !data.has(path.dataset.regionId)) return
    endHover(); hovered = path; paint(path)
  })
  svg.addEventListener('pointerout', endHover)
  map.on('movestart zoomstart', endHover)
  return {
    layer, legend, clear, focus,
    select: (id, value) => { const path = byID.get(id); if (path) activate(path, null, value) },
    configure(value) { settings = { ...settings, ...value }; paths.forEach(paint) },
    destroy() { endHover(); map.off('movestart zoomstart', endHover); removeCoastDisplay(); layer.remove() },
    count: configured.length,
  }
}
