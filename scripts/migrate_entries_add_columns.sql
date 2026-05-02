-- 为 entries 表新增 5 个规范化列
-- 将 content 中内嵌的元标记数据迁移到独立列

ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS title_icon_url TEXT DEFAULT '';
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS title_icon_scale NUMERIC DEFAULT 100;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS alien_text TEXT DEFAULT '';
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS gallery_images TEXT DEFAULT '';
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS blocks TEXT DEFAULT '';

SELECT '✅ 5 columns added' AS status;
