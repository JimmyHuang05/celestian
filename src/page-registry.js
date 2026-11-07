// One entry defines a page's identity, addresses, music and navigation policy.
export const pages = [
  { id: 'home', title: '百科全书', path: '/', music: 'encyclopedia', kind: 'react' },
  { id: 'encyclopedia', title: '百科全书', path: '/encyclopedia', descendants: true, music: 'encyclopedia', kind: 'react' },
  { id: 'map', title: '世界地图', path: '/map', kind: 'react', music: 'home' },
  { id: 'characters', title: '众生录 · 人物档案', path: '/character-profile.html', kind: 'standalone', music: 'inherit', embedded: true },
  { id: 'factions', title: '势力档案', path: '/faction-profile.html', kind: 'standalone', music: 'inherit', embedded: true },
  { id: 'eternal-astrology', title: '永恒不灭的占星会', affiliation: '独立势力', path: '/factions/eternal-astrology/', devPath: '/faction-profile.html', kind: 'standalone', faction: true, music: 'eternal-astrology' },
  { id: 'unconventional-affairs', title: '非常规事务署', affiliation: '奥兰尼亚', path: '/factions/unconventional-affairs/', devPath: '/unconventional-affairs.html', kind: 'standalone', faction: true, music: 'unconventional-affairs' },
  { id: 'imperial-knights', title: '五军同盟', affiliation: '霍亨泰因帝国', path: '/factions/imperial-knights/', devPath: '/imperial-knights.html', kind: 'standalone', faction: true, music: 'imperial-knights' },
]
const normalize = path => path.replace(/\/+$/, '') || '/'
export function pageForPath(pathname) {
  const path = normalize(pathname)
  return pages.find(page => [page.path, page.devPath].filter(Boolean).some(alias => path === normalize(alias) || (page.descendants && path.startsWith(normalize(alias) + '/'))))
}
export function pageUrl(id, development = import.meta.env?.DEV) {
  const page = pages.find(entry => entry.id === id)
  if (!page) throw new Error(`Unknown page: ${id}`)
  if (page.faction) return `/faction-profile.html?id=${encodeURIComponent(page.id)}`
  return development && page.devPath ? page.devPath : page.path
}
