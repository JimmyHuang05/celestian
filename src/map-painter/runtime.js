import { CHUNK, WORLD, PainterModel } from './model.js'
import { openPaintDatabase, readPaint, writePaint } from './storage.js'
import { downloadFile, exportPaintSVG } from './export.js'
import { MAP_ROOT as ROOT, fetchMapLabels, fetchLegacyRegions } from '../map-assets.js'
import { consolidateCountries, remapOwnership } from './countries.js'
import { loadCurrent, importCurrent } from './current.js'
import { collectCoastRepairs } from './coast-repair.js'
import { paintTexture } from './paint-texture.js'
import { assignEditorColors } from './editor-colors.js'

const makeCanvas = () => { const c = document.createElement('canvas'); c.width = c.height = CHUNK; return c }

export class PaintRuntime {
  constructor(container, notify) {
    this.container = container; this.notify = notify
    const requested = new URLSearchParams(location.search).get('project')
    this.project = ['legacy', 'countries', 'default'].includes(requested) ? requested : 'current'
    this.abort = new AbortController()
    this.tool = 'paint'; this.selected = 1; this.size = 32
    this.savedRevision = 0; this.saveStatus = '正在准备…'
    this.masks = new Map(); this.coverages = new Map(); this.images = new Map()
    this.imageBytes = 0
    this.listeners = []; this.destroyed = false
    this.model = new PainterModel((x, y) => this.landMask(x, y), () => this.changed())
  }
  on(target, event, fn, options) { target.addEventListener(event, fn, options); this.listeners.push(() => target.removeEventListener(event, fn, options)) }
  async open() {
    if (navigator.locks) {
      await new Promise((resolve, reject) => {
        navigator.locks.request(this.project === 'default' ? 'celestian-map-paint-writer' : `celestian-map-paint-writer-${this.project}`, { ifAvailable: true }, async lock => {
          if (!lock) { reject(new Error('编辑器已在另一个标签页打开，请先关闭它。')); return }
          await new Promise(release => { this.releaseLock = release; resolve() })
        }).catch(reject)
      })
    }
    if (this.destroyed) { this.releaseLock?.(); return }
    const [meta, text, labelsSVG] = await Promise.all([
      fetch(`${ROOT}/manifest.json`, { signal: this.abort.signal }).then(r => { if (!r.ok) throw Error('底图加载失败'); return r.json() }),
      fetch(`${ROOT}/land.svg`, { signal: this.abort.signal }).then(r => { if (!r.ok) throw Error('陆地蒙版加载失败'); return r.text() }),
      fetchMapLabels(this.abort.signal),
    ])
    if (this.destroyed) return
    if (this.project === 'countries' && !this.model.chunks.size && !this.model.revision && this.saveStatus !== '已恢复本机草稿') {
      this.saveStatus = '正在整理国家，保留原分区备份…'; this.emit()
      const sourceDB = await openPaintDatabase('legacy')
      let original
      try { original = await readPaint(sourceDB) } finally { sourceDB.close() }
      if (this.destroyed) return
      if (original.meta) {
        if (original.meta.sha !== WORLD.sha) throw Error('原分区坐标不匹配')
        this.model.regions = original.meta.regions
        for (const [key, labels] of original.chunks) this.model.chunks.set(key, { labels: new Uint16Array(labels), version: 1 })
      } else {
        const response = await fetch(`${ROOT}/legacy-editable.json`, { signal: this.abort.signal })
        if (!response.ok) throw Error('原分区加载失败')
        const draft = await response.json()
        if (this.destroyed) return
        this.model.importBackup(draft)
      }
      const result = consolidateCountries(this.model.regions)
      this.model.regions = result.regions; this.mergeSummary = result.summary
      remapOwnership(this.model.chunks, result.mapping)
      this.model.dirty = new Set(this.model.chunks.keys())
      this.model.changed()
    }
    if ((meta.coordinateSystemSha256 || meta.sourceSha256) !== WORLD.sha) throw Error('地图版本不匹配')
    const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement
    if (svg.localName !== 'svg' || svg.getAttribute('viewBox') !== `0 0 ${WORLD.width} ${WORLD.height}`) throw Error('陆地蒙版尺寸不匹配')
    this.landMarkup = svg.innerHTML
    this.land = new Path2D()
    for (const path of svg.querySelectorAll('path')) {
      const matrix = path.transform.baseVal.consolidate()?.matrix
      this.land.addPath(new Path2D(path.getAttribute('d')), matrix ? new DOMMatrix([matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f]) : new DOMMatrix())
    }
    const current = this.project === 'current' ? await loadCurrent(this.abort.signal) : null
    try {
      this.db = await openPaintDatabase(current ? `current-${current.version}` : this.project)
      const saved = await readPaint(this.db)
      if (this.destroyed) { this.db.close(); return }
      if (saved.meta) {
        if (saved.meta.sha !== WORLD.sha) throw Error('本机草稿地图版本不匹配')
        this.model.regions = saved.meta.regions
        this.mergeSummary = saved.meta.mergeSummary
        for (const [key, labels] of saved.chunks) this.model.chunks.set(key, { labels: new Uint16Array(labels), version: 1 })
      }
      this.saveStatus = saved.meta ? '已恢复本机草稿' : '自动保存在本机'
    } catch (error) {
      this.saveStatus = `${error.message}，请下载备份`
      this.db?.close(); this.db = null
    }
    if (this.destroyed) return
    if (current && this.saveStatus !== '已恢复本机草稿') {
      this.saveStatus = '正在载入前台分区与资料…'; this.emit()
      await importCurrent(this, current)
      if (this.destroyed) return
      await this.save()
      this.saveStatus = '已载入当前前台分区'
    }
    if (this.project === 'legacy' && !this.model.chunks.size && !this.model.revision) {
      // This project has its own database. Never replace the user's normal draft.
      const hasSavedProject = this.saveStatus === '已恢复本机草稿'
      if (!hasSavedProject) {
        this.saveStatus = '正在迁入旧区域与资料…'; this.emit()
        const response = await fetch(`${ROOT}/legacy-editable.json`, { signal: this.abort.signal })
        if (!response.ok) throw new Error('旧区域草稿加载失败，请重试。')
        const draft = await response.json()
        if (this.destroyed) return
        await new Promise(resolve => setTimeout(resolve, 0))
        if (this.destroyed) return
        this.model.importBackup(draft)
        this.saveStatus = this.db ? '旧区域已迁入，正在保存…' : '旧区域已迁入，请下载备份'
      }
    }
    const L = window.L
    assignEditorColors(this.model)
    this.model.changed()
    if (!L) throw Error('地图组件加载失败，请刷新重试')
    this.scale = 2 ** meta.maxZoom
    this.bounds = L.latLngBounds([[-WORLD.height / this.scale, 0], [0, WORLD.width / this.scale]])
    this.map = L.map(this.container, { crs: L.CRS.Simple, zoomControl: false, attributionControl: false, minZoom: 0, maxZoom: meta.maxZoom, zoomSnap: .25, zoomDelta: .5, maxBounds: this.bounds, maxBoundsViscosity: 1, zoomAnimation: false, fadeAnimation: false, inertia: false })
    this.map.fitBounds(this.bounds, { animate: false })
    L.tileLayer(`${ROOT}/{z}/{x}/{y}.webp`, { tileSize: meta.tileSize, minZoom: 0, maxZoom: meta.maxZoom, bounds: this.bounds, noWrap: true, keepBuffer: 1, updateWhenIdle: true, updateWhenZooming: false }).addTo(this.map)
    this.map.dragging.disable(); this.map.doubleClickZoom.disable(); this.map.boxZoom.disable()
    this.canvas = document.createElement('canvas'); this.canvas.className = 'paint-surface'; this.canvas.setAttribute('aria-label', '在陆地上涂色')
    this.container.append(this.canvas)
    this.labelsSVG = labelsSVG
    this.labelsSVG.classList.add('paint-labels-svg')
    this.labelHost = document.createElement('div'); this.labelHost.className = 'paint-labels'
    this.labelHost.append(this.labelsSVG); this.container.append(this.labelHost)
    this.cursor = document.createElement('div'); this.cursor.className = 'paint-cursor'; this.container.append(this.cursor)
    // All viewport overlays update in the same event as Leaflet's tile transform.
    // Do not defer their camera position by one animation frame.
    this.map.on('move zoom resize', () => this.redraw(true))
    this.observer = new ResizeObserver(() => { this.end(); this.map.invalidateSize(); this.redraw() })
    this.observer.observe(this.container)
    this.bindInput()
    this.selected = this.model.regions[0].id
    this.ready = true; this.emit(); this.redraw()
  }
  landCoverage(x, y) {
    const key = `${x},${y}`
    if (this.coverages.has(key)) { const value = this.coverages.get(key); this.coverages.delete(key); this.coverages.set(key, value); return value }
    const canvas = makeCanvas(), ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.translate(-x * CHUNK, -y * CHUNK); ctx.fill(this.land)
    const rgba = ctx.getImageData(0, 0, CHUNK, CHUNK).data, alpha = new Uint8Array(CHUNK * CHUNK)
    for (let i = 0; i < alpha.length; i++) {
      if (x >= 0 && y >= 0 && x * CHUNK + i % CHUNK < WORLD.width && y * CHUNK + Math.floor(i / CHUNK) < WORLD.height) alpha[i] = rgba[i * 4 + 3]
    }
    this.coverages.set(key, alpha)
    if (this.coverages.size > 256) this.coverages.delete(this.coverages.keys().next().value)
    return alpha
  }
  landMask(x, y) {
    const key = `${x},${y}`
    if (this.masks.has(key)) { const value = this.masks.get(key); this.masks.delete(key); this.masks.set(key, value); return value }
    const alpha = this.landCoverage(x, y), mask = new Uint8Array(CHUNK * CHUNK)
    let hasLand = false
    for (let i = 0; i < mask.length; i++) {
      if (alpha[i] >= 128) { mask[i] = 1; hasLand = true }
    }
    const result = hasLand ? mask : null
    this.masks.set(key, result)
    if (this.masks.size > 256) this.masks.delete(this.masks.keys().next().value)
    return result
  }
  emit() {
    if (!this.destroyed) this.notify({ ready: !!this.ready, legacyProject: this.project === 'legacy', countryProject: this.project === 'countries', mergeSummary: this.mergeSummary, regions: this.model.regions.map(r => ({ ...r })), selected: this.selected, undo: !!this.model.undoStack.length, redo: !!this.model.redoStack.length, saveStatus: this.saveStatus })
  }
  changed() {
    this.redraw()
    this.saveStatus = this.db ? '正在保存…' : '未自动保存，请下载备份'
    this.emit(); clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => this.save(), 650)
  }
  async save() {
    if (!this.db || this.savedRevision === this.model.revision) return
    if (this.saving) { this.saveAgain = true; return this.saving }
    const revision = this.model.revision
    const chunks = [...this.model.dirty].map(key => { const c = this.model.chunks.get(key); return [key, { labels: c.labels.slice(), version: c.version, source: c }] })
    const meta = { sha: WORLD.sha, regions: this.model.regions.map(r => ({ ...r })) }
    if (this.mergeSummary) meta.mergeSummary = this.mergeSummary
    this.saving = writePaint(this.db, meta, chunks).then(() => {
      for (const [key, c] of chunks) if (this.model.chunks.get(key) === c.source && c.source.version === c.version) this.model.dirty.delete(key)
      this.savedRevision = revision
      this.saveStatus = revision === this.model.revision ? '已自动保存到本机' : '正在保存…'
    }).catch(() => { this.saveStatus = '本机保存失败，请下载备份' }).finally(() => {
      this.saving = null; this.emit()
      if (this.saveAgain) { this.saveAgain = false; this.save() }
    })
    return this.saving
  }
  imageFor(key, chunk, resolution = CHUNK, ratio = 1) {
    const paletteKey = this.model.regions.map(r => r.color).join(',')
    const [cx, cy] = key.split(',').map(Number)
    const feather = Math.max(1, Math.round(.8 / ratio)), step = CHUNK / resolution
    const halo = Math.max(Math.ceil(feather), step) + 2, width = CHUNK + 2 * halo
    const neighbors = []
    for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) neighbors.push(this.model.chunks.get(`${x},${y}`)?.version || 0)
    const signature = `${resolution}:${feather}:${neighbors.join(',')}:${paletteKey}`
    const cached = this.images.get(key)
    if (cached?.signature === signature && cached.source === chunk) { this.images.delete(key); this.images.set(key, cached); return cached.canvas }
    const canvas = cached?.canvas || makeCanvas(), ctx = canvas.getContext('2d')
    if (cached) this.imageBytes -= canvas.width * canvas.height * 4
    canvas.width = canvas.height = resolution + 2
    const labels = new Uint16Array(width * width), coverage = new Uint8Array(width * width)
    const x0 = cx * CHUNK - halo, y0 = cy * CHUNK - halo
    for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) {
      if (x < 0 || y < 0 || x * CHUNK >= WORLD.width || y * CHUNK >= WORLD.height) continue
      const alpha = this.landCoverage(x, y), source = this.model.chunks.get(`${x},${y}`)?.labels
      const left = Math.max(x0, x * CHUNK), right = Math.min(x0 + width, (x + 1) * CHUNK)
      for (let py = Math.max(y0, y * CHUNK); py < Math.min(y0 + width, (y + 1) * CHUNK); py++) {
        const from = (py - y * CHUNK) * CHUNK + left - x * CHUNK, to = (py - y0) * width + left - x0
        coverage.set(alpha.subarray(from, from + right - left), to)
        if (source) labels.set(source.subarray(from, from + right - left), to)
      }
    }
    const palette = new Map(this.model.regions.map(r => [r.id, [parseInt(r.color.slice(1, 3), 16), parseInt(r.color.slice(3, 5), 16), parseInt(r.color.slice(5, 7), 16)]]))
    ctx.putImageData(new ImageData(paintTexture(labels, coverage, width, halo, resolution, feather, palette), resolution + 2, resolution + 2), 0, 0)
    this.images.delete(key); this.images.set(key, { canvas, signature, source: chunk })
    this.imageBytes += canvas.width * canvas.height * 4
    while (this.imageBytes > 32 * 1024 * 1024 && this.images.size > 1) {
      const first = this.images.keys().next().value, old = this.images.get(first).canvas
      this.imageBytes -= old.width * old.height * 4; this.images.delete(first)
    }
    return canvas
  }
  redraw(immediate = false) {
    if (!this.canvas || this.destroyed) return
    if (immediate && this.frame) { cancelAnimationFrame(this.frame); this.frame = null }
    if (this.frame) return
    const draw = () => {
      this.frame = null
      const size = this.map.getSize(), dpr = Math.min(2, devicePixelRatio || 1)
      if (this.canvas.width !== Math.round(size.x * dpr) || this.canvas.height !== Math.round(size.y * dpr)) { this.canvas.width = Math.round(size.x * dpr); this.canvas.height = Math.round(size.y * dpr) }
      const ctx = this.canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size.x, size.y)
      const origin = this.map.latLngToContainerPoint([0, 0]), ratio = 2 ** this.map.getZoom() / this.scale
      for (const svg of [this.labelsSVG, this.legacySVG].filter(Boolean)) Object.assign(svg.style, { width: `${WORLD.width * ratio}px`, height: `${WORLD.height * ratio}px`, transform: `translate(${origin.x}px,${origin.y}px)` })
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      for (const [key, chunk] of this.model.chunks) {
        const [cx, cy] = key.split(',').map(Number), x = origin.x + cx * CHUNK * ratio, y = origin.y + cy * CHUNK * ratio, side = CHUNK * ratio
        if (x > size.x || y > size.y || x + side < 0 || y + side < 0) continue
        const left = Math.round(x * dpr) / dpr, top = Math.round(y * dpr) / dpr
        const right = Math.round((x + side) * dpr) / dpr, bottom = Math.round((y + side) * dpr) / dpr
        const resolution = Math.min(CHUNK, Math.max(8, 2 ** Math.ceil(Math.log2(side * dpr))))
        ctx.drawImage(this.imageFor(key, chunk, resolution, ratio), 1, 1, resolution, resolution, left, top, right - left, bottom - top)
      }
    }
    if (immediate) draw()
    else this.frame = requestAnimationFrame(draw)
  }
  setTool(tool) {
    this.end(); this.tool = tool
    const move = tool === 'move'
    if (move) this.map.dragging.enable(); else this.map.dragging.disable()
    this.canvas.style.pointerEvents = move ? 'none' : 'auto'
    this.cursor.style.display = 'none'
  }
  setLabelsVisible(visible) { this.labelHost.style.display = visible ? '' : 'none' }
  async setLegacyVisible(visible) {
    if (visible && !this.legacySVG) {
      const svg = await fetchLegacyRegions(this.abort.signal)
      if (this.destroyed) return
      this.legacySVG = svg; svg.classList.add('paint-labels-svg')
      this.legacyHost = document.createElement('div'); this.legacyHost.className = 'paint-legacy-regions'
      this.legacyHost.append(svg); this.container.append(this.legacyHost)
      this.redraw()
    }
    if (this.legacyHost) this.legacyHost.style.display = visible ? '' : 'none'
  }
  point(event) {
    const rect = this.container.getBoundingClientRect(), screen = [event.clientX - rect.left, event.clientY - rect.top]
    const ll = this.map.containerPointToLatLng(screen)
    return { x: ll.lng * this.scale, y: -ll.lat * this.scale, radius: this.size / 2 * this.scale / 2 ** this.map.getZoom(), screen }
  }
  pickRegion(event) {
    const p = this.point(event), x = Math.floor(p.x), y = Math.floor(p.y)
    if (x < 0 || y < 0 || x >= WORLD.width || y >= WORLD.height) return
    const chunk = this.model.chunks.get(`${Math.floor(x / CHUNK)},${Math.floor(y / CHUNK)}`)
    const id = chunk?.labels[(y % CHUNK) * CHUNK + x % CHUNK]
    if (!id || !this.model.regions.some(r => r.id === id)) return
    this.selected = id
    this.setTool('paint'); this.emit()
    this.onPicked?.()
  }
  bindInput() {
    const displayCursor = event => {
      const p = this.point(event)
      if (this.tool === 'pick' || event.altKey) { this.cursor.style.display = 'none'; return p }
      const erase = this.model.stroke?.erase || (event.buttons & 2) || (event.pointerType === 'touch' && this.tool === 'erase')
      Object.assign(this.cursor.style, { display: 'block', left: `${p.screen[0]}px`, top: `${p.screen[1]}px`, width: `${this.size}px`, height: `${this.size}px`, borderColor: erase ? '#fff' : this.model.regions.find(r => r.id === this.selected)?.color })
      return p
    }
    this.on(this.container, 'contextmenu', event => { event.preventDefault() })
    this.on(this.container, 'auxclick', event => { if (event.button === 1) event.preventDefault() })
    this.on(this.container, 'mousedown', event => { if (event.button === 1) event.preventDefault() }, true)
    this.on(this.container, 'pointerdown', event => {
      if (this.busy || this.pointer !== undefined || ![0, 1, 2].includes(event.button)) return
      if (event.pointerType === 'touch' && this.tool === 'move') return
      event.preventDefault(); event.stopPropagation()
      if (event.button === 0 && (this.tool === 'pick' || event.altKey)) { this.pickRegion(event); return }
      this.container.setPointerCapture(event.pointerId); this.pointer = event.pointerId
      if (event.button === 1) {
        this.panGesture = { x: event.clientX, y: event.clientY }
        this.cursor.style.display = 'none'
        this.container.classList.add('paint-is-panning')
        return
      }
      this.strokeButton = event.button === 2 ? 2 : 1
      this.model.begin(this.selected, event.button === 2 || (event.pointerType === 'touch' && this.tool === 'erase'))
      this.previous = displayCursor(event)
      this.model.stamp(this.previous.x, this.previous.y, this.previous.radius); this.redraw()
    }, true)
    this.on(this.container, 'pointermove', event => {
      if (this.panGesture && this.pointer === event.pointerId) {
        if (!(event.buttons & 4)) { this.end(); return }
        event.preventDefault(); event.stopPropagation()
        this.map.panBy([this.panGesture.x - event.clientX, this.panGesture.y - event.clientY], { animate: false })
        this.panGesture = { x: event.clientX, y: event.clientY }
        return
      }
      if (event.pointerType === 'touch' && this.tool === 'move') return
      if (this.pointer === event.pointerId && !(event.buttons & this.strokeButton)) { this.end(); return }
      const point = displayCursor(event)
      if (this.pointer !== event.pointerId || !this.model.stroke) return
      const previous = this.previous, distance = Math.hypot(point.x - previous.x, point.y - previous.y)
      const steps = Math.max(1, Math.ceil(distance / Math.max(1, point.radius / 2)))
      for (let i = 1; i <= steps; i++) this.model.stamp(previous.x + (point.x - previous.x) * i / steps, previous.y + (point.y - previous.y) * i / steps, point.radius)
      this.previous = point; this.redraw()
    }, true)
    this.on(this.container, 'pointerup', event => { if (this.pointer === event.pointerId) this.end() }, true)
    this.on(this.container, 'pointercancel', event => { if (this.pointer === event.pointerId) this.end() }, true)
    this.on(this.container, 'lostpointercapture', event => { if (this.pointer === event.pointerId) this.end() }, true)
    this.on(this.container, 'pointerleave', () => { this.cursor.style.display = 'none' })
    this.on(window, 'blur', () => this.end())
    this.on(window, 'beforeunload', event => {
      if (this.savedRevision !== this.model.revision || this.model.stroke?.before.size) { event.preventDefault(); event.returnValue = '' }
    })
    this.on(window, 'keydown', event => {
      if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.closest('[role="dialog"]') || !this.ready || this.busy) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); this.end(); if (event.shiftKey) this.model.redo(); else this.model.undo() }
    })
    this.map.on('zoomstart', () => this.end())
  }
  end() {
    if (this.pointer !== undefined) {
      const pointer = this.pointer; this.pointer = undefined
      if (this.container.hasPointerCapture(pointer)) this.container.releasePointerCapture(pointer)
    }
    this.panGesture = null; this.strokeButton = null
    this.container.classList.remove('paint-is-panning')
    this.model.finish(); this.previous = null
  }
  backup() { this.end(); downloadFile(JSON.stringify(this.model.backup()), '海陆图志-涂色备份.json', 'application/json') }
  async repairCoasts() {
    if (this.busy) return
    this.end(); this.busy = true
    try {
      await this.save()
      const result = await collectCoastRepairs(this.model, {
        cancelled: () => this.destroyed,
        progress: (done, total) => { this.saveStatus = `正在检查海岸… ${Math.round(done / total * 100)}%`; this.emit() },
      })
      if (this.destroyed) return
      this.model.applyCoastRepairs(result.patches)
      await this.save()
      return result.pixels ? `已为 ${result.regions} 个区域补齐 ${result.pixels.toLocaleString()} 个海岸漏点，可撤销。` : '未发现可安全补齐的海岸漏点。'
    } finally { this.busy = false; if (!this.destroyed) { this.saveStatus = this.db ? '已自动保存到本机' : '请下载备份'; this.emit() } }
  }
  exportSVG() { this.end(); downloadFile(exportPaintSVG(this.model, this.landMarkup), '海陆图志-国家区域.svg', 'image/svg+xml') }
  async importFile(file) {
    if (!file) return
    if (file.size > 100 * 1024 * 1024) throw Error('备份文件过大')
    this.end()
    const data = JSON.parse(await file.text())
    this.model.importBackup(data); assignEditorColors(this.model); this.model.changed(); this.images.clear(); this.imageBytes = 0; this.selected = this.model.regions[0].id; this.emit(); this.redraw()
  }
  destroy() {
    this.end(); clearTimeout(this.saveTimer); this.destroyed = true
    this.abort.abort(); this.listeners.forEach(remove => remove()); this.observer?.disconnect()
    cancelAnimationFrame(this.frame); this.map?.off(); this.map?.remove(); this.canvas?.remove(); this.cursor?.remove(); this.labelHost?.remove(); this.legacyHost?.remove()
    // Flush the last completed stroke before closing persistence and releasing the writer lock.
    Promise.resolve(this.save()).then(async () => { if (this.saving) await this.saving; this.db?.close(); this.releaseLock?.() })
  }
}
