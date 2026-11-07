import assert from 'node:assert/strict'
import { CHUNK, PainterModel } from '../src/map-painter/model.js'
import { exportPaintSVG } from '../src/map-painter/export.js'

const mask = (x, y) => {
  if (y !== 0) return null
  const values = new Uint8Array(CHUNK * CHUNK)
  for (let py = 0; py < 128; py++) for (let px = 0; px < CHUNK; px++) {
    const gx = x * CHUNK + px
    if (!(gx >= 245 && gx < 260 && py >= 45 && py < 60)) values[py * CHUNK + px] = 1
  }
  return values
}
const model = new PainterModel(mask)
const owner = (x, y) => model.chunks.get(`${Math.floor(x / CHUNK)},${Math.floor(y / CHUNK)}`)?.labels[(y % CHUNK) * CHUNK + x % CHUNK] || 0
const paint = (id, erase, x, y, radius) => { model.begin(id, erase); model.stamp(x, y, radius); model.finish() }
paint(1, false, 250, 110, 90)
assert.equal(owner(250, 100), 1)
assert.equal(owner(270, 100), 1, 'stroke crosses chunks')
assert.equal(owner(250, 145), 0, 'ocean cannot be painted')
assert.equal(owner(250, 50), 0, 'lake cannot be painted')
model.addRegion()
paint(2, false, 280, 110, 90)
assert.equal(owner(270, 100), 1, 'country 2 cannot overwrite country 1')
assert.equal(owner(360, 110), 2)
paint(2, true, 280, 110, 100)
assert.equal(owner(270, 100), 1, 'eraser protects other countries')
assert.equal(owner(360, 110), 0)
model.undo(); assert.equal(owner(360, 110), 2)
model.redo(); assert.equal(owner(360, 110), 0)
model.undo()
model.regions[0].source = { regionId: 'region_3_1', groupId: '原分组', subGroupId: '本土', metadata: { title: '原名称', is_primary: true, color: '#D4B58E' } }
const backup = model.backup(), restored = new PainterModel(mask)
restored.importBackup(JSON.parse(JSON.stringify(backup)))
assert.deepEqual(restored.backup(), backup)
const previous = JSON.stringify(restored.backup())
assert.throws(() => restored.importBackup({ ...backup, tiles: [{ key: '0,0', runs: [[0, 999999, 1]] }] }))
assert.equal(JSON.stringify(restored.backup()), previous, 'invalid import preserves the draft')
restored.regions[0].name = '<国家 & "一">'
const svg = exportPaintSVG(restored, '<path d="M0 0h500v128H0z"/>')
assert(svg.includes('&lt;国家 &amp; &quot;一&quot;&gt;'))
assert(svg.includes('id="country-1"') && svg.includes('id="country-2"'))
assert(svg.includes('clip-path="url(#land-mask)"'))
assert(svg.includes('data-legacy-region="region_3_1"') && svg.includes('原名称'))
console.log('Passed: land/lake masks, chunk seams, ownership and eraser protection, undo/redo, backup integrity, invalid import, SVG export.')
