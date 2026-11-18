# CELESTIAN · 无光的伊甸园

[简体中文](#中文) · [English](#english)

## 中文

原创世界观的互动档案馆，收录百科、海陆图志、人物与势力档案。**MapPlus 1818** 增加了污染原点、危害估算和逐年情报，并在地图与国家略图中展示污染范围。

[访问站点](https://celestian.jimmyhuang.cn/) · [打开 MapPlus](https://celestian.jimmyhuang.cn/mapplus/) · [开发文档](docs/README.md)

### 从哪里开始

| 页面 | 地址 | 内容 |
| --- | --- | --- |
| 百科全书 | `/encyclopedia/` | 世界观条目与档案入口 |
| MapPlus | `/mapplus/` | 1818 年地图、政区详情和污染图层 |
| 海陆图志 | `/map/` | 原版地图与地点资料 |
| 人物与势力 | `/character-profile.html` · `/faction-profile.html` | 独立档案 |
| 地图工作台 | `/mapplus/migrate` · `/map-painter/` | 点位迁移与地图编辑 |
| 怀旧版 | `/old/` | 独立构建的冻结版本 |

### 本地运行

使用 Node.js 20.19+（20.x）或 22.12+ 和 npm，在仓库根目录运行：

```sh
npm ci
npm run dev
```

打开终端显示的地址，进入 `/mapplus/`。运行 `npm run build` 生成 `dist/`，用 `npm run preview` 验收产物。字体校验已包含在构建中，也可以单独运行 `npm run fonts:check`。

地图使用本仓库中的数据和瓦片。百科实时条目通过同源只读 API 获取，开发与预览环境把公开查询代理到现有站点。离线时仍可查看本地地图，实时百科需要网络。详见[部署与数据服务](docs/operations.md)。

### 仓库导览

| 目录 | 用途 |
| --- | --- |
| [src](src/README.md) | 页面、组件、地图逻辑与共享样式 |
| [public](public/README.md) | 浏览器直接读取的图像、字体、音频和数据 |
| [scripts](scripts/README.md) | 校验、生成与维护工具 |
| [docs](docs/README.md) | 地图、美术、运维和版本记录 |
| [design](design/README.md) | 可编辑的地图设计源文件 |
| [ops](ops/README.md) | 服务器配置参考 |
| [legacy](legacy/README.md) | 可独立构建的怀旧站点 |
| [retired](retired/README.md) | 已退役实现 |

### 发布

GitHub 源码与线上发布分别管理。部署时将构建与对应地图资源一起验收。原画、服务器快照和回滚包按项目归档规则保管，依赖、构建输出及私密凭据留在仓库外。见[发布记录](docs/releases/README.md)。

[查看英文版 / English](#english)

---

## English

[Read in Simplified Chinese / 简体中文](#中文)

An interactive archive for an original fictional world, featuring an encyclopedia, an atlas, and character and faction dossiers. **MapPlus 1818** adds pollution origins, hazard estimates, and annual reports, with affected areas shown on the map and in country insets.

[Visit the site](https://celestian.jimmyhuang.cn/) · [Open MapPlus](https://celestian.jimmyhuang.cn/mapplus/) · [Developer docs](docs/README.md#english)

### Explore the site

| Page | Route | Contents |
| --- | --- | --- |
| Encyclopedia | `/encyclopedia/` | Worldbuilding entries and dossier links |
| MapPlus | `/mapplus/` | The 1818 atlas, political dossiers, and pollution overlays |
| Original Atlas | `/map/` | The original map and place records |
| Characters and Factions | `/character-profile.html` · `/faction-profile.html` | Standalone dossiers |
| Map Workbench | `/mapplus/migrate` · `/map-painter/` | Placement migration and map editing |
| Classic Edition | `/old/` | A frozen, independently built edition |

### Run locally

Use Node.js 20.19+ (20.x) or 22.12+ with npm. From the repository root:

```sh
npm ci
npm run dev
```

Open the address printed by Vite and visit `/mapplus/`. Use `npm run build` to produce `dist/`, then `npm run preview` to check it. The build runs the font checks first. To run those checks separately, use `npm run fonts:check`.

The atlas uses data and tiles from the checkout. Live encyclopedia entries use a same-origin, read-only API. Development and preview proxy public queries to the live site. Local maps are available offline; live entries require connectivity. See [deployment and data services](docs/operations.md).

### Repository guide

| Directory | Purpose |
| --- | --- |
| [src](src/README.md#english) | Pages, components, map logic, and shared styles |
| [public](public/README.md#english) | Browser-served images, fonts, audio, and data |
| [scripts](scripts/README.md#english) | Validation, generation, and maintenance tools |
| [docs](docs/README.md#english) | Atlas, art, operations, and release documentation |
| [design](design/README.md#english) | Editable map artwork |
| [ops](ops/README.md#english) | Server configuration reference |
| [legacy](legacy/README.md#english) | Independently built classic site |
| [retired](retired/README.md#english) | Historical implementations |

### Release

GitHub source control and production deployment are separate workflows. Validate the build and its matching map assets together. Keep original artwork, server snapshots, and rollback bundles in the project archive. Keep dependencies, build outputs, and credentials outside Git. See the [release records](docs/releases/README.md#english).

包含 MapPlus 素材的生产构建还需要 Python 3 和 Pillow（`python -m pip install Pillow`）。构建会从当前政区草稿、国家资料和水系原图生成带内容哈希的浏览数据、污染遮罩、水系瓦片与内嵌纸纹的底图。发布时随构建目录完整上传 `assets/`，包括水系瓦片子目录。如果 Python 命令名不同，可以通过 `MAPPLUS_PYTHON` 指定。

Production builds with MapPlus assets require Python 3 and Pillow. Set MAPPLUS_PYTHON if the Python command differs. Ship the entire generated assets directory, including the water and paper-textured basemap tile subdirectories.
