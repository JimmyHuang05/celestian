-- 在 Supabase SQL Editor 中执行以下语句创建日志表
-- 请一次性全选所有行后执行

-- 1. 创建表（使用 SERIAL 替代 IDENTITY，兼容性更佳）
CREATE TABLE IF NOT EXISTS public.system_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    code TEXT NOT NULL,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    desc TEXT DEFAULT ''
);

-- 2. 开启 Row Level Security
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- 3. 删除旧策略（如果之前创建失败留下了残留，先清理）
DROP POLICY IF EXISTS "允许所有人读取" ON public.system_logs;
DROP POLICY IF EXISTS "仅开发者插入" ON public.system_logs;
DROP POLICY IF EXISTS "仅开发者更新" ON public.system_logs;
DROP POLICY IF EXISTS "仅开发者删除" ON public.system_logs;

-- 4. 重新创建策略
CREATE POLICY "允许所有人读取" ON public.system_logs
    FOR SELECT USING (true);

CREATE POLICY "仅开发者插入" ON public.system_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "仅开发者更新" ON public.system_logs
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "仅开发者删除" ON public.system_logs
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. 验证
SELECT '表创建成功' AS status, count(*) AS 记录数 FROM public.system_logs;
