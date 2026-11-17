# 势力档案 · Faction Dossiers

[简体中文](#中文) · [English](#english)

## 中文

在 [factions.json](factions.json) 中维护档案。每个对象对应一个势力，统一由 [faction-archive.js](../../src/faction-archive.js) 和 [faction-archive.css](../../src/faction-archive.css) 渲染。新增条目后可通过 `/faction-profile.html?id=<id>` 访问，百科索引会读取同一数据。

| 字段 | 用途 |
| --- | --- |
| `id` · `name` | 唯一英文标识和显示名 |
| `affiliation` · `subtitle` | 归属和副标题 |
| `emblem` · `emblemAlt` | 纹章路径及文字说明。缺图时使用星形占位。 |
| `emblemLayout` · `banners` | 可用 `banner` 显示完整竖旗；五枚旗帜按 `src` 与 `alt` 从左至右排列，中间一枚最大。 |
| `music` | [曲库](../../src/music-library.js)中的曲目 ID，默认为百科背景音乐。 |
| `blocks` | `key-value`（`key`、`value`）、`heading`、`paragraph`、`quote`（可有 `author`）、`image`（`url`、`caption`）。文字内容用 `content`。 |

改完内容后运行 `npm run fonts:sync` 与 `npm run fonts:check`，再核对档案入口、旗帜和正文。

[查看英文版 / English](#english)

---

## English

[Read in Simplified Chinese / 简体中文](#中文)

Edit dossiers in [factions.json](factions.json). Each object describes one faction, rendered by the shared [faction-archive.js](../../src/faction-archive.js) and [faction-archive.css](../../src/faction-archive.css). New entries are accessible at `/faction-profile.html?id=<id>`. The encyclopedia index reads the same catalog.

| Field | Purpose |
| --- | --- |
| `id` · `name` | Unique English identifier and display name |
| `affiliation` · `subtitle` | Affiliation and short subtitle |
| `emblem` · `emblemAlt` | Emblem path and alternative text. A star is used if the emblem is unavailable. |
| `emblemLayout` · `banners` | Use `banner` for a full vertical flag. Give the five flags `src` and `alt` values in left-to-right order. The central flag renders largest. |
| `music` | Track ID in the [music library](../../src/music-library.js). Defaults to the encyclopedia track. |
| `blocks` | `key-value` (`key`, `value`), `heading`, `paragraph`, `quote` (optional `author`), and `image` (`url`, `caption`). Text blocks use `content`. |

After editing, run `npm run fonts:sync` and `npm run fonts:check`, then check the dossier URL, flags, and text.
