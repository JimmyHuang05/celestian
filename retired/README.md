# 已关闭的历史功能

本目录只供查阅，不参与 Vite 构建、ESLint 或部署。

| 路径 | 原位置与用途 | 状态 |
| --- | --- | --- |
| `deepseek/edge-function.ts` | `supabase/functions/Deepseek_API/index.ts`，DeepSeek 对话接口 | 停用 |
| `frontend/FunctionsPage.jsx` | `src/pages/FunctionsPage.jsx`，有求必应与对话页 | 停用，旧地址转百科 |
| `frontend/BadgePage.jsx` | `src/pages/BadgePage.jsx`，制证页 | 停用，旧地址转百科 |
| `supabase/client.js` | `src/lib/supabaseClient.js`，旧客户端初始化 | 停用，已替换为同源 API |
| `supabase/keepalive.yml.txt` | `.github/workflows/keepalive.yml`，定时保活 | 改为文本，不会执行 |

历史前端文件仍保留原有相对 import，不能从归档目录直接运行。若确需恢复，须按原位置还原并重新审查接口、配置及依赖；不要直接启用旧工作流。当前主站不再安装 Supabase SDK 或 CLI。

`legacy/` 则是仍能独立构建的怀旧版，其源码不属于这里的废弃代码。
