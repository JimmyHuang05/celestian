import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL_B = 'https://qunhjfulchaurfxtjoeg.supabase.co'
const SERVICE_KEY_B = 'sb_secret_PLACEHOLDER_REPLACE_WITH_YOUR_KEY'

const supabase = createClient(SUPABASE_URL_B, SERVICE_KEY_B)

const logEntry = {
  code: 'v1.1.1',
  time: '2026-05-02',
  title: '数据库迁移与架构重构',
  desc: '完成 Supabase 数据库从旧项目至新项目的完整迁移，数据零丢失。\n迁移 Edge Function Deepseek_API，接入 HTTPS 支持。\n更新 AI 模型为 deepseek-v4-flash，适配最新 API 标准。\n新增 HTTPS 自动跳转配置，全站启用加密传输。\n重构项目 README，补充完整技术栈与架构说明。\n标准化 .gitignore 策略，移除密钥与导出数据文件的版本追踪。'
}

async function main() {
  console.log('插入 v1.1.1 日志...')
  const { data, error } = await supabase.from('system_logs').insert(logEntry)
  if (error) {
    console.error('插入失败:', error.message)
    return
  }
  console.log('✅ v1.1.1 日志插入成功!')
  
  const { count } = await supabase.from('system_logs').select('*', { count: 'exact', head: true })
  console.log(`system_logs 表现有 ${count} 条记录`)
}

main().catch(console.error)
