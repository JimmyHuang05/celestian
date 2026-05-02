import fs from 'fs'

const baseSql = fs.readFileSync('./scripts/migrate_schema.sql', 'utf8')

const extraSql = `
-- =====================================================
-- 5. rate_limits �?(速率限制)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    ip TEXT NOT NULL,
    date TEXT NOT NULL,
    usage_count NUMERIC DEFAULT 0
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rate_limits_select" ON public.rate_limits;
DROP POLICY IF EXISTS "rate_limits_insert" ON public.rate_limits;
DROP POLICY IF EXISTS "rate_limits_update" ON public.rate_limits;
DROP POLICY IF EXISTS "rate_limits_delete" ON public.rate_limits;
CREATE POLICY "rate_limits_select" ON public.rate_limits FOR SELECT USING (true);
CREATE POLICY "rate_limits_insert" ON public.rate_limits FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "rate_limits_update" ON public.rate_limits FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "rate_limits_delete" ON public.rate_limits FOR DELETE USING (auth.role() = 'authenticated');

-- 6. rate_whitelist �?(白名�?
CREATE TABLE IF NOT EXISTS public.rate_whitelist (
    ip TEXT NOT NULL,
    max_quota NUMERIC DEFAULT 0,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.rate_whitelist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rate_whitelist_select" ON public.rate_whitelist;
DROP POLICY IF EXISTS "rate_whitelist_insert" ON public.rate_whitelist;
DROP POLICY IF EXISTS "rate_whitelist_update" ON public.rate_whitelist;
DROP POLICY IF EXISTS "rate_whitelist_delete" ON public.rate_whitelist;
CREATE POLICY "rate_whitelist_select" ON public.rate_whitelist FOR SELECT USING (true);
CREATE POLICY "rate_whitelist_insert" ON public.rate_whitelist FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "rate_whitelist_update" ON public.rate_whitelist FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "rate_whitelist_delete" ON public.rate_whitelist FOR DELETE USING (auth.role() = 'authenticated');

-- 7. system_prompts �?(系统提示�?
CREATE TABLE IF NOT EXISTS public.system_prompts (
    id TEXT PRIMARY KEY,
    level NUMERIC DEFAULT 1,
    content TEXT DEFAULT '',
    description TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_prompts_select" ON public.system_prompts;
DROP POLICY IF EXISTS "system_prompts_insert" ON public.system_prompts;
DROP POLICY IF EXISTS "system_prompts_update" ON public.system_prompts;
DROP POLICY IF EXISTS "system_prompts_delete" ON public.system_prompts;
CREATE POLICY "system_prompts_select" ON public.system_prompts FOR SELECT USING (true);
CREATE POLICY "system_prompts_insert" ON public.system_prompts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "system_prompts_update" ON public.system_prompts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "system_prompts_delete" ON public.system_prompts FOR DELETE USING (auth.role() = 'authenticated');

-- 8. admin �?(管理员账�?
CREATE TABLE IF NOT EXISTS public.admin (
    id TEXT PRIMARY KEY,
    password TEXT NOT NULL
);
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select" ON public.admin;
DROP POLICY IF EXISTS "admin_insert" ON public.admin;
DROP POLICY IF EXISTS "admin_update" ON public.admin;
DROP POLICY IF EXISTS "admin_delete" ON public.admin;
CREATE POLICY "admin_select" ON public.admin FOR SELECT USING (true);
CREATE POLICY "admin_insert" ON public.admin FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update" ON public.admin FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete" ON public.admin FOR DELETE USING (auth.role() = 'authenticated');

SELECT '�?全部 8 张表创建完成' AS status;`

fs.writeFileSync('./scripts/migrate_full_schema.sql', baseSql + '\n' + extraSql)
console.log('�?完整建表 SQL 已生�? scripts/migrate_full_schema.sql (�?8 张表)')
console.log('')
console.log('请你:')
console.log('1. 打开 https://supabase.com/dashboard/project/qunhjfulchaurfxtjoeg/sql/new')
console.log('2. 粘贴 scripts/migrate_full_schema.sql 的全部内�?)
console.log('3. 点击 Run 执行')
