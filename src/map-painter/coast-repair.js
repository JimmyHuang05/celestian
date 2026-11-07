import { CHUNK, WORLD } from './model.js'

// Work from a snapshot, not previously repaired tiles. The halo prevents seams
// and makes the result independent of tile iteration order.
export function repairCoastTile(labels, land, width, radius) {
  const length = land.length, sea = new Uint16Array(length)
  sea.fill(radius + 1)
  for (let i = 0; i < length; i++) {
    if (!land[i]) sea[i] = 0
    else {
      if (i % width) sea[i] = Math.min(sea[i], sea[i - 1] + 1)
      if (i >= width) sea[i] = Math.min(sea[i], sea[i - width] + 1)
    }
  }
  for (let i = length - 1; i >= 0; i--) if (land[i]) {
    if (i % width < width - 1) sea[i] = Math.min(sea[i], sea[i + 1] + 1)
    if (i + width < length) sea[i] = Math.min(sea[i], sea[i + width] + 1)
  }
  const owners = labels.slice(), distance = new Uint16Array(length), queue = new Uint32Array(length)
  distance.fill(radius + 1)
  let head = 0, tail = 0
  const neighbors = i => [i % width ? i - 1 : -1, i % width < width - 1 ? i + 1 : -1,
    i >= width ? i - width : -1, i + width < length ? i + width : -1]
  for (let i = 0; i < length; i++) if (land[i] && labels[i]) {
    distance[i] = 0
    if (sea[i] <= radius + 1 && neighbors(i).some(n => n >= 0 && land[n] && !labels[n] && sea[n] <= radius)) queue[tail++] = i
  }
  while (head < tail) {
    const i = queue[head++], nextDistance = distance[i] + 1
    if (!owners[i] || nextDistance > radius) continue
    for (const n of neighbors(i)) {
      if (n < 0 || !land[n] || labels[n] || sea[n] > radius) continue
      if (nextDistance < distance[n]) {
        distance[n] = nextDistance; owners[n] = owners[i]; queue[tail++] = n
      } else if (nextDistance === distance[n] && owners[n] !== owners[i]) {
        // Equal-distance boundaries remain unassigned instead of guessing.
        owners[n] = 0
      }
    }
  }
  return owners
}

export async function collectCoastRepairs(model, { radius = 16, progress = () => {}, cancelled = () => false } = {}) {
  const columns = Math.ceil(WORLD.width / CHUNK), rows = Math.ceil(WORLD.height / CHUNK)
  const keys = new Set()
  for (const [key, chunk] of model.chunks) {
    if (!chunk.labels.some(Boolean)) continue
    const [cx, cy] = key.split(',').map(Number)
    for (let y = Math.max(0, cy - 1); y <= Math.min(rows - 1, cy + 1); y++) {
      for (let x = Math.max(0, cx - 1); x <= Math.min(columns - 1, cx + 1); x++) keys.add(`${x},${y}`)
    }
  }
  const halo = radius * 2 + 1, width = CHUNK + halo * 2, patches = new Map()
  let done = 0, pixels = 0
  const regions = new Set()
  for (const key of keys) {
    if (cancelled()) throw new Error('补边已取消')
    const [cx, cy] = key.split(',').map(Number)
    const labels = new Uint16Array(width * width), land = new Uint8Array(width * width)
    const x0 = cx * CHUNK - halo, y0 = cy * CHUNK - halo
    for (let ty = Math.max(0, cy - 1); ty <= Math.min(rows - 1, cy + 1); ty++) {
      for (let tx = Math.max(0, cx - 1); tx <= Math.min(columns - 1, cx + 1); tx++) {
        const mask = model.maskForChunk(tx, ty)
        if (!mask) continue
        const source = model.chunks.get(`${tx},${ty}`)?.labels
        const left = Math.max(x0, tx * CHUNK), right = Math.min(x0 + width, (tx + 1) * CHUNK)
        for (let y = Math.max(y0, ty * CHUNK); y < Math.min(y0 + width, (ty + 1) * CHUNK); y++) {
          const from = (y - ty * CHUNK) * CHUNK + left - tx * CHUNK
          const to = (y - y0) * width + left - x0, count = right - left
          land.set(mask.subarray(from, from + count), to)
          if (source) labels.set(source.subarray(from, from + count), to)
        }
      }
    }
    const result = repairCoastTile(labels, land, width, radius), indices = [], owners = []
    for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) {
      const i = (y + halo) * width + x + halo
      if (!labels[i] && result[i]) {
        indices.push(y * CHUNK + x); owners.push(result[i]); regions.add(result[i]); pixels++
      }
    }
    if (indices.length) patches.set(key, { indices: Uint16Array.from(indices), owners: Uint16Array.from(owners) })
    if (++done % 8 === 0) { progress(done, keys.size); await new Promise(resolve => setTimeout(resolve, 0)) }
  }
  return { patches, pixels, regions: regions.size }
}
