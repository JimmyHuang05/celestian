# 2026-11-09 服务器发布核对 · Production Verification

[简体中文](#中文) · [English](#english)

## 中文

| 项目 | 历史记录 |
| --- | --- |
| 部署时间 | 2026-11-09 05:48 北京时间 · 2026-11-08 21:48 伦敦时间 |
| GitHub 比较基线 | `376482d2b3a69fed299cc1ea0de0cd88689a4ece` |
| 发布入口 | `assets/main-B7u3Q_oH.js` |
| 增量清单 | 1,706 个文件，515,180,379 字节 |
| 本地核对 | `output/map-publish-20261108` 的清单文件 SHA-256 一致 |
| 服务器增量包 | `/home/ubuntu/celestian-mapplus-20261108/update.tar.gz` |
| 完整回滚目录 | `/var/www/celestian-map-rollback-20261111-033436` |

该发布新增 `/mapplus`、`/mapplus/text`、`/mapplus/water`、`/mapplus/place`，以及 111 个地点和 28 个文字位置。[发布清单](deployment-manifest.json)中有 1,667 个当时 GitHub 基线未跟踪的资源，包含地图变体和中间素材。[原画清单](original-artwork.json)记录六张人物 PNG 的归档位置与校验信息。

增量包需与完整站点快照配合恢复。仓库整理基于已有 GitHub 源码，只移除了已关闭的数据依赖，未纳入 11 月 11–12 日的未提交工作。由于缺少完整对应源码，此历史发布没有源码恢复标签。

[查看英文版 / English](#english)

---

## English

[Read in Simplified Chinese / 简体中文](#中文)

| Item | Historical record |
| --- | --- |
| Deployment time | 2026-11-09 05:48 Beijing · 2026-11-08 21:48 London |
| GitHub comparison baseline | `376482d2b3a69fed299cc1ea0de0cd88689a4ece` |
| Published entry bundle | `assets/main-B7u3Q_oH.js` |
| Incremental manifest | 1,706 files, 515,180,379 bytes |
| Local verification | SHA-256 matches for the manifest files in `output/map-publish-20261108` |
| Server update bundle | `/home/ubuntu/celestian-mapplus-20261108/update.tar.gz` |
| Full rollback directory | `/var/www/celestian-map-rollback-20261111-033436` |

The release introduced `/mapplus`, `/mapplus/text`, `/mapplus/water`, and `/mapplus/place`, plus 111 place positions and 28 text positions. The [deployment manifest](deployment-manifest.json) contains 1,667 assets absent from the GitHub baseline, including map variants and intermediate art. The [artwork inventory](original-artwork.json) records archive locations and checksums for six original character PNGs.

Restoring the incremental release requires a complete site snapshot. The repository cleanup started from committed GitHub source and removed retired data dependencies. It excluded uncommitted work from November 11–12. A matching full source snapshot was unavailable, so there is no source-restoration tag for this historical deployment.
