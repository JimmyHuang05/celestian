# 运维 · Operations

[简体中文](#中文) · [English](#english)

## 中文

主站使用 Nginx 服务 Vite 静态产物。React 路由需要 SPA 回退，怀旧版使用自己的 `/old/` 路由。百科通过同源 `/api/entries/counts` 和 `/api/entries/node/:nodeId` 获取条目。

[nginx/celestian.conf](nginx/celestian.conf) 是历史配置参考。线上还包含 HTTPS、API 和 MapPlus 路由，发布前以正在生效的配置为准。详情见[部署与数据服务](../docs/operations.md)及[版本记录](../docs/releases/README.md)。

[查看英文版 / English](#english)

---

## English

[Read in Simplified Chinese / 简体中文](#中文)

Nginx serves the Vite build. React routes need an SPA fallback, while the classic edition uses its own `/old/` routes. The encyclopedia reads entries from the same-origin endpoints `/api/entries/counts` and `/api/entries/node/:nodeId`.

[nginx/celestian.conf](nginx/celestian.conf) is a historical reference. Production also configures HTTPS, APIs, and MapPlus routes. Review the active configuration before deploying. See [deployment and data services](../docs/operations.md) and the [release records](../docs/releases/README.md#english).
