import {ashIslandPollution, initialPollution, northernShorePollution} from './pollution-1818.js'
import clipping from 'polygon-clipping'
import {coastalGeometryText} from './map-coastal-resource.js'

const storageKey = 'celestian-pollution-v9'
const ridgeCountries = ['custom-tatria', 'custom-pannovia', 'political-4']
const previousVersions = [
  ['celestian-pollution-v6', new Set(['political-3'])],
  ['celestian-pollution-v5', new Set(['political-3'])],
  ['celestian-pollution-v4', new Set(['political-3', 'political-7'])],
  ['celestian-pollution-v3', new Set([...ridgeCountries, 'political-3', 'political-7'])],
  ['celestian-pollution-v2', new Set([...ridgeCountries, 'political-3', 'political-7'])],
  ['celestian-pollution-v1', new Set([...ridgeCountries, 'political-3', 'political-7'])],
]
const rodariaCountries = new Set(initialPollution.slice(-5).map(entry => entry.country))
const ns = 'http://www.w3.org/2000/svg'
let nextMask = 0
let nextWash = 0
const borderMasks = new WeakMap()

function element(tag, attrs = {}) {
  const node = document.createElementNS(ns, tag)
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value)
  return node
}

export function readPollution() {
  try {
    let entries = initialPollution
    const saved = localStorage.getItem(storageKey)
    const previousMap = saved === null ? localStorage.getItem('celestian-pollution-v8') : null
    const olderMap = saved === null && previousMap === null ? localStorage.getItem('celestian-pollution-v7') : null
    if (saved !== null) entries = JSON.parse(saved)
    else if (previousMap !== null) entries = [...JSON.parse(previousMap), ashIslandPollution]
    else if (olderMap !== null) entries = [...JSON.parse(olderMap), ...northernShorePollution, ashIslandPollution]
    else {
      for (const [key, updatedCountries] of previousVersions) {
        const previous = localStorage.getItem(key)
        if (previous === null) continue
        entries = [
          ...JSON.parse(previous).filter(entry => !updatedCountries.has(entry.country) && (key === 'celestian-pollution-v6' || !rodariaCountries.has(entry.country))),
          ...initialPollution.filter(entry => updatedCountries.has(entry.country) || (key !== 'celestian-pollution-v6' && rodariaCountries.has(entry.country))),
          ...(!updatedCountries.has('political-7') ? northernShorePollution : []),
          ashIslandPollution,
        ]
        break
      }
    }
    return entries.filter(entry => typeof entry.country === 'string' && entry.points?.length >= 3 &&
      entry.points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)))
  } catch { return [] }
}

const outline = points => 'M' + points.map(point => point.join(',')).join('L')
const polygon = points => [[...points, points[0]]]

// Political territory paths use absolute M/L/Z commands and even-odd fill.
function territoryPolygons(path) {
  const rings = [...path.matchAll(/M([^Z]+)Z/g)].map(([, ring]) => {
    const points = [...ring.matchAll(/[-+]?(?:[0-9]*[.])?[0-9]+(?:e[-+]?[0-9]+)?/gi)].map(match => Number(match[0]))
    return [points.filter((_, index) => index % 2 === 0).map((x, index) => [x, points[index * 2 + 1]])]
  }).filter(([ring]) => ring.length >= 3)
  return rings.length ? clipping.xor(...rings) : []
}

export async function pollutionCoast(url) {
  const source = new DOMParser().parseFromString(await coastalGeometryText(url), 'image/svg+xml')
  const shape = source.getElementById('mapplus-land-shape')
  const mask = source.getElementById('mapplus-land-clip')
  if (!shape || !mask) throw new Error('Missing pollution coastline geometry')
  return {shape, mask}
}

export function pollutionArtwork(territories, entries = readPollution(), {inset = false, coast} = {}) {
  const svg = element('svg', {viewBox:'0 0 2048 1024', 'aria-hidden':'true', 'pointer-events':'none'})
  const paths = new Map([...territories.querySelectorAll('path[data-region-id]')].map(path => [path.dataset.regionId, path.getAttribute('d')]))
  const countries = new Map()
  const affected = []
  for (const entry of entries) {
    const path = paths.get(entry.country)
    if (!path) continue
    try {
      if (!countries.has(entry.country)) countries.set(entry.country, territoryPolygons(path))
      const refuges = entry.refuges || (entry.exclude?.length >= 3 ? [entry.exclude] : [])
      const front = clipping.difference(polygon(entry.points), ...refuges.map(polygon))
      affected.push(clipping.intersection(countries.get(entry.country), front))
    } catch (error) {
      console.warn('Unable to render pollution area', entry.country, error)
    }
  }
  const merged = affected.length ? clipping.union(...affected) : []
  const d = merged.flatMap(area => area.map(ring => outline(ring.slice(0, -1)) + 'Z')).join('')
  if (d && inset) {
    svg.append(element('path', {
      d, 'data-pollution-wash':'', fill:'#e18477', 'fill-opacity':'.34', 'fill-rule':'evenodd',
      stroke:'#e18477', 'stroke-width':'1.2', 'stroke-linejoin':'round',
      'vector-effect':'non-scaling-stroke',
    }))
    return svg
  }
  if (d) {
    const defs = element('defs')
    const id = 'pollution-wash-' + ++nextWash
    // A slightly expanded, softened base keeps level 8 visible along
    // the recorded edge, including narrow strips. The halo carries 9–10
    // beyond it, while the eroded layers concentrate the stronger pigment.
    const layers = [
      {blur:14, opacity:'.11'},
      {blur:4, spread:4, opacity:'.23'},
      {blur:8, spread:-8, opacity:'.13'},
      {blur:6, spread:-21, opacity:'.19'},
    ]
    const wash = element('g', {opacity:'.75'})
    svg.append(defs, wash)
    // Mask the finished blur so it cannot bleed past the shore.
    if (coast) {
      const shape = document.importNode(coast.shape, true)
      const mask = document.importNode(coast.mask, true)
      shape.id = id + '-land'
      mask.id = id + '-shore'
      for (const use of mask.querySelectorAll('use')) use.setAttribute('href', '#' + shape.id)
      defs.append(shape, mask)
      wash.setAttribute('mask', 'url(#' + mask.id + ')')
    }
    layers.forEach(({blur, spread, opacity}, index) => {
      const filterId = id + '-' + index
      const filter = element('filter', {
        id:filterId, filterUnits:'userSpaceOnUse', x:-54, y:-54, width:2156, height:1132,
        'color-interpolation-filters':'sRGB',
      })
      if (spread) filter.append(element('feMorphology', {
        operator:spread > 0 ? 'dilate' : 'erode', radius:Math.abs(spread),
      }))
      filter.append(element('feGaussianBlur', {stdDeviation:blur}))
      defs.append(filter)
      wash.append(element('path', {
        d, 'data-pollution-wash':'', fill:'#9e4231',
        'fill-opacity':opacity, 'fill-rule':'evenodd', filter:'url(#' + filterId + ')',
      }))
    })
  }
  return svg
}

export function maskPollutedBorders(territories, artwork) {
  borderMasks.get(territories)?.()
  const pollution = artwork?.querySelector('[data-pollution-wash]')
  if (!pollution) return

  const id = 'pollution-border-mask-' + ++nextMask
  const mask = element('mask', {id, maskUnits:'userSpaceOnUse', x:0, y:0, width:2048, height:1024})
  mask.append(
    element('rect', {width:2048, height:1024, fill:'white'}),
    element('path', {d:pollution.getAttribute('d'), fill:'black', 'fill-rule':'evenodd'}),
  )
  const defs = element('defs')
  defs.append(mask)
  territories.prepend(defs)
  const paths = [...territories.querySelectorAll('path[data-region-id]')]
  const previous = paths.map(path => path.getAttribute('mask'))
  // Unlike clipping, an SVG mask keeps the territory's pointer hit area.
  paths.forEach(path => path.setAttribute('mask', 'url(#' + id + ')'))
  borderMasks.set(territories, () => {
    paths.forEach((path, index) => {
      if (previous[index] === null) path.removeAttribute('mask')
      else path.setAttribute('mask', previous[index])
    })
    defs.remove()
    borderMasks.delete(territories)
  })
}

export function installPollutionEditor(L, map, bounds, editorSvg, getCountries, renderCountries) {
  const control = L.control({position:'topright'})
  const panel = document.createElement('div')
  panel.style.cssText = 'background:#faf2db;padding:8px;color:#632522;pointer-events:auto;max-width:270px'
  panel.innerHTML = '<strong>污染区</strong> <select aria-label="污染区所属国家"></select> <button type="button">开始画</button> <button type="button" disabled>保存</button> <button type="button" disabled>取消</button> <button type="button">撤销该国最后一块</button><div role="status"></div>'
  L.DomEvent.disableClickPropagation(panel)
  L.DomEvent.disableScrollPropagation(panel)
  control.onAdd = () => panel
  control.addTo(map)
  const select = panel.querySelector('select'), status = panel.querySelector('[role=status]')
  const [start, save, cancel, undo] = panel.querySelectorAll('button')
  let points = null, layer
  function render() {
    layer?.remove()
    const entries = readPollution()
    const ids = new Set(entries.map(entry => entry.country))
    const svg = pollutionArtwork(renderCountries(getCountries().filter(row => ids.has(row.region_id))), entries)
    if (points?.length) svg.append(element('path', {d:outline(points), fill:'none', stroke:'#a31e20', 'stroke-width':'2', 'vector-effect':'non-scaling-stroke'}))
    layer = L.svgOverlay(svg, bounds, {interactive:false}).addTo(map)
  }
  function refresh() {
    const selected = select.value
    const countries = getCountries()
    select.replaceChildren(...countries.map(c => new Option(c.title, c.region_id)))
    if (countries.some(c => c.region_id === selected)) select.value = selected
    else if (points) setDrawing(false)
    render()
  }
  function setDrawing(active) {
    points = active ? [] : null
    select.disabled = start.disabled = undo.disabled = active
    cancel.disabled = !active
    save.disabled = true
    status.textContent = active ? '依次点击地图画边界，至少三点。' : ''
    render()
  }
  function persist(entries) {
    try { localStorage.setItem(storageKey, JSON.stringify(entries)); return true }
    catch { status.textContent = '浏览器未能保存污染区。'; return false }
  }
  start.onclick = () => { if (select.value) setDrawing(true) }
  cancel.onclick = () => setDrawing(false)
  save.onclick = () => {
    if (points?.length >= 3 && persist([...readPollution(), {country:select.value, points}])) {
      setDrawing(false)
      status.textContent = '已保存到本浏览器。'
    }
  }
  undo.onclick = () => {
    const entries = readPollution()
    const index = entries.findLastIndex(entry => entry.country === select.value)
    if (index >= 0) { entries.splice(index, 1); if (persist(entries)) render() }
  }
  map.getContainer().addEventListener('mousedown', event => {
    if (!points || event.button !== 0 || event.target.closest('.leaflet-control')) return
    event.preventDefault()
    event.stopImmediatePropagation()
    const {lat,lng} = map.mouseEventToLatLng(event)
    points.push([lng,-lat])
    save.disabled = points.length < 3
    render()
  }, true)
  new MutationObserver(refresh).observe(editorSvg, {childList:true})
  refresh()
}

export function watchPollution(callback, signal) {
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) callback()
  }, {signal})
}
