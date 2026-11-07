# Celestian — 无光的伊甸园

一个基于 **React + Vite** 构建的世界构建与百科管理平台，包含百科全书、交互地图、AI 对话等功能。
预览：https://celestian.jimmyhuang.cn/


## 当前页面入口（2026-11-05）

- `/` 直接转到百科全书 `/encyclopedia/`，原卡片首页暂时归档。
- 百科的「留影」节点改为海陆图志入口；旧 `/encyclopedia/gallery` 地址转到 `/map/`。
- 有求必应及制证子页暂时归档，旧 `/functions/*` 地址转到百科全书。
- 角色与势力档案继续保留。原留影素材与数据保留，不做删除。
- 归档说明与改动前页面快照见 `archive/2026-11-05-navigation/`。下方原功能介绍供历史参考。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19, React Router 7 |
| 构建 | Vite 8, Babel, PostCSS, Tailwind CSS 3 |
| 数据库 | Supabase (PostgreSQL) |
| 后端逻辑 | Supabase Edge Functions (Deno) |
| AI 模型 | DeepSeek Chat |
| CDN/部署 | Nginx |

## 项目结构

```
celestian/
├── src/                          # React 前端源码
│   ├── pages/
│   │   ├── EncyclopediaPage.jsx  # 百科全书（百科条目浏览）
│   │   ├── MapPage.jsx           # 海陆图志（交互式地图）
│   │   ├── FunctionsPage.jsx     # 有求必应（AI 对话 + 系统面板）
│   │   └── BadgePage.jsx         # 统一制证服务
│   ├── components/encyclopedia/
│   │   ├── StandardDetail.jsx    # 标准条目详情
│   │   ├── AeonDetail.jsx        # 星神条目详情
│   │   ├── GalleryDetail.jsx     # 画廊条目详情
│   │   ├── DataNode.jsx          # 分类节点组件
│   │   ├── ProgressIcon.jsx      # 进度图标
│   │   └── Starfield.jsx         # 星空背景动画
│   ├── App.jsx                   # 路由入口
│   └── main.jsx                  # 应用入口
├── public/
│   ├── editor/                   # 开发者管理工具（纯静态 HTML）
│   │   ├── index.html            # 登录面板
│   │   ├── entries_editor.html   # 百科条目编辑器
│   │   ├── log_editor.html       # 系统日志编辑器
│   │   ├── map_editor.html       # 地图数据编辑器
│   │   └── svg_editor.html       # SVG 编辑器
│   └── data/                     # 静态资源（图片、音频、地图）
├── supabase/functions/
│   └── Deepseek_API/index.ts     # Edge Function: AI 对话代理
├── scripts/                      # 数据库迁移脚本
├── celestian_nginx.conf          # Nginx 部署配置（HTTP + HTTPS）
├── project_context.md            # 项目上下文文档
└── README.md
```

## 数据库（Supabase）

| 表名 | 用途 |
|------|------|
| `entries` | 百科条目（星神、角色、画廊、圣物等） |
| `system_logs` | 系统更新日志 |
| `map_markers` | 地图兴趣点标记 |
| `map_regions` | 地图区域边界 |
| `rate_limits` | API 速率限制记录 |
| `rate_whitelist` | IP 白名单 |
| `system_prompts` | AI 系统提示词 |
| `admin` | 管理员账号 |

## 本地开发

```bash
npm install
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run preview    # 预览生产构建
```

## 部署

### 版本库与资源范围

GitHub 保存当前源码、配置、维护脚本，以及正式页面引用的地图瓦片、字体、压缩图片和音频。`npm ci` 后可运行 `npm run build` 验证生产构建；线上 API 和外部资源服务仍由现有服务器提供。

构建副本、部署包、备份、凭据、旧地图瓦片及未采用的原始素材不提交，由 `.gitignore` 排除。源文件仍保留在本地，没有因整理仓库而删除。部分历史设计预览源码保留供参考，其可选试稿素材不随仓库分发；如将试稿用于正式页面，应同时更新忽略规则并补齐所需资源。

GitHub 同步与服务器部署是两个独立操作。更新服务器前应构建并验证发布包、备份原文件；凭据仅在仓库外的本地服务器连接目录保存。

- Web 服务: Nginx（SPA fallback + 静态资源缓存）
- 数据库: Supabase PostgreSQL
- AI 接口: Supabase Edge Function（Deepseek_API）

Nginx 配置文件见 `celestian_nginx.conf`，支持 HTTP 自动跳转 HTTPS。
