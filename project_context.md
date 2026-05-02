# 无光的伊甸园 — 项目开发日志

## 项目概览

- **项目名**: 无光的伊甸园 (celestian.jimmyhuang.cn)
- **前端**: React 19 + Vite 8 (SPA)
- **后端工具**: 原生 HTML + Vue 3 (静态文件，通过 Nginx 直接提供)
- **数据库**: Supabase (PostgreSQL)
- **部署**: Ubuntu Server, Nginx, 根目录 /var/www/celestian
- **源码目录**: D:\Projects\celestian_jimmyhuang_react

---

## 核心架构

### 前端路由 (React SPA)

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | App.jsx 内联 | 主页卡片引导页 |
| `/encyclopedia` | EncyclopediaPage | 百科全书 |
| `/map` | MapPage | 海陆图志 (Leaflet) |
| `/functions` | FunctionsPage | 有求必应 (AI + 日志) |
| `/functions/badge` | BadgePage | 统一制证 |

### 后端工具 (静态 HTML，在 /editor/ 下)

| 路径 | 技术 | 说明 |
|------|------|------|
| `/editor/` | Vue 3 + Tailwind | 开发者中心门户 |
| `/editor/entries_editor.html` | Vue 3 + Tailwind | 百科全书数据编辑器 |
| `/editor/map_editor.html` | 原生 JS + Leaflet | 地图数据编辑器 |
| `/editor/svg_editor.html` | 原生 JS | SVG 矢量测绘 |
| `/editor/log_editor.html` | **原生 JS** (无框架) | 系统更新日志 CRUD |

### 数据目录结构 (public/data/)

```
data/
  audio/
    bgm/        -- functions.mp3, encyclopedia.mp3, home.mp3
    sfx/        -- uplink.mp3, hover.mp3
  entries/
    aeons/      -- 星神图片
    characters/ -- 角色图片
    enemies/    -- 敌对物种图片
    fractions/  -- 势力图片
    gallery/    -- 留影图片
    relics/     -- 圣物图片
    terms/      -- 专有名词图片
  images/
    icons/      -- SVG 游戏分类图标
    cards/      -- 主页六张功能卡片图
  map/
    basemap.webp -- 地图底图
    regions.svg  -- 区域边界矢量
```

---

## Supabase 数据表

### entries 表 — 百科条目

| 列名 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| created_at | TIMESTAMPTZ | 创建时间 |
| node_id | TEXT | 节点/分类 (aeons, characters, enemies, fractions, gallery, relics, terms) |
| title | TEXT | 标题 |
| subtitle | TEXT | 副标题 |
| image_url | TEXT | 主图 URL |
| bg_image_url | TEXT | 背景图/画廊轮播多图 (JSON 数组字符串) |
| content | TEXT | 详情的 Markdown 元标记格式 |

**content 元标记格式**:
```
<!--MAIN_IMAGE_SCALE:100-->
<!--BG_IMAGE_URL:https://...-->
<!--BG_IMAGE_SCALE:120-->
<!--TITLE_ICON_URL:https://...-->
<!--TITLE_ICON_SCALE:100-->
<!--ALIEN_TEXT:A E O N S-->
<!--SORT_ORDER:0-->
<!--GALLERY_IMAGES:["url1","url2"]-->
<!--BLOCKS:[{"type":"paragraph","content":"..."}, {"type":"key-value","key":"类别","value":"内容"}, {"type":"quote","content":"...","author":"..."}]-->

（正文内容...）
```

### system_logs 表 — 更新日志

| 列名 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| created_at | TIMESTAMPTZ | 创建时间 |
| code | TEXT | 版本号 (如 V1.1.0) |
| time | TEXT | 日期 (如 2026-05-01) |
| title | TEXT | 标题 |
| desc | TEXT | 更新内容 (换行分隔) |

RLS 策略：所有人可读，仅 authenticated 用户可写。

---

## 关键技术实现

### 百科全书详情弹窗
- 三个组件切换：StandardDetail（常规）、AeonDetail（星神）、GalleryDetail（留影）
- GalleryDetail 支持多图轮播：解析 `bg_image_url` 列 → JSON 数组 → 自动轮播 4s → 鼠标悬停暂停 → 右下角小圆点切换
- 图片容器 21:9 宽高比

### 有求必应 (FunctionsPage)
- AI 对话：调用 Supabase Edge Functions 接入 Deepseek 模型
- 日志页：从 system_logs 表拉取数据
- leftRef 三按钮：工具箱、编辑器（新标签页 `window.open`）、返回首页

### 素材路径规范
- 旧路径 `/data/UI/` → 新路径 `/data/images/icons/` 或 `/data/images/cards/`
- 旧音频 `/data/audio/xxx.mp3` → `/data/audio/bgm/xxx.mp3` 或 `/data/audio/sfx/xxx.mp3`
- 地图 `/data/map.webp` → `/data/map/basemap.webp`，`map_regions_2.svg` → `map/regions.svg`

### Nginx 配置要点
- SPA fallback: `try_files $uri $uri/ /index.html`
- 编辑器静态: `/editor/` 直接提供 HTML
- 缓存: /assets/ → 1y immutable, /data/ → 30d

### 编辑器同步策略
- 源码在 `public/editor/`，同步到 `dist/editor/` 和 HTML 项目
- 编辑器是纯静态文件，改完只需复制到 dist，不需要 npm run build
- JS/CSS hash 变了才需要 rebuild

## 当前已知问题

- 编辑器需要开发者邮箱验证（Supabase RLS authenticated）
- 部分旧条目数据图片存在 content 元标记里，新数据走 `bg_image_url` 列

## 关键路径

- 配置文件: D:\Projects\celestian_jimmyhuang_react\celestian_nginx.conf
- 后端入口: D:\Projects\celestian_jimmyhuang_react\public\editor\index.html
- HTML 老项目: D:\Projects\celestian_jimmyhuang_html\
