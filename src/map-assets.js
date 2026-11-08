// Basemap artwork may change without changing the land coordinates or drafts.
export const MAP_ROOT = '/map/world-240705-base-v2'
export const MAP_TILE_ROOT = '/map/world-240705-composite-v2'

export async function fetchLegacyRegions(signal, priority) {
  const response = await fetch(`${MAP_ROOT}/legacy-regions.svg`, { signal, priority })
  if (!response.ok) throw new Error('旧分区加载失败，请重试。')
  const svg = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement
  if (svg.localName !== 'svg' || svg.getAttribute('viewBox') !== '0 0 21600 10400') throw new Error('旧分区尺寸不匹配。')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.pointerEvents = 'none'
  return svg
}

export async function fetchMapLabels(signal, priority, root = MAP_ROOT, earlyText) {
  let text = await earlyText
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  if (!text) {
    const response = await fetch(`${root}/labels.svg`, { signal, priority })
    if (!response.ok) throw new Error('地图文字加载失败，请重试。')
    text = await response.text()
  }
  const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement
  if (svg.localName !== 'svg' || svg.getAttribute('viewBox') !== '0 0 21600 10400') throw new Error('地图文字尺寸不匹配。')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.pointerEvents = 'none'
  return svg
}
