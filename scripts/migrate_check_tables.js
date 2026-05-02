import fs from 'fs'

const SUPABASE_URL = 'https://gqoolicfujukmbwtmwrx.supabase.co'
const SERVICE_KEY = 'sb_secret_PLACEHOLDER_REPLACE_WITH_YOUR_KEY'

const TABLES = ['rate_limit', 'rate_whitlist', 'system_prompt']
const ALREADY_DONE = ['rate_whitelist', 'admin']

async function fetchTable(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*`
  const res = await fetch(url, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Accept': 'application/json'
    }
  })
  
  if (!res.ok) {
    const text = await res.text()
    console.log(`  â?${table}: HTTP ${res.status} - ${text}`)
    return null
  }
  
  const data = await res.json()
  return data
}

async function main() {
  const result = JSON.parse(fs.readFileSync('./scripts/migrate_extra_data.json', 'utf8'))
  
  for (const table of TABLES) {
    console.log(`\næŸ¥è¯¢è¡? ${table}...`)
    const data = await fetchTable(table)
    if (data !== null) {
      result[table] = data
      console.log(`  âœ?${data.length} æ¡è®°å½•`)
      if (data.length > 0) {
        console.log(`     åˆ? [${Object.keys(data[0]).join(', ')}]`)
      }
    } else {
      result[table] = []
    }
  }
  
  fs.writeFileSync('./scripts/migrate_extra_data.json', JSON.stringify(result, null, 2))
  console.log('\nâœ?å®Œæˆ!')
}

main().catch(console.error)
