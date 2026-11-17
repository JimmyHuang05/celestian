# 地图界面 · Map Interface

[简体中文](#中文) · [English](#english)

## 中文

本目录负责地图的图层控制、搜索、点位显示、分享与详情。外层页面及布局见 [MapPage.jsx](../pages/MapPage.jsx) 和 [map.css](../pages/map.css)。

| 模块 | 职责 |
| --- | --- |
| [MapDetail.jsx](MapDetail.jsx) | 国家、地点和污染原点的详情面板 |
| [MapControls.jsx](MapControls.jsx) · [MapBasemapPicker.jsx](MapBasemapPicker.jsx) | 图例、图层和底图切换 |
| [MapSearch.jsx](MapSearch.jsx) · [marker-visibility.js](marker-visibility.js) | 地图搜索与标记显隐 |
| [region-presentation.js](region-presentation.js) · [share.js](share.js) | 区域状态显示与分享视图 |

地图图标由 [map-markers.js](../map-markers.js) 生成，污染原点用同一配色贯通标记、图例与详情。

[查看英文版 / English](#english)

---

## English

[Read in Simplified Chinese / 简体中文](#中文)

This directory owns layer controls, search, marker visibility, sharing, and dossiers. The page shell and styles live in [MapPage.jsx](../pages/MapPage.jsx) and [map.css](../pages/map.css).

| Module | Responsibility |
| --- | --- |
| [MapDetail.jsx](MapDetail.jsx) | Country, place, and pollution-origin panels |
| [MapControls.jsx](MapControls.jsx) · [MapBasemapPicker.jsx](MapBasemapPicker.jsx) | Legend, layers, and basemap selection |
| [MapSearch.jsx](MapSearch.jsx) · [marker-visibility.js](marker-visibility.js) | Map search and marker visibility |
| [region-presentation.js](region-presentation.js) · [share.js](share.js) | Region presentation and shareable views |

[map-markers.js](../map-markers.js) draws the map symbols. Origin colors are shared by markers, the legend, and dossier insets.
