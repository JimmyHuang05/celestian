import { CHUNK, WORLD } from './model.js'

export function downloadFile(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url; link.download = name; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])

// Merge identical horizontal spans vertically. This preserves every assigned
// pixel, including enclaves and holes, without introducing overlapping borders.
export function regionPaths(model) {
  const paths = new Map(model.regions.map(r => [r.id, []]))
  for (const [key, { labels }] of model.chunks) {
    const [cx, cy] = key.split(',').map(Number)
    let previous = new Map()
    const finish = rect => paths.get(rect.id)?.push(`M${cx * CHUNK + rect.x} ${cy * CHUNK + rect.y}h${rect.w}v${rect.h}h-${rect.w}z`)
    for (let y = 0; y <= CHUNK; y++) {
      const next = new Map()
      if (y < CHUNK) for (let x = 0; x < CHUNK;) {
        const id = labels[y * CHUNK + x], start = x++
        while (x < CHUNK && labels[y * CHUNK + x] === id) x++
        if (!id) continue
        const signature = `${id},${start},${x - start}`
        const rect = previous.get(signature) || { id, x: start, y, w: x - start, h: 0 }
        rect.h++
        next.set(signature, rect)
        previous.delete(signature)
      }
      for (const rect of previous.values()) finish(rect)
      previous = next
    }
  }
  return paths
}

export function exportPaintSVG(model, landMarkup) {
  const paths = regionPaths(model)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WORLD.width}" height="${WORLD.height}" viewBox="0 0 ${WORLD.width} ${WORLD.height}"><metadata>${escape(JSON.stringify(model.regions))}</metadata><defs><clipPath id="land-mask">${landMarkup}</clipPath></defs><g clip-path="url(#land-mask)">${model.regions.map(r => `<path id="country-${r.id}"${r.source ? ` data-legacy-region="${escape(r.source.regionId)}"` : ''} data-name="${escape(r.name)}" fill="${r.color}" stroke="none" d="${(paths.get(r.id) || []).join('')}"><title>${escape(r.name)}</title></path>`).join('')}</g></svg>`
}
