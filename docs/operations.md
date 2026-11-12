# 部署与数据服务

主站由 Nginx 提供静态页面，React 路由需要 SPA 回退。百科数据由服务器现有 `/api/` 服务提供，不再从 Supabase 查询。

| 公开 GET 接口 | 返回数据 |
| --- | --- |
| `/api/entries/counts` | `{data: [{node_id, count}], error: null}` |
| `/api/entries/node/:nodeId` | `{data: [...条目], error: null, meta: {...}}` |

开发和预览代理只开放现有的公开查询，不代理写入接口。API 错误不会回退到已关闭的 Supabase。

`ops/nginx/celestian.conf` 是历史配置参考，并非线上生效配置的完整副本，不能直接覆盖服务器：线上另有 HTTPS、`/api/`、`/dialogue/api/` 和 `/mapplus/` 配置。发布前应读取生效配置并保留这些服务。

`legacy/` 读取自己的冻结快照；部署操作见其 README。`retired/` 不属于构建和发布输入，不应复制到网站公开目录。

原始素材和部署包保存在代码仓库之外。六张已核实人物 PNG 的服务器位置与哈希见 `releases/2026-11-09/original-artwork.json`，重新生成 WebP 前应先取回对应原图。服务器素材也应有独立备份。
