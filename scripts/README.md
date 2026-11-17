# 维护脚本 · Maintenance Scripts

[简体中文](#中文) · [English](#english)

## 中文

通常从仓库根目录运行。浏览器验收、美术处理和历史发布另有工具需求。

| 任务 | 入口 |
| --- | --- |
| 主站构建与字体校验 | `npm run build` · `npm run fonts:check` |
| 字体更新 | `npm run fonts:sync` · [字体说明](../src/fonts/README.md) |
| 只读 API 测试 | `node --test scripts/entries-api.test.mjs` |
| 地图生成 | `build-map-tiles.py` · `trace-map-*.py` · `index-map-labels.py` |
| 浏览器验收 | `check-*.cjs` 和有关 `test-*.cjs`，按各脚本要求准备 Playwright |
| 美术与历史发布 | [assets/](assets/README.md) · `prepare-*` · `package-*` · `publish-*` |

生成资源或发布前先核对脚本输入与目标版本。部分工具依赖外部原图、特定预览地址或服务器数据。

[查看英文版 / English](#english)

---

## English

[Read in Simplified Chinese / 简体中文](#中文)

Run scripts from the repository root. Browser checks, artwork processing, and historical releases have additional tool requirements.

| Task | Entry point |
| --- | --- |
| Site build and font integrity | `npm run build` · `npm run fonts:check` |
| Font updates | `npm run fonts:sync` · [Typography guide](../src/fonts/README.md#english) |
| Read-only API tests | `node --test scripts/entries-api.test.mjs` |
| Map generation | `build-map-tiles.py` · `trace-map-*.py` · `index-map-labels.py` |
| Browser checks | `check-*.cjs` and related tests; see each script's Playwright setup |
| Art and historical releases | [assets/](assets/README.md#english) · `prepare-*` · `package-*` · `publish-*` |

Check inputs and target versions before generating assets or publishing. Some tools expect external artwork, a specific preview URL, or server data.
