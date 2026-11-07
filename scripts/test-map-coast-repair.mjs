import assert from 'node:assert/strict'
import { repairCoastTile, collectCoastRepairs } from '../src/map-painter/coast-repair.js'
import { PainterModel, CHUNK } from '../src/map-painter/model.js'

const width = 40, mask = new Uint8Array(width * width), labels = new Uint16Array(mask.length)
for (let y = 5; y < 35; y++) for (let x = 5; x < 35; x++) mask[y * width + x] = 1
for (let y = 7; y < 33; y++) for (let x = 7; x < 33; x++) labels[y * width + x] = 1
mask[10 * width + 10] = 0; labels[10 * width + 10] = 0 // lake
labels[20 * width + 20] = 0 // inland gap must remain unchanged
labels[6 * width + 12] = 2 // another region must not be overwritten
const result = repairCoastTile(labels, mask, width, 4)
assert.equal(result[5 * width + 20], 1)
assert.equal(result[6 * width + 12], 2)
assert.equal(result[10 * width + 10], 0)
assert.equal(result[20 * width + 20], 0)
for (let i = 0; i < mask.length; i++) if (!mask[i]) assert.equal(result[i], 0)
const tieMask = new Uint8Array(25), tieLabels = new Uint16Array(25)
tieMask.fill(1, 10, 15); tieLabels[10] = 1; tieLabels[14] = 2
assert.equal(repairCoastTile(tieLabels, tieMask, 5, 4)[12], 0)
// A sea channel must not transfer ownership to an unassigned island.
tieMask[12] = 0; tieLabels[14] = 0
assert.equal(repairCoastTile(tieLabels, tieMask, 5, 4)[14], 0)

// Tile-boundary coastal gap, undo/redo and backup compatibility.
const land = new Uint8Array(CHUNK * CHUNK)
for (let y = 5; y < 25; y++) land.fill(1, y * CHUNK, (y + 1) * CHUNK)
const model = new PainterModel((x, y) => y === 0 && (x === 0 || x === 1) ? land : null)
const original = new Uint16Array(CHUNK * CHUNK)
for (let y = 7; y < 23; y++) original.fill(1, y * CHUNK + 250, (y + 1) * CHUNK)
model.chunks.set('0,0', { labels: original.slice(), version: 1 })
const repair = await collectCoastRepairs(model, { radius: 4 })
assert.ok(repair.pixels > 0)
assert.ok(repair.patches.has('1,0'))
model.applyCoastRepairs(repair.patches)
assert.equal(model.chunks.get('1,0').labels[7 * CHUNK], 1)
model.undo()
assert.deepEqual(model.chunks.get('0,0').labels, original)
assert.ok(model.chunks.get('1,0').labels.every(v => v === 0))
model.redo()
assert.equal(model.chunks.get('1,0').labels[7 * CHUNK], 1)
const restored = new PainterModel(model.maskForChunk)
restored.importBackup(model.backup())
assert.deepEqual(restored.chunks.get('1,0').labels, model.chunks.get('1,0').labels)
console.log('PASS coast fill, sea/lake protection, other owners, inland gaps, ties, islands, tile seams, undo/redo, backup')
