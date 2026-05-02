import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!DEEPSEEK_API_KEY) throw new Error("边缘函数配置错误：缺失 API Key")
    
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown_ip'
    const today = new Date().toISOString().split('T')[0]
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY)

    await supabaseAdmin.from('rate_limits').delete().lt('date', today)

    const { data: whitelistData } = await supabaseAdmin
      .from('rate_whitelist')
      .select('max_quota')
      .eq('ip', clientIp)
      .maybeSingle()

    const allowedQuota = whitelistData?.max_quota ?? 3

    const { data: limitData } = await supabaseAdmin
      .from('rate_limits')
      .select('usage_count')
      .eq('ip', clientIp)
      .eq('date', today)
      .maybeSingle()

    const currentCount = limitData?.usage_count || 0

    if (currentCount >= allowedQuota) {
      return new Response(JSON.stringify({ error: "429_RATE_LIMIT", message: "今日请求配额已耗尽" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 429 
      })
    }

    await supabaseAdmin
      .from('rate_limits')
      .upsert({ ip: clientIp, date: today, usage_count: currentCount + 1 }, { onConflict: 'ip, date' })
    
    const { data: promptData, error: promptError } = await supabaseAdmin
      .from('system_prompts')
      .select('content, level')
      .order('level', { ascending: true })

    if (promptError) console.error("无法读取提示词:", promptError)
    
    let baseSystemPrompt = "你是逻各斯，巴别塔通用信息公司创造的超级人工智能。\n\n"
    
    if (promptData && promptData.length > 0) {
      baseSystemPrompt += promptData.map(p => p.content).join('\n\n')
    } else {
      baseSystemPrompt += `核心指令：\n要求：简洁、纯文本、无Markdown、少于100字。若无相关资料回答「权限不足」。`
    }

    const { messages } = await req.json()
    if (!Array.isArray(messages)) throw new Error("无效的消息格式")

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    })

    const [ent, mar, reg] = await Promise.all([
      supabase.from('entries').select('title, subtitle, content, additional_content').limit(20),
      supabase.from('map_markers').select('title, description, type').limit(100),
      supabase.from('map_regions').select('group_id, sub_group_id, title, description, status').limit(100)
    ])

    const contextParts = []
    if (ent.data?.length) contextParts.push(`条目: ${JSON.stringify(ent.data)}`)
    if (mar.data?.length) contextParts.push(`标记: ${JSON.stringify(mar.data)}`)
    if (reg.data?.length) contextParts.push(`区域: ${JSON.stringify(reg.data)}`)
    
    const contextString = contextParts.length > 0 
      ? `\n\n参考档案:\n${contextParts.join(' | ')}` 
      : "\n\n暂无参考档案。"

    const payload = {
      model: "deepseek-v4-flash",
      messages: [
        {
          role: "system",
          content: baseSystemPrompt + contextString
        },
        ...messages
      ],
      temperature: 0.6,
      max_tokens: 2048
    }

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}` 
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorMsg = await res.text()
      throw new Error(`DeepSeek API 错误: ${errorMsg}`)
    }

    const data = await res.json()
    
    return new Response(JSON.stringify(data), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})
