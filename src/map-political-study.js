const ROOT = '/mapplus/political-study-v2'
import {emptyDraft,validateDraft,vectorSVG} from './political-vector.js'
import {preparePoliticalCoast} from './political-coast.js'
import {countryProfiles} from './political-country-profiles.js'
import {estimateCountries} from './political-country-estimates.js'
import {countryCultureProfile} from './mapplus-culture.js'
import {countryDisplayDraft} from './map-country-display.js'
import {applyLandAreas} from './map-land-area.js'

export async function loadPoliticalStudy(metadata, signal, liveDraft) {
  await preparePoliticalCoast()
  const [geometry, metadataResponse] = await Promise.all([
    liveDraft ? Promise.resolve({ok:true,status:200,json:async()=>liveDraft}) : fetch(`${ROOT}/vector-draft.json`, { signal, cache: 'no-store' }),
    fetch(`${ROOT}/countries.json`, { signal }),
  ])
  if ((!geometry.ok && geometry.status !== 404) || !metadataResponse.ok) throw Error('政区草案暂时无法加载，请重试。')
  const [sourceDraft, payload] = await Promise.all([geometry.status === 404 ? emptyDraft() : geometry.json(), metadataResponse.json()])
  if (payload.coordinateSystemSha256 !== metadata.coordinateSystemSha256) throw Error('政区草案与当前地图坐标不匹配。')
  if (!validateDraft(sourceDraft,new Set(payload.data.map(c=>c.region_id)))) throw Error('疆域数据无效')
  const draft=countryDisplayDraft(sourceDraft)
  const profiles=await countryProfiles(payload.data,signal)
  payload.data=payload.data.map(c=>profiles.find(p=>p.region_id===c.region_id)||c)
  payload.data.push(...(draft.countries||[]).map(c=>({...c,group_id:c.title,is_primary:true})))
  payload.data=payload.data.map(countryCultureProfile)
  const svg = new DOMParser().parseFromString(vectorSVG(draft,payload.data), 'image/svg+xml').documentElement
  if (svg.localName !== 'svg' || svg.getAttribute('viewBox') !== '0 0 2048 1024') throw Error('政区草案几何无效。')
  await estimateCountries(svg,payload.data,draft,metadata.coordinateSystemSha256)
  payload.data=payload.data.map(countryCultureProfile)
  await applyLandAreas(payload.data,draft)
  return [svg, payload.data]
}
