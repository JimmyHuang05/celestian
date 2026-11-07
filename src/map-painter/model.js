export const CHUNK = 256
export const WORLD = { width: 21600, height: 10400, sha: '2acc2256324424aaf482a78d194fab5bfd899e1643c632db5c2526c983b0bc5e' }
export const COLORS = ['#df8960', '#69b7c7', '#baa0d5', '#8dbd81', '#d4ba62', '#d985a4']

function legacySource(value) {
  if (!value) return undefined
  if (typeof value.regionId !== 'string' || !/^region_[a-z\d_]+$/.test(value.regionId) || typeof value.groupId !== 'string' || typeof value.subGroupId !== 'string') throw new Error('旧区域来源资料无效')
  const allowed = new Set(['id', 'region_id', 'group_id', 'sub_group_id', 'title', 'foreign_title', 'description', 'status', 'color', 'status_color', 'pollution_level', 'follow_primary', 'is_primary', 'is_sub_primary', 'created_at', 'updated_at'])
  const metadata = Object.fromEntries(Object.entries(value.metadata || {}).filter(([key, item]) => allowed.has(key) && (item === null || ['string', 'number', 'boolean'].includes(typeof item))))
  if (JSON.stringify(metadata).length > 65536) throw new Error('旧区域资料过大')
  const source = { regionId: value.regionId, groupId: value.groupId.slice(0, 255), subGroupId: value.subGroupId.slice(0, 255), metadata }
  if (typeof value.originalName === 'string') source.originalName = value.originalName.slice(0, 80)
  if (typeof value.originalColor === 'string' && /^#[0-9a-f]{6}$/i.test(value.originalColor)) source.originalColor = value.originalColor
  if (value.geometry) {
    if (value.geometry.scale !== 2 || typeof value.geometry.path !== 'string' || value.geometry.path.length > 200000 || !/^[MLZ0-9,.\s-]+$/.test(value.geometry.path)) throw new Error('旧轮廓来源无效')
    source.geometry = { path: value.geometry.path, scale: 2 }
  }
  return source
}

export class PainterModel {
  constructor(maskForChunk, notify = () => {}) {
    this.maskForChunk = maskForChunk
    this.notify = notify
    this.regions = [{ id: 1, name: '国家 1', color: COLORS[0] }]
    this.chunks = new Map()
    this.dirty = new Set()
    this.undoStack = []; this.redoStack = []; this.stroke = null
    this.revision = 0
  }
  addRegion() {
    const id = Math.max(...this.regions.map(r => r.id)) + 1
    if (id > 65534) throw new Error('国家数量已达上限')
    this.regions.push({ id, name: `国家 ${id}`, color: COLORS[(id - 1) % COLORS.length] })
    this.changed()
    return id
  }
  changed() { this.revision++; this.notify() }
  begin(id, erase) { this.stroke = { id, erase, before: new Map() } }
  stamp(x, y, radius) {
    if (!this.stroke) return
    const { id, erase, before } = this.stroke
    const x0 = Math.max(0, Math.floor(x - radius)), x1 = Math.min(WORLD.width - 1, Math.ceil(x + radius))
    const y0 = Math.max(0, Math.floor(y - radius)), y1 = Math.min(WORLD.height - 1, Math.ceil(y + radius))
    for (let cy = Math.floor(y0 / CHUNK); cy <= Math.floor(y1 / CHUNK); cy++) {
      for (let cx = Math.floor(x0 / CHUNK); cx <= Math.floor(x1 / CHUNK); cx++) {
        const key = `${cx},${cy}`
        let chunk = this.chunks.get(key)
        if (erase && !chunk) continue
        const mask = this.maskForChunk(cx, cy)
        if (!mask) continue
        for (let py = Math.max(y0, cy * CHUNK); py <= Math.min(y1, (cy + 1) * CHUNK - 1); py++) {
          const dy = py + .5 - y, reach = Math.sqrt(Math.max(0, radius * radius - dy * dy))
          if (Math.abs(dy) > radius) continue
          const start = Math.max(x0, cx * CHUNK, Math.ceil(x - reach - .5))
          const end = Math.min(x1, (cx + 1) * CHUNK - 1, Math.floor(x + reach - .5))
          for (let px = start; px <= end; px++) {
            const i = (py - cy * CHUNK) * CHUNK + px - cx * CHUNK
            if (!mask[i]) continue
            const owner = chunk?.labels[i] || 0
            // Never paint over another owner, or erase another owner's pixels.
            if (erase ? owner !== id : owner !== 0) continue
            if (!chunk) { chunk = { labels: new Uint16Array(CHUNK * CHUNK), version: 0 }; this.chunks.set(key, chunk) }
            if (!before.has(key)) before.set(key, chunk.labels.slice())
            chunk.labels[i] = erase ? 0 : id
            chunk.version++
            this.dirty.add(key)
          }
        }
      }
    }
  }
  finish() {
    if (!this.stroke) return
    const before = this.stroke.before
    this.stroke = null
    if (!before.size) { this.notify(); return }
    const after = new Map([...before.keys()].map(key => [key, this.chunks.get(key).labels.slice()]))
    this.undoStack.push({ before, after, bytes: before.size * CHUNK * CHUNK * 4 })
    this.redoStack = []
    let bytes = this.undoStack.reduce((n, e) => n + e.bytes, 0)
    while (bytes > 32 * 1024 * 1024 && this.undoStack.length > 1) bytes -= this.undoStack.shift().bytes
    this.changed()
  }
  restore(entry, side) {
    if (entry.patches) {
      for (const [key, patch] of entry.patches) {
        const chunk = this.chunks.get(key)
        for (let i = 0; i < patch.indices.length; i++) chunk.labels[patch.indices[i]] = side === 'before' ? 0 : patch.owners[i]
        chunk.version++; this.dirty.add(key)
      }
      this.changed(); return
    }
    for (const [key, labels] of entry[side]) {
      const chunk = this.chunks.get(key)
      chunk.labels.set(labels); chunk.version++; this.dirty.add(key)
    }
    this.changed()
  }
  undo() { const e = this.undoStack.pop(); if (e) { this.redoStack.push(e); this.restore(e, 'before') } }
  applyCoastRepairs(patches) {
    if (!patches.size) return
    let bytes = 0
    for (const [key, patch] of patches) {
      if (!this.chunks.has(key)) this.chunks.set(key, { labels: new Uint16Array(CHUNK * CHUNK), version: 0 })
      bytes += patch.indices.byteLength + patch.owners.byteLength
    }
    const entry = { patches, bytes }
    this.undoStack.push(entry); this.redoStack = []
    let total = this.undoStack.reduce((sum, item) => sum + item.bytes, 0)
    while (total > 32 * 1024 * 1024 && this.undoStack.length > 1) total -= this.undoStack.shift().bytes
    this.restore(entry, 'after')
  }
  redo() { const e = this.redoStack.pop(); if (e) { this.undoStack.push(e); this.restore(e, 'after') } }
  backup() {
    const tiles = []
    for (const [key, { labels }] of [...this.chunks].sort(([a], [b]) => a.localeCompare(b))) {
      const runs = []
      for (let i = 0; i < labels.length;) {
        const id = labels[i], start = i++
        while (i < labels.length && labels[i] === id) i++
        if (id) runs.push([start, i - start, id])
      }
      if (runs.length) tiles.push({ key, runs })
    }
    return { format: 'celestian-map-paint-v1', world: WORLD, regions: this.regions, tiles }
  }
  importBackup(data) {
    if (data?.format !== 'celestian-map-paint-v1' || data.world?.sha !== WORLD.sha || !Array.isArray(data.regions) || !Array.isArray(data.tiles)) throw new Error('备份格式或地图版本不匹配')
    if (!data.regions.length || data.regions.length > 65534 || data.tiles.length > Math.ceil(WORLD.width / CHUNK) * Math.ceil(WORLD.height / CHUNK)) throw new Error('备份内容不完整')
    const ids = new Set()
    const regions = data.regions.map(r => {
      if (!Number.isInteger(r.id) || r.id < 1 || r.id > 65534 || ids.has(r.id) || typeof r.name !== 'string' || !/^#[0-9a-f]{6}$/i.test(r.color)) throw new Error('国家资料无效')
      ids.add(r.id)
      const region = { id: r.id, name: r.name.slice(0, 80), color: r.color }
      if (r.source) region.source = legacySource(r.source)
      if (r.sources) {
        if (!Array.isArray(r.sources) || r.sources.length > 65534) throw new Error('原区域资料无效')
        region.sources = r.sources.map(legacySource)
      }
      if (r.pending === true) region.pending = true
      return region
    })
    const chunks = new Map()
    for (const tile of data.tiles) {
      if (typeof tile.key !== 'string' || !/^\d+,\d+$/.test(tile.key) || !Array.isArray(tile.runs) || chunks.has(tile.key)) throw new Error('涂色数据无效')
      const [x, y] = tile.key.split(',').map(Number)
      if (`${x},${y}` !== tile.key) throw new Error('涂色数据无效')
      if (x >= Math.ceil(WORLD.width / CHUNK) || y >= Math.ceil(WORLD.height / CHUNK)) throw new Error('涂色范围超出地图')
      const labels = new Uint16Array(CHUNK * CHUNK), mask = this.maskForChunk(x, y)
      let end = 0
      for (const run of tile.runs) {
        if (!Array.isArray(run)) throw new Error('涂色数据无效')
        const [start, length, id] = run
        if (!Number.isInteger(start) || !Number.isInteger(length) || start < end || length <= 0 || start + length > labels.length || !ids.has(id)) throw new Error('涂色数据无效')
        end = start + length
        if (mask) for (let i = start; i < end; i++) if (mask[i]) labels[i] = id
      }
      chunks.set(tile.key, { labels, version: 1 })
    }
    for (const key of this.chunks.keys()) if (!chunks.has(key)) chunks.set(key, { labels: new Uint16Array(CHUNK * CHUNK), version: 1 })
    this.regions = regions; this.chunks = chunks; this.dirty = new Set(chunks.keys())
    this.undoStack = []; this.redoStack = []
    this.changed()
  }
}
