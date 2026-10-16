import previews from './gallery-previews.json'

function list(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return []
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : [value] } catch { return [value] }
}

function imageList(value) {
  return list(value).filter(url => typeof url === 'string' && /^(https?:\/\/|\/(?!\/))/.test(url))
}

export function galleryMarkup(value) {
  const document = new DOMParser().parseFromString(String(value || '').replace(/\\"/g, '"'), 'text/html')
  const allowed = { B: 'strong', STRONG: 'strong', I: 'em', EM: 'em', P: 'span', BR: 'br', SPAN: 'span', FONT: 'span' }
  function clean(node) {
    if (node.nodeType === 3) return document.createTextNode(node.textContent)
    const fragment = document.createDocumentFragment()
    if (node.nodeType !== 1 || ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'TEMPLATE'].includes(node.tagName)) return fragment
    const result = allowed[node.tagName] ? document.createElement(allowed[node.tagName]) : fragment
    if (['SPAN', 'FONT'].includes(node.tagName)) result.className = 'gallery-emphasis'
    for (const child of node.childNodes) result.append(clean(child))
    return result
  }
  const result = document.createElement('div')
  for (const child of document.body.childNodes) result.append(clean(child))
  return result.innerHTML
}

export function galleryText(value) {
  return new DOMParser().parseFromString(galleryMarkup(value), 'text/html').body.textContent.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim()
}

export function normalizeGallery(rows) {
  return rows.map(row => {
    const source = list(row.blocks).filter(block => block && typeof block === 'object')
    const blocks = source.filter(block => ['paragraph', 'quote'].includes(block.type) && block.content)
    if (!blocks.length && row.content) blocks.push({ type: 'paragraph', content: row.content })
    const facts = source.filter(block => block.type === 'key-value' && block.key).map(block => ({ key: galleryText(block.key), value: block.value || '' }))
    const background = imageList(row.bg_image_url), gallery = imageList(row.gallery_images)
    return {
      id: row.id, name: galleryText(row.title) || '未命名留影', subtitle: galleryText(row.subtitle), englishName: galleryText(row.alien_text),
      images: [...new Set(background.length ? background : gallery.length ? gallery : imageList(row.image_url))],
      blocks, facts, location: galleryText(facts.find(fact => fact.key === '地点')?.value),
      order: Number(row.sort_order) || 0,
    }
  }).sort((a, b) => a.order - b.order)
}

export async function fetchGallery(nodeId, signal) {
  const response = await fetch('/api/entries/node/' + encodeURIComponent(nodeId), { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Gallery unavailable')
  const payload = await response.json()
  const rows = Array.isArray(payload) ? payload : payload.data
  if (payload.error || !Array.isArray(rows)) throw new Error('Invalid gallery data')
  return normalizeGallery(rows)
}

const defaultPresentation = { desktop: '50% 50%', mobile: '50% 50%' }
const compositions = {
  'e0f8ec42-8ce4-4415-9476-76cb8d335500': { desktop: '50% 50%', mobile: '49% 50%' },
  '0e24190e-7612-4037-ae20-730cbbc1bafb': { desktop: '50% 50%', mobile: '67% 50%' },
  '083cdc18-087f-4087-aa58-2daa2d92500c': { desktop: '50% 50%', mobile: '62% 50%' },
}

export function scenePresentation(entry) {
  return { ...(compositions[entry?.id] || defaultPresentation), thumbnail: previews[entry?.images[0]] || entry?.images[0] || '' }
}
