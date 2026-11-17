# 海陆图志 · MapPlus Assets

[简体中文](#中文) · [English](#english)

## 中文

`/mapplus/` 的运行数据、底图与覆盖层在这里。建议先看 [manifest.json](manifest.json)，它声明坐标系及实际加载的资源路径。

| 路径 | 内容 |
| --- | --- |
| [placements.json](placements.json) | 地点、文字与奇观的发布位置 |
| [source-v20261113/](source-v20261113/) | 生产版本使用的地点与标签源数据快照 |
| [political-study-v2/](political-study-v2/README.md) | 政区草案和国家资料 |
| [country-demography.json](country-demography.json) | 人口估算输入 |
| [natural-ridge-v2/](natural-ridge-v2/) | 海岸几何、水系与羊皮纸底图 |
| [terrain-16k-clean-v1/](terrain-16k-clean-v1/) · [tiles-natural-ridge-v2/](tiles-natural-ridge-v2/) · [tiles-terrain-seedvr2-4x/](tiles-terrain-seedvr2-4x/) | 缩放瓦片、变体和细节层 |

政区与位置数据依赖地图坐标系。调整范围或点位后，在本地预览核对图层、详情与选中位置。[1818 年污染范围](../../src/pollution-1818.js)与[原点资料](../../src/map-pollution-cores.js)在源码中维护。

[查看英文版 / English](#english)

---

## English

[Read in Simplified Chinese / 简体中文](#中文)

This directory contains the runtime data, basemaps, and overlays for `/mapplus/`. Start with [manifest.json](manifest.json), which defines the coordinate system and runtime asset URLs.

| Path | Contents |
| --- | --- |
| [placements.json](placements.json) | Published marker, label, and landmark positions |
| [source-v20261113/](source-v20261113/) | Place and label data snapshots used by production |
| [political-study-v2/](political-study-v2/README.md) | Political draft geometry and country records |
| [country-demography.json](country-demography.json) | Input to the population estimates |
| [natural-ridge-v2/](natural-ridge-v2/) | Coast geometry, waterways, and parchment basemap |
| [terrain-16k-clean-v1/](terrain-16k-clean-v1/) · [tiles-natural-ridge-v2/](tiles-natural-ridge-v2/) · [tiles-terrain-seedvr2-4x/](tiles-terrain-seedvr2-4x/) | Zoom tiles, variants, and detail tiles |

Territories and placements depend on the atlas coordinate system. After editing geometry, check overlays, dossiers, and selection positions in the local preview. The [1818 pollution geometry](../../src/pollution-1818.js) and [origin records](../../src/map-pollution-cores.js) live in source code.
