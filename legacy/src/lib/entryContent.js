import { parseEntryBlocks, getSupportedBlocks } from './contentContract.js'
import { apiGet } from './apiClient.js'

const parseGalleryImages = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

export function normalizeEntry(row) {
  const supportedBlocks = getSupportedBlocks(row.node_id)
  const parsedBlocks = parseEntryBlocks(row.blocks)
  const sourceBlocks = parsedBlocks.length > 0
    ? parsedBlocks
    : row.content
      ? [{ type: 'paragraph', content: row.content, dropCap: true }]
      : []

  let firstParagraphFound = false
  const blocks = []
  const kv = []

  sourceBlocks.forEach((block) => {
    if (!supportedBlocks.includes(block.type)) return
    if (block.type === 'key-value') {
      if (block.key) kv.push({ key: block.key, value: block.value || '' })
      return
    }
    if (block.type === 'paragraph' && block.content) {
      blocks.push({
        type: 'paragraph',
        content: block.content,
        dropCap: block.dropCap === undefined ? !firstParagraphFound : block.dropCap,
      })
      firstParagraphFound = true
      return
    }
    if (block.type === 'image' && block.url) {
      blocks.push({ type: 'image', url: block.url, caption: block.caption || '', scale: block.scale || 100 })
      return
    }
    if (block.type === 'quote' && block.content) {
      blocks.push({ type: 'quote', content: block.content, author: block.author || '' })
    }
  })

  return {
    id: row.id,
    node_id: row.node_id,
    name: row.title || '未知卷宗',
    title: row.subtitle || '',
    image_url: row.image_url || '',
    bg_image_url: row.bg_image_url || '',
    bg_image_scale: row.bg_image_scale || 120,
    main_image_scale: row.main_image_scale || 100,
    title_icon_url: row.title_icon_url || '',
    title_icon_scale: row.title_icon_scale || 100,
    alien_text: row.alien_text || '',
    sort_order: row.sort_order || 0,
    blocks,
    kv,
    gallery_images: parseGalleryImages(row.gallery_images),
  }
}

export function normalizeEntries(rows) {
  return (rows || []).map(normalizeEntry).sort((a, b) => a.sort_order - b.sort_order)
}

export async function fetchEntriesForNode(nodeId) {
  return await apiGet(`/entries/node/${encodeURIComponent(nodeId)}`) || []
}
