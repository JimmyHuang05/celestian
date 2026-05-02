-- =====================================================
-- Celestian - 在项目 B 创建数据库表
-- 请在 Supabase Dashboard SQL Editor 中执行
-- https://supabase.com/dashboard/project/qunhjfulchaurfxtjoeg/sql/new
-- =====================================================

-- 1. entries 表 (百科条目)
CREATE TABLE IF NOT EXISTS public.entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    node_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    subtitle TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    bg_image_url TEXT,
    main_image_scale NUMERIC DEFAULT 100,
    bg_image_scale NUMERIC DEFAULT 120,
    sort_order NUMERIC DEFAULT 0,
    content TEXT DEFAULT '',
    additional_content TEXT
);
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "entries_select" ON public.entries;
DROP POLICY IF EXISTS "entries_insert" ON public.entries;
DROP POLICY IF EXISTS "entries_update" ON public.entries;
DROP POLICY IF EXISTS "entries_delete" ON public.entries;
CREATE POLICY "entries_select" ON public.entries FOR SELECT USING (true);
CREATE POLICY "entries_insert" ON public.entries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "entries_update" ON public.entries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "entries_delete" ON public.entries FOR DELETE USING (auth.role() = 'authenticated');

-- 2. system_logs 表 (系统日志)
CREATE TABLE IF NOT EXISTS public.system_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    code TEXT NOT NULL,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    "desc" TEXT DEFAULT ''
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_logs_select" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_insert" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_update" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_delete" ON public.system_logs;
CREATE POLICY "system_logs_select" ON public.system_logs FOR SELECT USING (true);
CREATE POLICY "system_logs_insert" ON public.system_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "system_logs_update" ON public.system_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "system_logs_delete" ON public.system_logs FOR DELETE USING (auth.role() = 'authenticated');

-- 3. map_markers 表 (地图标记)
CREATE TABLE IF NOT EXISTS public.map_markers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT DEFAULT '',
    icon TEXT DEFAULT 'geo',
    color TEXT DEFAULT '#d4b58e',
    last_editor TEXT DEFAULT 'System',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    foreign_title TEXT DEFAULT ''
);
ALTER TABLE public.map_markers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "map_markers_select" ON public.map_markers;
DROP POLICY IF EXISTS "map_markers_insert" ON public.map_markers;
DROP POLICY IF EXISTS "map_markers_update" ON public.map_markers;
DROP POLICY IF EXISTS "map_markers_delete" ON public.map_markers;
CREATE POLICY "map_markers_select" ON public.map_markers FOR SELECT USING (true);
CREATE POLICY "map_markers_insert" ON public.map_markers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "map_markers_update" ON public.map_markers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "map_markers_delete" ON public.map_markers FOR DELETE USING (auth.role() = 'authenticated');

-- 4. map_regions 表 (地图区域)
CREATE TABLE IF NOT EXISTS public.map_regions (
    id BIGSERIAL PRIMARY KEY,
    region_id TEXT NOT NULL,
    group_id TEXT DEFAULT '',
    is_primary BOOLEAN DEFAULT false,
    title TEXT NOT NULL,
    foreign_title TEXT DEFAULT '',
    status TEXT DEFAULT '',
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#D4B58E',
    status_color TEXT DEFAULT '#A30000',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sub_group_id TEXT DEFAULT '',
    is_sub_primary BOOLEAN DEFAULT false,
    follow_primary BOOLEAN DEFAULT false
);
ALTER TABLE public.map_regions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "map_regions_select" ON public.map_regions;
DROP POLICY IF EXISTS "map_regions_insert" ON public.map_regions;
DROP POLICY IF EXISTS "map_regions_update" ON public.map_regions;
DROP POLICY IF EXISTS "map_regions_delete" ON public.map_regions;
CREATE POLICY "map_regions_select" ON public.map_regions FOR SELECT USING (true);
CREATE POLICY "map_regions_insert" ON public.map_regions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "map_regions_update" ON public.map_regions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "map_regions_delete" ON public.map_regions FOR DELETE USING (auth.role() = 'authenticated');

SELECT '✅ 所有表创建完成' AS status;

-- =====================================================
-- 5. rate_limits 表 (速率限制)
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

-- 6. rate_whitelist 表 (白名单)
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

-- 7. system_prompts 表 (系统提示词)
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

-- 8. admin 表 (管理员账号)
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

SELECT '✅ 全部 8 张表创建完成' AS status;