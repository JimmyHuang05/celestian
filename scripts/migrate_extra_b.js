import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL_A = 'https://gqoolicfujukmbwtmwrx.supabase.co'
const SERVICE_KEY_A = 'sb_secret_PLACEHOLDER_REPLACE_WITH_YOUR_KEY'

const supabase = createClient(SUPABASE_URL_A, SERVICE_KEY_A)

async function main() {
  const extra = ['rate_limits', 'system_prompts']
  const result = {}
  
  for (const table of extra) {
    console.log(`正在导出�? ${table}...`)
    const { data, error } = await supabase.from(table).select('*')
    if (error) {
      console.log(`  �?${error.message}`)
      result[table] = []
    } else {
      console.log(`  �?${data.length} 条记录`)
      if (data.length > 0) {
        console.log(`     �? [${Object.keys(data[0]).join(', ')}]`)
      }
      result[table] = data
    }
  }
  
  // Merge with existing data
  const existing = JSON.parse(fs.readFileSync('./scripts/migrate_extra_data.json', 'utf8'))
  Object.assign(existing, result)
  fs.writeFileSync('./scripts/migrate_extra_data.json', JSON.stringify(existing, null, 2))
  console.log('\n�?合并完成!')
}

main().catch(console.error)
