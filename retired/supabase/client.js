import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qunhjfulchaurfxtjoeg.supabase.co'
const supabaseKey = 'sb_publishable_Nkbcb5N92HUqJAGB9TYnJQ_W_09BC-T'

let supabaseClient = null
try {
  supabaseClient = createClient(supabaseUrl, supabaseKey)
} catch (e) {
  console.error('Supabase 初始化失败', e)
}

export default supabaseClient
