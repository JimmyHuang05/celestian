import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL_A = 'https://gqoolicfujukmbwtmwrx.supabase.co'
const SERVICE_KEY_A = 'sb_secret_PLACEHOLDER_REPLACE_WITH_YOUR_KEY'

const supabase = createClient(SUPABASE_URL_A, SERVICE_KEY_A)

async function listTables() {
  const { data, error } = await supabase.rpc('get_schema_info')
  if (error) {
    console.log('RPC 方式失败:', error.message)
    console.log('改用 SQL 查询...')
    const { data: tables, error: e2 } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
    
    if (e2) {
      console.log('information_schema 也失�?', e2.message)
      console.log('改用 pg_catalog...')
      const { data: pgTables, error: e3 } = await supabase
        .rpc('pg_catalog.pg_tables')
      
      if (e3) {
        console.log('所有方式都失败，手动尝试已知表�?..')
        for (const t of ['rate_limit', 'rate_whitelist', 'rate_whitlist', 'system_prompt', 'admin', 'system_prompts', 'rate_limits']) {
          const { data, error } = await supabase.from(t).select('*', { count: 'exact', head: true })
          if (!error) {
            console.log(`  �?�?"${t}" 存在`)
            const { data: sample } = await supabase.from(t).select('*').limit(1)
            if (sample && sample[0]) console.log('     �?', Object.keys(sample[0]))
          } else {
            console.log(`  �?�?"${t}": ${error.message}`)
          }
        }
      }
    } else {
      console.log('存在的表:', tables?.map(t => t.table_name).join(', '))
    }
  }
}

listTables()
