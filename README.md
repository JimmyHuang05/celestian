<div align="center">

# CELESTIAN

### 无光的伊甸园

世界设定 · 百科全书 · 海陆图志 · 人物与势力档案

以古典装饰、星空与铜色线条，呈现一个持续生长的幻想世界。

[**进入世界 ↗**](https://celestian.jimmyhuang.cn/) · [海陆图志](https://celestian.jimmyhuang.cn/map/) · [本地开发](#本地开发) · [资源与部署](#资源与部署)

![React](https://img.shields.io/badge/React-19-202b32?style=flat-square&logo=react&logoColor=c0ab78)
![Vite](https://img.shields.io/badge/Vite-8-202b32?style=flat-square&logo=vite&logoColor=c0ab78)
![Three.js](https://img.shields.io/badge/Three.js-0.186-202b32?style=flat-square&logo=threedotjs&logoColor=c0ab78)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-202b32?style=flat-square&logo=supabase&logoColor=c0ab78)

</div>

---

## 探索世界

Celestian 是一个以世界设定为核心的互动站点，将百科条目、地图探索、角色档案与势力资料连接起来。当前首页直接进入百科全书。

| 模块 | 内容 | 入口 |
| :--- | :--- | :--- |
| **百科全书** | 世界设定、分类节点与条目详情 | [打开百科](https://celestian.jimmyhuang.cn/encyclopedia/) |
| **海陆图志** | 地图瓦片、地点搜索、区域与标记 | [探索地图](https://celestian.jimmyhuang.cn/map/) |
| **人物档案** | 角色资料、肖像与动态表现 | [人物档案](https://celestian.jimmyhuang.cn/character-profile.html) |
| **势力档案** | 势力介绍、徽记与主题视觉 | [势力档案](https://celestian.jimmyhuang.cn/faction-profile.html) |
| **地图工作台** | 地图涂色与数据维护 | `/map-painter/` · [使用说明](docs-map-painter.md) |

> **当前导航**：旧留影地址 `/encyclopedia/gallery` 转到地图；有求必应与制证入口 `/functions/*` 转到百科。历史源码保留供参考，不作为当前开放功能展示。

## 视觉与交互

- **古典地图装饰**：四角角花、连续几何纹带与中央凸起底牌，搭配柔和铜色、细边高光和贴边阴影。
- **人物与势力表现**：独立档案页面、主题徽记，以及部分角色的动态肖像。
- **声音体验**：背景音乐切换、渐变过渡与静音偏好。
- **本地字体**：分片加载中西文字体，构建前检查字体文件与字符覆盖。

## 本地开发

准备可运行 Vite 8 的 Node.js 环境及 npm，克隆仓库后执行：

```bash
git clone https://github.com/JimmyHuang05/celestian.git
cd celestian
npm ci
npm run dev
```

打开终端显示的本地地址。前端可本地构建；百科数据、线上 API 及部分 `/data/` 资源仍依赖现有服务，仓库不包含完整的离线数据库与服务器资源副本。

| 命令 | 用途 |
| :--- | :--- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 检查字体并生成 `dist/` 生产构建 |
| `npm run preview` | 本地预览生产构建 |
| `npm run fonts:check` | 校验字体分片与字符覆盖 |
| `npm run lint` | 运行 ESLint |
| `node --test scripts/music-controller.test.mjs` | 运行音乐控制测试 |

## 代码导览

```text
celestian/
├── src/
│   ├── pages/                    # 百科、地图与地图工作台
│   ├── components/encyclopedia/   # 百科节点与详情组件
│   ├── assets/map/                # 地图 SVG 边框与资源许可
│   ├── App.jsx                    # 主站路由
│   └── …                         # 档案、动画、音乐与样式模块
├── public/
│   ├── map/world-240705-base-v2/   # 当前地图瓦片、区域与标记数据
│   ├── fonts/                     # 本地字体分片与许可
│   ├── character-profile/         # 人物档案资源
│   ├── faction-profile/           # 势力档案数据与资源
│   └── …                         # 正式页面使用的图片与音频
├── scripts/                       # 字体检查、资源处理与维护工具
├── supabase/functions/            # Edge Functions 源码
├── index.html                     # React 主站入口
├── character-profile.html         # 人物档案入口
├── faction-profile.html           # 势力档案入口
├── vite.config.js                 # 多页面构建与开发代理
└── celestian_nginx.conf            # Nginx 配置参考
```

生产构建包含主站、人物档案、势力档案，以及 `unconventional-affairs.html`、`imperial-knights.html` 两个势力入口。未采用的设计预览页面及其专用源码仅在本地保留，不纳入仓库与生产构建。

## 资源与部署

### 仓库保存什么

| 随源码同步 | 仅在本地或服务器保留 |
| :--- | :--- |
| 前端源码、构建配置与维护脚本 | `dist/`、构建副本与部署压缩包 |
| 当前地图瓦片、区域与标记数据 | 旧地图版本与备份 |
| 正式页面引用的压缩图片、字体与音频 | 大体积原稿、未采用的试稿素材 |
| 对应资源许可证与使用说明 | 私钥、环境凭据与服务端秘密 |

排除规则见 [`.gitignore`](.gitignore)。整理仓库不会删除本地原始素材。试稿页面、专用源码及试稿素材仅在本地保留；采用这些设计时，需要补齐资源并调整忽略规则。`legacy/` 保留可维护的怀旧版源码，其生成的 `public/old/` 构建文件不提交。

### 发布流程

```text
修改源码 → 构建与验证 → 提交到 GitHub
                    ↘ 备份服务器 → 发布构建 → 检查线上页面
```

**同步 GitHub 与部署服务器是独立操作。** 推送代码本身不代表线上页面已更新。

生产站点由 Nginx 提供静态页面，数据服务使用 Supabase；部署时需保留 API 路由、SPA 回退及现有外部资源。配置参考 [`celestian_nginx.conf`](celestian_nginx.conf)，连接凭据应保存在仓库之外。

## 维护文档

| 文档 | 内容 |
| :--- | :--- |
| [地图瓦片说明](docs-map-tiles.md) | 地图资源与瓦片工作流 |
| [地图工作台说明](docs-map-painter.md) | 地图编辑与数据维护 |
| [人物美术工作流](docs-character-art-workflow.md) | 人物素材制作与处理 |

字体与第三方资源的许可说明随相应资源目录保存。

---

<div align="center">

**CELESTIAN · 无光的伊甸园**

[百科全书](https://celestian.jimmyhuang.cn/encyclopedia/) · [海陆图志](https://celestian.jimmyhuang.cn/map/)

</div>
