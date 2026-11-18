import { readPreferences } from './map-ui/preferences.js'
import { MAP_ROOT } from './map-assets.js'
import release from './mapplus-release-data.js'

export const MAPPLUS_PREFERENCES_KEY = 'celestian-mapplus-view-v2'
export const mapPlusReleaseWater = release?.water
export const mapPlusReleasePollution = release?.pollution

const requests = new Map()

async function readMapPlusJSON(url, priority) {
  const response = await fetch(url, { priority })
  if (!response.ok) throw new Error(`地图资料加载失败（${response.status}）：${url}`)
  const contentType = response.headers.get('content-type') || ''
  if (!/^(?:application|text)\/(?:[\w.+-]+\+)?json(?:\s*;|$)/i.test(contentType)) {
    throw new Error(`地图资料未返回 JSON：${url}`)
  }
  try {
    return await response.json()
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    throw new Error(`地图资料 JSON 格式无效：${url}`, { cause: error })
  }
}

function mapPlusJSON(url, priority) {
  if (!requests.has(url)) {
    const request = readMapPlusJSON(url, priority).catch(error => {
      if (requests.get(url) === request) requests.delete(url)
      throw error
    })
    requests.set(url, request)
  }
  return requests.get(url)
}

export function mapPlusManifest({ fresh = false } = {}) {
  if (release) return Promise.resolve(release.manifest)
  const baseUrl = '/mapplus/manifest.json'
  const url = import.meta.env.DEV ? '/__mapplus-paper/manifest.json' : baseUrl
  if (fresh) {
    requests.delete(url)
    requests.delete(baseUrl)
    delete window.__celestianMapPlusManifest
  } else if (!import.meta.env.DEV && !requests.has(url) && window.__celestianMapPlusManifest) {
    const early = window.__celestianMapPlusManifest
    return early.then(metadata => metadata || mapPlusJSON(url))
  }
  if (import.meta.env.DEV) return mapPlusJSON(url).catch(() => mapPlusJSON(baseUrl))
  return mapPlusJSON(url)
}

export function mapPlusReleasePolitics(priority) {
  if (!release) return null
  return window.__celestianMapPlusPolitics?.then(data => data || mapPlusJSON(release.politics))
    ?? mapPlusJSON(release.politics, priority)
}

export function mapPlusSource(name, legacyRoot = MAP_ROOT) {
  if (import.meta.env.DEV) return readMapPlusJSON(`${legacyRoot}/${name}.json`)
  return mapPlusJSON(`/mapplus/source-v20261113/${name}.json`)
    .catch(() => mapPlusJSON(`${legacyRoot}/${name}.json`))
}

export function mapPlusOverviewUrl(metadata, style, rivers) {
  const grid = metadata.geographicTiles
  if (!grid?.previewUrl) return metadata.compositeImageUrl || metadata.imageUrl
  if (style === 'default' && metadata.terrainPyramid) return metadata.terrainPyramid.previewUrl
  const variant = style === 'default' && grid.baseVariant
    ? grid.baseVariant
    : `${style}-w${rivers !== false && !metadata.vectorLakes ? 1 : 0}-m0`
  return grid.previewUrl.replace('{variant}', variant)
}

let warmed = false
export function warmMapPlus() {
  const connection = navigator.connection
  if (warmed || connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) return
  warmed = true
  const { basemapStyle, layers } = readPreferences(MAPPLUS_PREFERENCES_KEY)
  if (!import.meta.env.DEV) {
    for (const name of ['markers', 'labels-index']) void mapPlusSource(name).catch(() => {})
    void mapPlusReleasePolitics('low')?.catch(() => {})
  }
  void mapPlusManifest().then(metadata => {
    const url = mapPlusOverviewUrl(metadata, basemapStyle, layers.rivers)
    if (!url) return
    const urls = [url, layers.rivers !== false && release?.water.preview, layers.statuses !== false && release?.pollution].filter(Boolean)
    return Promise.all(urls.map(src => {
      const image = new Image()
      image.fetchPriority = 'low'
      image.src = src
      return image.decode()
    }))
  }).catch(() => { warmed = false })
}
