# 怀旧版 /old

保留角色立绘、留影布局和百科分类图标改版前的页面。它是独立构建，当前站点不导入这里的组件。

来源：`archive/celestian/src` 的原始生产 API 版本（2026 年 7 月页面）；分类定义恢复自服务器 `celestian-gallery-20261011` 改版前备份，七枚原始 SVG 单独保存。公开 API 仍保存旧五位角色的原始立绘和故事，2026-10-16 将其及其他公开条目存入 `public/snapshot.json`。不访问实时 API，不包含编辑器或管理数据。原始插图、音乐等继续引用原有资产域名。

仅做路径兼容：路由 basename 为 `/old`，首页链接保持在旧版，音乐存储单独命名，右下角可以返回新版。未加载新版共享徽章样式或动画脚本。

构建：在仓库根目录运行 `npx vite build --config legacy/vite.config.js`。输出在 `public/old`，不覆盖主站。`scripts/old-preview.js` 支持本地 `/old` 及深链接。

服务器须配置 `location /old/ { try_files $uri $uri/ /old/index.html; }`，并将 `/old` 转至 `/old/`。对 `/old/assets/` 使用 `try_files $uri =404`。部署只同步 `public/old` 和相应 nginx 路由，不修改主站入口。
