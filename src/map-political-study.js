const ROOT = '/mapplus/political-study-v2'
import {emptyDraft,validateDraft,politicalGeometry,politicalSVG} from './political-vector.js'
import {preparePoliticalCoast} from './political-coast.js'
import {countryProfiles} from './political-country-profiles.js'
import {countryDemography,estimateCountries} from './political-country-estimates.js'
import {countryCultureProfile} from './mapplus-culture.js'
import {countryDisplayDraft} from './map-country-display.js'
import {applyLandAreas} from './map-land-area.js'

export async function loadPoliticalStudy(metadata, signal, liveDraft) {
  const [sourceDraft, {payload, profiles}, model] = await Promise.all([
    liveDraft || fetch(`${ROOT}/vector-draft.json`, { signal, cache: 'no-store', priority: 'low' }).then(response => {
      if (response.status === 404) return emptyDraft()
      if (!response.ok) throw Error('政区草案暂时无法加载，请重试。')
      return response.json()
    }),
    fetch(`${ROOT}/countries.json`, { signal }).then(async response => {
      if (!response.ok) throw Error('政区资料暂时无法加载，请重试。')
      const payload = await response.json()
      return {payload, profiles: await countryProfiles(payload.data, signal)}
    }),
    countryDemography(),
    preparePoliticalCoast(),
  ])
  signal?.throwIfAborted()
  const [markup, records] = await compilePoliticalStudy(metadata, sourceDraft, payload, profiles, model)
  return [parsePoliticalSVG(markup), records]
}

export async function compilePoliticalStudy(metadata, sourceDraft, payload, profiles, model, compact = false) {
  if (payload.coordinateSystemSha256 !== metadata.coordinateSystemSha256) throw Error('政区草案与当前地图坐标不匹配。')
  if (!validateDraft(sourceDraft,new Set(payload.data.map(c=>c.region_id)))) throw Error('疆域数据无效')
  const draft=countryDisplayDraft(sourceDraft)
  const records=payload.data.map(c=>profiles.find(p=>p.region_id===c.region_id)||c)
  records.push(...(draft.countries||[]).map(c=>({...c,group_id:c.title,is_primary:true})))
  const rows=records.map(countryCultureProfile)
  const geometry=politicalGeometry(draft,rows)
  estimateCountries(geometry,rows,draft,metadata.coordinateSystemSha256,model)
  const enriched=rows.map(countryCultureProfile)
  await applyLandAreas(enriched,draft)
  return [politicalSVG(geometry,compact), enriched]
}

export function parsePoliticalSVG(markup) {
  const svg = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement
  if (svg.localName !== 'svg' || svg.getAttribute('viewBox') !== '0 0 2048 1024') throw Error('政区草案几何无效。')
  return svg
}
