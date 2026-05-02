import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL_A = 'https://gqoolicfujukmbwtmwrx.supabase.co'
const SERVICE_KEY_A = 'sb_secret_PLACEHOLDER_REPLACE_WITH_YOUR_KEY'

const supabase = createClient(SUPABASE_URL_A, SERVICE_KEY_A)

const TABLES = ['entries', 'system_logs', 'map_markers', 'map_regions']

async function exportAll() {
  const result = {}
  for (const table of TABLES) {
    console.log(`正在导出�? ${table}...`)
    const { data, error } = await supabase.from(table).select('*')
    if (error) {
      console.error(`导出 ${table} 失败:`, error.message)
      result[table] = []
    } else {
      console.log(`  �?导出 ${data.length} 条记录`)
      result[table] = data
    }
  }
  fs.writeFileSync('./scripts/migrate_data.json', JSON.stringify(result, null, 2))
  console.log('\n�?所有数据已导出�?scripts/migrate_data.json')
}

exportAll().catch(console.error)
