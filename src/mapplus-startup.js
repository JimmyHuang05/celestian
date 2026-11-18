import { readPreferences } from './map-ui/preferences.js'
import { MAP_ROOT } from './map-assets.js'
import release from './mapplus-release-data.js'

export const MAPPLUS_PREFERENCES_KEY = 'celestian-mapplus-view-v2'
export const mapPlusReleaseWater = release?.water
export const mapPlusReleasePollution = release?.pollution

const requests = new Map()

function mapPlusJSON(url, priority) {
  if (!requests.has(url)) {
    const request = fetch(url, { priority }).then(response => {
      if (!response.ok) throw new Error(`地图资料加载失败（${response.status}）`)
      return response.json()
    }).catch(error => {
      if (requests.get(url) === request) requests.delete(url)
      throw error
    })
    requests.set(url, request)
  }
  return requests.get(url)
}

export function mapPlusManifest({ fresh = false } = {}) {
  if (release) return Promise.resolve(release.manifest)
  const url = import.meta.env.DEV ? '/__mapplus-paper/manifest.json' : '/mapplus/manifest.json'
  if (fresh) {
    requests.delete(url)
    delete window.__celestianMapPlusManifest
  } else if (!import.meta.env.DEV && !requests.has(url) && window.__celestianMapPlusManifest) {
    const early = window.__celestianMapPlusManifest
    return early.then(metadata => metadata || mapPlusJSON(url))
  }
  return mapPlusJSON(url)
}

export function mapPlusReleasePolitics(priority) {
  if (!release) return null
  return window.__celestianMapPlusPolitics?.then(data => data || mapPlusJSON(release.politics))
    ?? mapPlusJSON(release.politics, priority)
}

export function mapPlusSource(name, legacyRoot = MAP_ROOT) {
  if (import.meta.env.DEV) return fetch(`${legacyRoot}/${name}.json`).then(response => {
    if (!response.ok) throw new Error('地图迁移资料加载失败')
    return response.json()
  })
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
