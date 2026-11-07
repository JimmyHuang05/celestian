import assert from 'node:assert/strict'
import { visibleMarkers } from '../src/map-ui/marker-visibility.js'
import { countryLegend, focusRegionIDs } from '../src/map-ui/region-presentation.js'
import { DEFAULT_LAYERS, normalizePreferences, restoreView } from '../src/map-ui/preferences.js'

const points = [
  { id: 'capital', type: '首都', x: 0, y: 0 },
  { id: 'major', type: '主要城市', x: 10, y: 10 },
  { id: 'town', type: '城市', x: 100, y: 100 },
  { id: 'fort', type: '要塞', x: 200, y: 200 },
]
assert.deepEqual([...visibleMarkers(points, 2)], ['capital'])
assert(visibleMarkers(points, 3).has('fort'))
assert(visibleMarkers(points, 4).has('town'))
assert.deepEqual([...visibleMarkers(points, 1, { type: '主要城市' })], ['major'])
assert.deepEqual([...visibleMarkers(points, 1, { points: false, selected: 'town' })], ['town'])
assert(!visibleMarkers(points, 2, { selected: 'major' }).has('capital'), 'Selected marker takes precedence at an overlap')
const rows = [
  { region_id: 'a', group_id: '国家甲', is_primary: true },
  { region_id: 'b', group_id: '国家甲' },
  { region_id: 'c', group_id: '国家甲', sub_group_id: '殖民地', is_sub_primary: true },
  { region_id: 'd', group_id: '国家乙', sub_group_id: '殖民地' },
]
const boxes = new Map([
  ['a', { x: 0, y: 0, width: 100, height: 100 }],
  ['b', { x: 120, y: 0, width: 50, height: 50 }],
  ['c', { x: 2000, y: 2000, width: 40, height: 40 }],
  ['d', { x: 2020, y: 2000, width: 40, height: 40 }],
])
assert.deepEqual(focusRegionIDs(rows[0], rows, boxes), ['a', 'b'])
assert.deepEqual(focusRegionIDs(rows[2], rows, boxes), ['c'])
assert.equal(new Set(countryLegend(rows).map(row => row.color)).size, 2)
assert.deepEqual(normalizePreferences({ version: 1, layers: { points: false } }).layers, DEFAULT_LAYERS)
assert.equal(normalizePreferences({ version: 2, type: '不存在', view: { center: [NaN, 0] } }).view, null)
assert.equal(normalizePreferences({ version: 2, layers: { labels: 'false' } }).layers.labels, true)
const state = normalizePreferences({ version: 2, layers: { points: false }, type: '首都', query: 'a'.repeat(200), view: { coordinates: 'new-map', center: [.5, .6], zoom: -.5 } })
assert.equal(state.layers.points, false)
assert.equal(state.query.length, 120)
assert.equal(state.view.zoom, -.5)
const metadata = { coordinateSystemSha256: 'new-map', width: 21600, height: 10400, maxZoom: 6, minZoom: 0 }
assert.deepEqual(restoreView(state.view, metadata), { center: [-97.5, 168.75], zoom: -.5 })
assert.equal(restoreView(state.view, { ...metadata, coordinateSystemSha256: 'other-map' }), null)
console.log('Passed: zoom levels, deterministic overlap priority, selected-point visibility, country/subregion focus, country colors and validated coordinate-bound preferences.')
