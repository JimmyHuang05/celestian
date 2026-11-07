import assert from 'node:assert/strict'
import fs from 'node:fs'
import { consolidateCountries, remapOwnership } from '../src/map-painter/countries.js'
import { PainterModel } from '../src/map-painter/model.js'
const original = JSON.parse(fs.readFileSync(new URL('../public/map/world-240705-base-v2/legacy-editable.json', import.meta.url)))
const snapshot = JSON.stringify(original.regions)
const result = consolidateCountries(original.regions)
assert.equal(result.regions.length, 135)
assert.equal(result.summary.confirmedGroups, 9)
assert.equal(result.summary.unassigned, 126)
assert.equal(new Set(result.regions.map(r => r.color)).size, 135)
assert.deepEqual(result.regions.map(r => r.id), Array.from({ length: 135 }, (_, i) => i + 1))
assert.equal(result.regions.flatMap(r => r.sources || []).length, 208)
assert.equal(JSON.stringify(original.regions), snapshot, 'original data is not mutated')
const lookup = new Map(original.regions.map(r => [r.source.regionId, r]))
for (const region of result.regions) for (const source of region.sources || []) {
  assert.deepEqual(source.metadata, lookup.get(source.regionId).source.metadata)
  assert.deepEqual(source.geometry, lookup.get(source.regionId).source.geometry)
}
const chunks = new Map([['0,0', { labels: new Uint16Array([0, ...original.regions.map(r => r.id)]), version: 1 }]])
remapOwnership(chunks, result.mapping)
assert.equal(chunks.get('0,0').labels[0], 0)
for (const id of chunks.get('0,0').labels.slice(1)) assert(id > 0)
const model = new PainterModel(() => null); model.regions = result.regions
const restored = new PainterModel(() => null); restored.importBackup(model.backup())
assert.deepEqual(restored.regions, result.regions, 'merged source records survive backup import')
console.log('Passed: confirmed grouping, unrelated same colors remain separate, 135 unique colors and new IDs, all 208 source records retained, no input mutation, ownership remap and backup round trip.')
