import { DEFAULT_LAYERS } from './preferences.js'

const layerKeys = Object.keys(DEFAULT_LAYERS)
const validID = value => typeof value === 'string' && /^[\w-]{1,120}$/.test(value)
export function readMapShare(search) {
  const p = new URLSearchParams(search)
  if (!p.has('map')) return null
  const number = key => p.has(key) && p.get(key).trim() !== '' ? Number(p.get(key)) : NaN
  const x = number('x'), y = number('y'), zoom = number('z'), coordinates = p.get('atlas')
  const point = p.get('point'), region = p.get('region'), layers = p.get('layers')
  if (p.get('map') !== '2' || !/^[a-f0-9]{64}$/.test(coordinates || '') ||
    ![x, y].every(n => Number.isFinite(n) && n >= -1 && n <= 2) || !Number.isFinite(zoom) || zoom < -1 || zoom > 6 ||
    (p.has('point') && !validID(point)) || (p.has('region') && !validID(region)) || (point && region) ||
    !/^[01]{4}$/.test(layers || '') || !['auto', 'all'].includes(p.get('labels'))) return { error: '分享链接无效，已打开默认地图。' }
  return {
    view: { coordinates, center: [x, y], zoom },
    selection: point ? { kind: 'point', id: point } : region ? { kind: 'region', id: region } : null,
    layers: Object.fromEntries(layerKeys.map((key, i) => [key, layers[i] === '1'])),
    labelMode: p.get('labels'), type: '', query: '',
  }
}

export function buildMapShare(base, settings, selection = null) {
  const url = new URL('/map/', base), view = settings.view
  url.searchParams.set('map', '2')
  url.searchParams.set('atlas', view.coordinates)
  url.searchParams.set('x', Number(view.center[0].toFixed(7)))
  url.searchParams.set('y', Number(view.center[1].toFixed(7)))
  url.searchParams.set('z', Number(view.zoom.toFixed(4)))
  url.searchParams.set('layers', layerKeys.map(key => settings.layers[key] ? '1' : '0').join(''))
  url.searchParams.set('labels', settings.labelMode === 'all' ? 'all' : 'auto')
  if (selection && ['point', 'region'].includes(selection.kind) && validID(selection.id)) url.searchParams.set(selection.kind, selection.id)
  return url.href
}
