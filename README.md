# CELESTIAN · 无光的伊甸园

个人原创世界观展示站，包含百科、海陆图志、人物与势力档案。

[访问网站](https://celestian.jimmyhuang.cn/) · [文档目录](docs/README.md) · [历史功能](retired/README.md)

## 页面

| 页面 | 地址 |
| --- | --- |
| 百科全书 | `/encyclopedia/` |
| 海陆图志 | `/map/` |
| 人物档案 | `/character-profile.html` |
| 势力档案 | `/faction-profile.html` |
| 地图涂色工作台 | `/map-painter/` |
| 怀旧版 | `/old/`，独立构建，说明见 [legacy](legacy/README.md) |

服务器还保存有 `/mapplus/` 发布版本。[11 月 9 日发布记录](docs/releases/2026-11-09/README.md)记录了已验证的构建清单；本仓库当前源码不声称能重建该历史发布。

## 开发

使用支持 Vite 8 的 Node.js 环境：

```sh
npm ci
npm run dev
npm run build
```

`npm run preview` 预览生产构建，`npm run fonts:check` 校验字体。

前端通过同源只读 API `/api/entries/counts` 和 `/api/entries/node/:nodeId` 获取百科数据。开发及预览服务器将这些公开查询代理到现有站点；不需要 Supabase 账号或密钥。仓库不包含服务端数据库，离线运行时无法加载实时条目。

## 仓库结构

```text
src/          当前页面、组件、音乐和地图逻辑
public/       正式页面使用的压缩图片、字体、音频和地图资源
scripts/      检查、构建和维护工具；美术工具在 scripts/assets/
docs/         地图、美术、运维及历史发布说明
ops/          服务器配置参考
legacy/       可独立构建的怀旧版站点
retired/      已关闭的旧功能与 Supabase、DeepSeek 参考代码
design/       地图矢量制作源文件
```

根目录保留页面入口、开发配置与项目说明。具体说明见 [文档目录](docs/README.md)、[脚本导览](scripts/README.md)。

## 资源与发布

- GitHub 保存代码、配置及网页实际使用的压缩资源；大体积原图、试稿、部署压缩包由服务器或本地素材库保存。
- 已从当前源码树移出的六张人物 PNG，均先与服务器历史快照逐一核对 SHA-256；[原图清单](docs/releases/2026-11-09/original-artwork.json)保留校验记录。WebP 展示图和头像继续随代码保存。
- 地图矢量源文件是可编辑制作资料，继续保留在 `design/map-sources/`。
- 私钥、环境凭据、依赖目录和构建输出不提交。删除工作树文件不会移除已有 Git 历史，本次不重写历史。
- 推送 GitHub 与发布服务器相互独立；整理仓库不会更新线上站点。

旧 `/functions/*` 地址仍转到百科，历史实现位于 `retired/`。Supabase 和 DeepSeek 已退出当前构建，相关工作流也已停用。
