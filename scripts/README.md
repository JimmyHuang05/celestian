# 维护脚本

为避免破坏现有调用，已有地图、字体和检查脚本保留原路径。

| 分类 | 路径或名称 |
| --- | --- |
| 美术资产 | `assets/*.py`，原根目录的四个美术制作工具 |
| 字体 | `check-fonts.mjs`、`sync-fonts.py`、`font-*.mjs` |
| 地图制作 | `build-map-tiles.py`、`trace-map-*.py`、`index-map-labels.py` |
| 页面检查 | `check-*.cjs`、`test-*.cjs`、`test-*.mjs` |
| 历史发布工具 | `package-*.py`、`publish-*.py`、`prepare-*.py` |

部分美术与发布工具依赖仓库外的原图、服务器数据或本机工具链，不能当作构建前置步骤。美术工具解析仓库根目录的路径已随移动更新；通常从仓库根目录调用，例如 `python scripts/assets/optimize-character-assets.py`。

检查当前只读数据接口：`node --test scripts/entries-api.test.mjs`。构建检查：`npm run build`。浏览器检查工具需要另外准备 Playwright。
