import aeons from '../../assets/encyclopedia-icons/node-emblem-aeons.svg?url'
import characters from '../../assets/encyclopedia-icons/node-emblem-characters.svg?url'
import enemies from '../../assets/encyclopedia-icons/node-emblem-enemies.svg?url'
import factions from '../../assets/encyclopedia-icons/node-emblem-factions.svg?url'
import gallery from '../../assets/encyclopedia-icons/node-emblem-gallery.svg?url'
import relics from '../../assets/encyclopedia-icons/node-emblem-relics.svg?url'
import terms from '../../assets/encyclopedia-icons/node-emblem-terms.svg?url'

export const emblemUrls = { aeons, characters, enemies, factions, gallery, relics, terms }
const requests = new Map()
export function loadEmblem(id) {
  const url = emblemUrls[id]
  if (!requests.has(url)) {
    const early = window.__celestianNodeEmblems?.[url]
    const request = Promise.resolve(early).then(text => text || fetch(url, { priority: 'high' }).then(response => {
      if (!response.ok) throw new Error('Emblem unavailable')
      return response.text()
    })).catch(error => { requests.delete(url); throw error })
    requests.set(url, request)
  }
  return requests.get(url)
}
