import { openPage } from './page-navigation.js'
import { pages, pageUrl } from './page-registry.js'
export const factionItems = pages.filter(page => page.faction).map(page => ({ id: page.id, name: page.title, affiliation: page.affiliation }))
export function navigateFaction(id) {
  if (factionItems.some(page => page.id === id)) openPage(pageUrl(id))
}
