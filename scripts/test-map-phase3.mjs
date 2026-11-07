import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { visibleLabels } from '../src/map-ui/label-visibility.js'
import { buildMapShare, readMapShare } from '../src/map-ui/share.js'
import { normalizePreferences } from '../src/map-ui/preferences.js'

const root = new URL('../public/map/world-240705-base-v2/', import.meta.url)
const index = JSON.parse(await readFile(new URL('labels-index.json', root)))
const svg = await readFile(new URL('labels.svg', root), 'utf8')
assert.equal(index.sourceSha256, createHash('sha256').update(svg).digest('hex'))
const parts = index.data.flatMap(row => row.parts)
assert.equal(parts.length, 1423)
assert.equal(new Set(parts).size, 1423)
assert.deepEqual(new Set(parts), new Set([...svg.matchAll(/id="(label-part-\d+)"/g)].map(m => m[1])))
assert.equal(index.data.length, 52)
for (const row of index.data) assert(row.title && row.foreignTitle && row.bounds[0] < row.bounds[2] && row.bounds[1] < row.bounds[3])

const rows = [
  { id: 'small', priority: 2, minZoom: 3.5, box: [5, 5, 25, 25] },
  { id: 'ocean', priority: 0, minZoom: 1.5, box: [0, 0, 20, 20] },
  { id: 'far', priority: 1, minZoom: 2.5, box: [100, 100, 120, 120] },
]
assert.deepEqual([...visibleLabels(rows, 2)], ['ocean'])
assert.deepEqual([...visibleLabels(rows, 4)], ['ocean', 'far'])
assert.deepEqual(visibleLabels([...rows].reverse(), 4), visibleLabels(rows, 4))
assert.deepEqual([...visibleLabels(rows, 4, { obstacles: [[105, 105, 110, 110]] })], ['ocean'])
assert.equal(visibleLabels(rows, 0, { mode: 'all', obstacles: [[-100, -100, 500, 500]] }).size, 3)

const state = { ...normalizePreferences(null), view: { coordinates: 'a'.repeat(64), center: [.6173245, .3882412], zoom: 3.25 } }
state.labelMode = 'all'; state.layers.countries = true
for (const selection of [null, { kind: 'point', id: 'known-id' }, { kind: 'region', id: 'region_70_1_2' }]) {
  const url = new URL(buildMapShare('https://example.com/map/?private-search=secret#old', state, selection))
  assert.equal(url.pathname, '/map/'); assert.equal(url.hash, '')
  assert.equal(url.searchParams.has('private-search'), false)
  assert.deepEqual(readMapShare(url.search), { ...state, selection })
}
const valid = new URL(buildMapShare('https://example.com/', state))
for (const [key, bad] of [['map', '99'], ['x', ''], ['x', 'Infinity'], ['x', '4'], ['z', '7'], ['atlas', 'old'], ['layers', '11111'], ['labels', 'bad'], ['point', '<script>']]) {
  const url = new URL(valid); url.searchParams.set(key, bad)
  assert(readMapShare(url.search)?.error, `${key}=${bad}`)
}
assert.equal(readMapShare('?q=unrelated'), null)
console.log('Passed: 52 labels / 1,423 original paths, priority and collision rules, share round trips and invalid input.')
