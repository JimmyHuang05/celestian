import { ETHER_TIDE_SITES } from './studies/ether-tide-artwork.js'
import { mapPlusLandmarks } from './map-landmarks.js'
import { pollutionCoreReports } from './map-pollution-reports.js'

const names = {
  'north-west': ['外卡申海', 'Outer Kashan Sea'],
  'western-mountains': ['塔特里亚', 'Tatria'],
  'far-north-east': ['普罗维登提亚', 'Providentia'],
  'eastern-bay': ['大湖', 'Great Lake'],
  'orthys-ocean': ['俄提斯洋', 'Orthys Ocean'],
  'proerth-ocean': ['东南风暴洋', 'Southeastern Procellan Ocean'],
  'southern-islands': ['南方群岛', 'Southern Isles'],
  'southern-ice': ['南方冰原', 'Southern Icefield'],
  'monte-sombra': ['蒙特索姆布拉火山口', 'Monte Sombra Crater'],
}
const offshore = new Set(['orthys-ocean', 'proerth-ocean'])
const highPressureSites = new Set(['western-mountains', 'eastern-bay', 'southern-islands'])
const beyondScaleSites = new Set(['proerth-ocean', 'southern-ice', 'far-north-east'])
const outbreakYears = {
  'western-mountains': 1814,
  'eastern-bay': 1815,
  'far-north-east': 1816,
  'monte-sombra': 1814,
}
// 1818 dossier estimates. Mapped land figures use the atlas area scale.
// Casualties are scenario estimates of deaths and injuries, excluding missing people.
const hazards = {
  'north-west': { land: '约 2,800,000 平方公里', casualties: '约 70–120 万人' },
  'western-mountains': { land: '约 5,900,000 平方公里', casualties: '约 450–700 万人' },
  'eastern-bay': { land: '约 2,800,000 平方公里', casualties: '约 250–430 万人' },
  'far-north-east': { land: '约 830,000 平方公里', casualties: '约 30–55 万人' },
  'orthys-ocean': { land: '约 830,000 平方公里', casualties: '约 35–70 万人' },
  'proerth-ocean': { land: '暂无确认受污染陆地', casualties: '约 8 千–2 万人' },
  'southern-islands': { land: '推估 120,000–250,000 平方公里', casualties: '约 14–30 万人' },
  'southern-ice': { land: '推估 400,000–900,000 平方公里', casualties: '约 800–2,000 人' },
  'monte-sombra': { land: '约 560,000 平方公里（灰岛全境）', casualties: '约 12–25 万人' },
}
const [volcanoY, volcanoX] = mapPlusLandmarks.find(row => row.id === 'landmark-ash-island-volcano').position
const sites = [...ETHER_TIDE_SITES, { id: 'monte-sombra', x: volcanoX, y: -volcanoY }]

export const pollutionCoreMarkers = sites.map(({ id, x, y }) => ({
  id: `pollution-core-${id}`,
  title: `${names[id][0]}污染原点`,
  foreign_title: `${names[id][1]} Pollution Origin`,
  type: '污染原点',
  lat: (1 - y / 1024) * 5200,
  lng: x / 2048 * 10800,
  pollutionCore: { year: outbreakYears[id] ?? 1813, event: '第二次以太潮汐', level: highPressureSites.has(id) ? 4 : 5, beyondScale: beyondScaleSites.has(id), x, y, timeline: pollutionCoreReports[id], hazard: hazards[id] },
  description: id === 'monte-sombra' ? '1813 年，灰岛全境沦陷，灰岛港亦告失守。1814 年，蒙特索姆布拉火山口污染原点爆发。' : offshore.has(id)
    ? '爆发点位于外海。红点标示潮汐爆发的位置。'
    : '周围陆地的污染范围见地图上的红褐色晕染。',
}))
