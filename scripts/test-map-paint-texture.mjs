import assert from 'node:assert/strict'
import { paintTexture } from '../src/map-painter/paint-texture.js'
const halo = 18, width = 256 + halo * 2
const labels = new Uint16Array(width * width), coverage = new Uint8Array(labels.length)
const palette = new Map([[1, [163, 0, 0]], [2, [0, 80, 160]]])
for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
  if (x > halo + 12) { coverage[y * width + x] = 255; labels[y * width + x] = x < halo + 128 ? 1 : 2 }
  if (x === halo + 12) coverage[y * width + x] = 100
}
const beforeLabels = labels.slice(), beforeCoverage = coverage.slice()
const rgba = paintTexture(labels, coverage, width, halo, 256, 4, palette)
const pixel = (x, y = 100) => Array.from(rgba.slice(((y + 1) * 258 + x + 1) * 4, ((y + 1) * 258 + x + 1) * 4 + 4))
assert.equal(pixel(11)[3], 0, 'ocean remains transparent')
assert.ok(pixel(12)[3] > 0 && pixel(12)[3] < 100, 'fractional shore coverage recovered')
assert.ok(pixel(13)[3] < pixel(14)[3], 'inward fade')
assert.equal(pixel(20)[3], 255, 'interior remains opaque')
assert.deepEqual(pixel(127), [163, 0, 0, 255])
assert.deepEqual(pixel(128), [0, 80, 160, 255], 'no feather between countries')
assert.deepEqual(labels, beforeLabels, 'ownership unmodified')
assert.deepEqual(coverage, beforeCoverage)

// A subpixel island must survive reduction even when its centre is not sampled.
labels.fill(0); coverage.fill(0)
labels[(halo + 80) * width + halo + 80] = 1
coverage[(halo + 80) * width + halo + 80] = 255
const small = paintTexture(labels, coverage, width, halo, 64, 1, palette)
const start = ((20 + 1) * 66 + 20 + 1) * 4
assert.deepEqual(Array.from(small.slice(start, start + 4)), [163, 0, 0, 16], 'area average preserves tiny islands, no dark fringe')
console.log('PASS coverage, inward-only feather, country boundaries, no mutation, subpixel islands')
