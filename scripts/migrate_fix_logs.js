import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL_B = 'https://qunhjfulchaurfxtjoeg.supabase.co'
const SERVICE_KEY_B = 'sb_secret_PLACEHOLDER_REPLACE_WITH_YOUR_KEY'
const supabase = createClient(SUPABASE_URL_B, SERVICE_KEY_B)

const rawData = JSON.parse(fs.readFileSync('./scripts/migrate_data.json', 'utf8'))

async function main() {
  console.log('重新导入 system_logs (去掉 id 字段)...\n')

  // Strip id field - let BIGSERIAL auto-generate
  const records = rawData.system_logs.map(({ id, ...rest }) => rest)

  const BATCH_SIZE = 10
  let success = 0
  let failed = 0

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('system_logs').insert(batch)
    if (error) {
      console.error(`  批次 ${i / BATCH_SIZE + 1} 失败: ${error.message}`)
      failed += batch.length
    } else {
      success += batch.length
    }
  }

  console.log(`  system_logs: �?${success} 条成�?{failed ? `, �?${failed} 条失败` : ''}`)

  // Verify
  const { count } = await supabase.from('system_logs').select('*', { count: 'exact', head: true })
  console.log(`\n📊 验证: system_logs 表现在有 ${count} 条记录`)
}

main().catch(console.error)
