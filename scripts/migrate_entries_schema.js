import { createClient } from '@supabase/supabase-js'

const URL = 'https://qunhjfulchaurfxtjoeg.supabase.co'
const KEY = 'sb_secret_PLACEHOLDER_REPLACE_WITH_YOUR_KEY'

async function main() {
  const supabase = createClient(URL, KEY)

  // 1. 先执行原始 SQL 加列
  const sql = `-- 在 Supabase SQL Editor 执行:
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS title_icon_url TEXT DEFAULT '';
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS title_icon_scale NUMERIC DEFAULT 100;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS alien_text TEXT DEFAULT '';
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS gallery_images TEXT DEFAULT '';
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS blocks TEXT DEFAULT '';
SELECT '5 columns added' AS status;`

  console.log('请先在 Supabase SQL Editor 执行以下 SQL:\n')
  console.log(sql)
  console.log('\n然后按任意键继续...')
  await new Promise(r => setTimeout(r, 2000))

  // 2. 获取所有数据
  const { data, error } = await supabase.from('entries').select('id, node_id, content, bg_image_url, main_image_scale, bg_image_scale, sort_order')
  if (error) { console.error('Fetch error:', error); return }

  console.log(`\n共 ${data.length} 条记录, 开始迁移...`)

  const META_KEYS = ['MAIN_IMAGE_SCALE', 'BG_IMAGE_URL', 'BG_IMAGE_SCALE', 'TITLE_ICON_URL', 'TITLE_ICON_SCALE', 'ALIEN_TEXT', 'SORT_ORDER', 'GALLERY_IMAGES', 'BLOCKS']

  function extractMeta(content) {
    const result = {}
    for (const key of META_KEYS) {
      const re = new RegExp(`<!--${key}:(.*?)-->`)
      const m = content.match(re)
      result[key] = m ? m[1].trim() : null
    }
    return result
  }

  function cleanContent(content) {
    return content.replace(/<!--.*?-->/gs, '').replace(/^\s*\n/gm, '').trim()
  }

  let updated = 0
  for (const row of data) {
    const meta = extractMeta(row.content || '')
    const updateFields = {}

    if (meta.SORT_ORDER && meta.SORT_ORDER !== String(row.sort_order)) {
      updateFields.sort_order = parseInt(meta.SORT_ORDER, 10)
    }
    if (meta.MAIN_IMAGE_SCALE && meta.MAIN_IMAGE_SCALE !== String(row.main_image_scale)) {
      updateFields.main_image_scale = parseInt(meta.MAIN_IMAGE_SCALE, 10)
    }
    if (meta.BG_IMAGE_SCALE && meta.BG_IMAGE_SCALE !== String(row.bg_image_scale)) {
      updateFields.bg_image_scale = parseInt(meta.BG_IMAGE_SCALE, 10)
    }
    if (meta.BG_IMAGE_URL && !row.bg_image_url) {
      updateFields.bg_image_url = meta.BG_IMAGE_URL
    }
    if (meta.TITLE_ICON_URL) updateFields.title_icon_url = meta.TITLE_ICON_URL
    if (meta.TITLE_ICON_SCALE) updateFields.title_icon_scale = parseInt(meta.TITLE_ICON_SCALE, 10)
    if (meta.ALIEN_TEXT) updateFields.alien_text = meta.ALIEN_TEXT
    if (meta.GALLERY_IMAGES) updateFields.gallery_images = meta.GALLERY_IMAGES
    if (meta.BLOCKS) updateFields.blocks = meta.BLOCKS

    updateFields.content = cleanContent(row.content || '')

    const { error: ue } = await supabase.from('entries').update(updateFields).eq('id', row.id)
    if (ue) {
      console.error(`更新 ${row.id} 失败:`, ue.message)
    } else {
      updated++
    }
  }

  console.log(`\n✅ 迁移完成! ${updated}/${data.length} 条记录已更新`)

  // 3. 验证
  const { data: verify } = await supabase.from('entries').select('id, title, sort_order, blocks, title_icon_url').limit(5)
  console.log('\n验证样本:')
  for (const v of verify) {
    console.log(`  ${v.title}: sort=${v.sort_order}, has_title_icon=${!!v.title_icon_url}, blocks_len=${(v.blocks||'').length}`)
  }
}

main().catch(console.error)
