import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { BASEMAP_STYLES } from '../src/map-ui/basemap-styles.js'

const encoder = fileURLToPath(new URL('./build-mapplus-paper.py', import.meta.url))
const publicRoot = new URL('../public/', import.meta.url)
const sourcePath = url => url.slice(1)
const substitute = (url, values) => url.replace(/\{(\w+)\}/g, (_, key) => values[key])

export function paperJobs(manifest) {
  const jobs = new Map()
  const add = (url, x, y, w, h, ocean = false) => {
    const name = sourcePath(url)
    jobs.set(name, [name, x, y, w, h, ocean])
  }
  const { terrainPyramid: pyramid, geographicTiles: grid } = manifest
  const overview = (url, ocean) => {
    // Read WebP dimensions in Pillow by using the source size for an overview.
    add(url, 0, 0, null, null, ocean)
  }
  if (pyramid) {
    overview(pyramid.previewUrl, true)
    for (let z = pyramid.minZoom; z <= pyramid.maxZoom; z++) {
      const scale = 2 ** (pyramid.maxZoom - z), w = pyramid.width / scale, h = w * manifest.height / manifest.width
      const size = pyramid.tileSize
      for (let x = 0; x < Math.ceil(w / size); x++) for (let y = 0; y < Math.ceil(h / size); y++) {
        add(substitute(pyramid.url, { z, x, y }), x * size, y * size, w, h, true)
      }
    }
  }
  for (const { id } of BASEMAP_STYLES) {
    if (id === 'default' && pyramid) continue
    const variants = id === 'default' && grid.baseVariant ? [grid.baseVariant]
      : [`${id}-w0-m0`, ...(!manifest.vectorLakes ? [`${id}-w1-m0`] : [])]
    for (const variant of variants) {
      const ocean = id === 'default'
      overview(substitute(grid.previewUrl, { variant }), ocean)
      const { sourceWidth: w, sourceHeight: h, bleedPixels: bleed, columns, rows } = grid
      for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
        add(substitute(grid.url, { variant, row, col }), Math.max(0, Math.round(col * w / columns) - bleed),
          Math.max(0, Math.round(row * h / rows) - bleed), w, h, ocean)
      }
    }
  }
  return jobs
}

export function bakePaper(jobs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.MAPPLUS_PYTHON || 'python', [encoder, fileURLToPath(publicRoot)], { stdio: ['pipe', 'pipe', 'inherit'] })
    const images = new Map()
    child.on('error', reject)
    child.stdin.on('error', reject)
    createInterface({ input: child.stdout }).on('line', line => {
      try {
        const [name, data] = JSON.parse(line)
        images.set(name, Buffer.from(data, 'base64'))
      } catch (error) { reject(error) }
    })
    child.on('close', code => code === 0 && images.size === jobs.length
      ? resolve(images) : reject(new Error('MapPlus paper bake failed. Check Python, Pillow, and the source tiles.')))
    child.stdin.end(JSON.stringify(jobs))
  })
}

export function paperManifest(manifest, urlPrefix) {
  const rewrite = source => urlPrefix + sourcePath(source)
  const grid = manifest.geographicTiles
  const pyramid = manifest.terrainPyramid
  return {
    ...manifest,
    bakedPaper: true,
    geographicTiles: { ...grid, url: rewrite(grid.url), previewUrl: rewrite(grid.previewUrl) },
    ...(pyramid && { terrainPyramid: { ...pyramid, url: rewrite(pyramid.url), previewUrl: rewrite(pyramid.previewUrl) } }),
  }
}

export async function emitPaper(manifest, emit) {
  const files = await bakePaper([...paperJobs(manifest).values()])
  const hash = createHash('sha256')
  for (const [name, bytes] of files) hash.update(name).update(bytes)
  const prefix = `assets/mapplus-paper-${hash.digest('hex').slice(0, 16)}/`
  for (const [name, source] of files) emit({ type: 'asset', fileName: prefix + name, source })
  return paperManifest(manifest, '/' + prefix)
}

export function serveMapPlusPaper(server, manifestUrl) {
  const prefix = '/__mapplus-paper/'
  const cache = new Map(), pending = new Map(), completed = new Set()
  let manifest, jobs
  let timer, baking = false
  function schedule() {
    if (timer || baking || !pending.size) return
    timer = setTimeout(async () => {
      timer = null
      baking = true
      const batch = [...pending.values()]
      pending.clear()
      try {
        const images = await bakePaper(batch.map(item => item.job))
        for (const { job, resolve } of batch) resolve(images.get(job[0]))
      } catch (error) {
        for (const { reject } of batch) reject(error)
      } finally {
        baking = false
        schedule()
      }
    }, 10)
  }

  server.middlewares.use((request, response, next) => {
    const path = request.url?.split('?')[0]
    if (!path?.startsWith(prefix) || !['GET', 'HEAD'].includes(request.method)) return next()
    if (!manifest || path === prefix + 'manifest.json') {
      manifest = JSON.parse(readFileSync(manifestUrl, 'utf8'))
      jobs = paperJobs(manifest)
    }
    if (path === prefix + 'manifest.json') {
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify(paperManifest(manifest, prefix)))
      return
    }
    const name = path.slice(prefix.length)
    if (!jobs.has(name)) { response.statusCode = 404; response.end(); return }
    if (!cache.has(name)) {
      const result = new Promise((resolve, reject) => {
        pending.set(name, { job: jobs.get(name), resolve, reject })
        schedule()
      })
      cache.set(name, result)
      result.then(() => {
        completed.add(name)
        if (completed.size > 96) {
          const oldest = completed.values().next().value
          completed.delete(oldest)
          cache.delete(oldest)
        }
      }, () => { cache.delete(name) })
    }
    cache.get(name).then(image => {
      response.setHeader('Content-Type', 'image/webp')
      response.end(image)
    }, error => {
      server.config.logger.error(error.message)
      response.statusCode = 500
      response.end()
    })
  })
}
