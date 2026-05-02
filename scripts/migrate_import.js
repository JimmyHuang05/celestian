import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL_B = 'https://qunhjfulchaurfxtjoeg.supabase.co'
const SERVICE_KEY_B = 'sb_secret_PLACEHOLDER_REPLACE_WITH_YOUR_KEY'
const PUBLISHABLE_KEY = 'sb_publishable_Nkbcb5N92HUqJAGB9TYnJQ_W_09BC-T'

const supabase = createClient(SUPABASE_URL_B, SERVICE_KEY_B)

// Load all data
const mainData = JSON.parse(fs.readFileSync('./scripts/migrate_data.json', 'utf8'))
const extraData = JSON.parse(fs.readFileSync('./scripts/migrate_extra_data.json', 'utf8'))

// 8 tables in order
const TABLES = [
  'entries',
  'system_logs',
  'map_markers',
  'map_regions',
  'rate_limits',
  'rate_whitelist',
  'system_prompts',
  'admin'
]

function getData(table) {
  if (mainData[table]) return mainData[table]
  if (extraData[table]?.exists) return extraData[table].data
  if (extraData[table] && Array.isArray(extraData[table])) return extraData[table]
  return []
}

async function importTable(tableName) {
  const records = getData(tableName)
  if (!records || records.length === 0) {
    console.log(`  ${tableName}: 无数据，跳过`)
    return { success: 0, failed: 0 }
  }

  const BATCH_SIZE = 10
  let success = 0
  let failed = 0

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from(tableName).insert(batch)
    if (error) {
      console.error(`  ${tableName} 批次 ${i / BATCH_SIZE + 1} 失败: ${error.message}`)
      failed += batch.length
    } else {
      success += batch.length
    }
  }
  console.log(`  ${tableName}: �?${success} 条成�?{failed ? `, �?${failed} 条失败` : ''}`)
  return { success, failed }
}

async function main() {
  console.log('开始导入数据到项目 B...\n')

  let totalSuccess = 0
  let totalFailed = 0

  for (const table of TABLES) {
    try {
      const result = await importTable(table)
      totalSuccess += result.success
      totalFailed += result.failed
    } catch (e) {
      console.error(`  ${table}: �?错误 - ${e.message}`)
      totalFailed++
    }
  }

  console.log(`\n🎉 导入完成! 总计 ${totalSuccess} 条成�? ${totalFailed} 条失败`)
}

main().catch(console.error)
