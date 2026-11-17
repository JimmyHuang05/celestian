# 怀旧版 · Classic Edition

[简体中文](#中文) · [English](#english)

## 中文

`/old/` 保存立绘、留影布局和百科分类图标改版前的页面。源码源自 2026 年 7 月站点，分类图标取自 10 月 11 日改版前备份，10 月 16 日收录的公开条目存于 [public/snapshot.json](public/snapshot.json)。插图和音乐仍可能从原资产域名加载。

在仓库根目录运行：

```sh
npx vite build --config legacy/vite.config.js
```

产物写入 `public/old/`。根站 Vite 通过 [old-preview.js](../scripts/old-preview.js) 支持 `/old` 和深链接。旧版路由基址为 `/old`，音乐使用独立的存储键，数据读取冻结快照。

部署时将 `/old` 转至 `/old/`，对 `/old/` 使用 `try_files $uri $uri/ /old/index.html`，对 `/old/assets/` 使用 `try_files $uri =404`。见[运维索引](../ops/README.md)。

[查看英文版 / English](#english)

---

## English

[Read in Simplified Chinese / 简体中文](#中文)

The `/old/` edition preserves the character illustrations, gallery layout, and encyclopedia icons from before the redesign. It draws on the July 2026 site and the October 11 pre-redesign backup. Public entries captured on October 16 are in [public/snapshot.json](public/snapshot.json). Some artwork and music still load from their original asset hosts.

Run from the repository root:

```sh
npx vite build --config legacy/vite.config.js
```

Output is written to `public/old/`. The root Vite server supports `/old` and deep links through [old-preview.js](../scripts/old-preview.js). The edition uses `/old` as its route basename, a separate music preference key, and a frozen data snapshot.

On deployment, redirect `/old` to `/old/`. Use `try_files $uri $uri/ /old/index.html` under `/old/`, and `try_files $uri =404` under `/old/assets/`. See the [operations guide](../ops/README.md#english).
