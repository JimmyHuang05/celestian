import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL_A = 'https://gqoolicfujukmbwtmwrx.supabase.co'
const SERVICE_KEY_A = 'sb_secret_PLACEHOLDER_REPLACE_WITH_YOUR_KEY'

const supabase = createClient(SUPABASE_URL_A, SERVICE_KEY_A, {
  db: { schema: 'public' }
})

const TABLES = ['rate_limit', 'rate_whitelist', 'rate_whitlist', 'system_prompt', 'admin']

async function queryWithRetry(table, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // First do a head request to check existence
      const { count, error: headError } = await supabase
        .from(table).select('*', { count: 'exact', head: true })
      
      if (headError) {
        console.log(`  尝试 ${i + 1}/${maxRetries}: ${headError.message}`)
        await new Promise(r => setTimeout(r, 1000))
        continue
      }
      
      console.log(`  表存在，${count} 条记录，正在获取数据...`)
      const { data, error } = await supabase.from(table).select('*')
      
      if (error) {
        console.log(`  获取数据失败: ${error.message}`)
        return []
      }
      return data || []
    } catch (e) {
      console.log(`  尝试 ${i + 1}/${maxRetries} 出错: ${e.message}`)
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return []
}

async function exportAll() {
  const result = {}
  for (const table of TABLES) {
    console.log(`\n正在导出�? ${table}...`)
    const data = await queryWithRetry(table)
    result[table] = data
    if (data.length > 0) {
      console.log(`  �?导出 ${data.length} 条`)
      console.log(`     �? [${Object.keys(data[0]).join(', ')}]`)
    } else {
      console.log(`  ℹ️ 无数据或表不存在`)
    }
  }
  fs.writeFileSync('./scripts/migrate_extra_data.json', JSON.stringify(result, null, 2))
  console.log('\n�?完成! 结果保存�?scripts/migrate_extra_data.json')
}

exportAll().catch(console.error)
