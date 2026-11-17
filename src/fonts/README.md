# 共享字体 · Shared Typography

[简体中文](#中文) · [English](#english)

## 中文

生产 HTML 加载 [index.css](index.css)，字体来自同源的 `/fonts/v1/`。[faces.css](faces.css) 与 [font-sources.json](font-sources.json) 由工具生成，记录来源、Unicode 覆盖和校验信息。授权文件和字体一同保存在 [public/fonts/v1](../../public/fonts/v1/)。

| CSS 角色 | 用途 |
| --- | --- |
| `--font-body` · `--font-display` | Noto Serif SC 中文正文与 Cinzel 拉丁标题 |
| `--font-mono` · `--font-ui` | JetBrains Mono 数字及终端，与系统无衬线控件 |
| `--font-decorative` · `--font-signature` | 峄山篆书装饰标题与 Mrs Saint Delafield 签名 |
| `--font-classic` · `--font-editorial` | 拉丁小字与编辑样式，均有中文回退 |

共享预加载包覆盖重点标题。其余中文依赖 `unicode-range` 按需加载，`font-display: swap` 让低速连接也能先读到正文。页面字号、行高和间距在对应样式中维护。

- `npm run fonts:check` 检查文件完整性、字形覆盖、字重及预加载。
- `npm run fonts:test-loading` 在浏览器检查冷缓存、字体复用与加载回退。可用 `PREVIEW_URL`、`PLAYWRIGHT_PATH`、`BROWSER_BIN` 指定环境。
- `npm run fonts:sync` 重建优先字包、CSS、锁文件和 HTML 预加载地址。需要 Python、fonttools 与 brotli。
- `python scripts/sync-fonts.py --refresh` 显式刷新上游版本。刷新后运行校验并核对桌面与移动端实际渲染的字形。

自定义构建若禁用 public 复制，发布包仍应包含 `/fonts/v1/` 与许可文件。

[查看英文版 / English](#english)

---

## English

[Read in Simplified Chinese / 简体中文](#中文)

Production HTML loads [index.css](index.css), with same-origin fonts under `/fonts/v1/`. The generated [faces.css](faces.css) and [font-sources.json](font-sources.json) track sources, Unicode coverage, and checksums. Licenses live with the font files in [public/fonts/v1](../../public/fonts/v1/).

| CSS role | Purpose |
| --- | --- |
| `--font-body` · `--font-display` | Noto Serif SC for Chinese text and Cinzel for Latin headings |
| `--font-mono` · `--font-ui` | JetBrains Mono for numbers and terminal text, and system sans serif for controls |
| `--font-decorative` · `--font-signature` | Yishan seal script for ornaments and Mrs Saint Delafield for signatures |
| `--font-classic` · `--font-editorial` | Latin caption and editorial stacks with Chinese fallback |

The shared preload covers priority headings. Other Chinese glyphs load on demand through `unicode-range`. With `font-display: swap`, text is readable on slow connections. Set sizes, line heights, and spacing in page styles.

- `npm run fonts:check` verifies integrity, glyph coverage, weights, and preloads.
- `npm run fonts:test-loading` checks cold-cache behavior, reuse, and fallback in a browser. Set `PREVIEW_URL`, `PLAYWRIGHT_PATH`, or `BROWSER_BIN` as needed.
- `npm run fonts:sync` regenerates priority packs, CSS, the lock file, and HTML preload URLs. It requires Python, fonttools, and brotli.
- `python scripts/sync-fonts.py --refresh` explicitly updates upstream versions. After refreshing, run the checks and inspect actual rendered glyphs on desktop and mobile.

Custom builds that disable public copying should still package `/fonts/v1/` and its licenses.
