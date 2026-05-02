import { createClient } from '@supabase/supabase-js'

const URL = 'https://qunhjfulchaurfxtjoeg.supabase.co'
const KEY = 'sb_secret_PLACEHOLDER_REPLACE_WITH_YOUR_KEY'
const supabase = createClient(URL, KEY)

function parseVersion(code) {
  const parts = code.replace('v', '').split('.').map(Number)
  return { v1: parts[0] || 0, v2: parts[1] || 0, v3: parts[2] || 0 }
}

function sortVersions(versions) {
  return versions.sort((a, b) => {
    const va = parseVersion(a.code)
    const vb = parseVersion(b.code)
    if (vb.v1 !== va.v1) return vb.v1 - va.v1
    if (vb.v2 !== va.v2) return vb.v2 - va.v2
    return vb.v3 - va.v3
  })
}

const logData = [
  {
    code: 'v1.1.1',
    time: '2026-05-02',
    title: '数据库迁移与架构重构',
    desc: '完成 Supabase 数据库从旧项目至新项目的完整迁移，数据零丢失。\n迁移「有求必应」Deepseek_API 边缘函数至新项目，新增 HTTPS 代理配置。\n更新「有求必应」AI 模型为 deepseek-v4-flash，适配最新 API 标准。\n重构「百科全书」入口为 URL 驱动模式（/encyclopedia/:nodeId?id=xxx），支持深链直达与刷新恢复。\n重构「百科全书」详情组件为独立页面，移除弹窗叠加层。\n重构「百科全书」打开/关闭动画，消除闪屏与分层问题。\n重构「All in One 开发者端」条目编辑器，元数据独立存储至数据库列。\n重构 entries 表结构：分离 title_icon_url、alien_text、blocks 等为独立列。\n优化「百科全书」打开动画，光效面板常驻为零闪屏背景层。\n优化「All in One 开发者端」自动计算 Sort Order。',
  },
  {
    code: 'v1.1.0',
    time: '2026-05-01',
    title: '工业系统架构迁移',
    desc: '全面完成 Vue 3 至 React 19 的架构迁移，项目由纯静态 HTML 重构为 Vite + React SPA。\n迁移「百科全书」「海陆图志」「有求必应」至 React 组件架构。\n新增「All in One 开发者端」开发日志编辑器。\n重构「All in One 开发者端」编辑器，分离为独立 HTML 静态文件部署。\n重构素材资源目录为 audio/bgm+sfx、images/icons+cards、map 规范化分类。\n优化 Lucide 图标因 React 重渲染导致闪烁消失的问题，引入 rAF 机制。\n优化页面路由切换时首页黑屏与初始化不执行的竞态问题。',
  },
  {
    code: 'v1.0.1',
    time: '2026-04-30',
    title: '数据库更新',
    desc: '更新「百科全书」词条。\n重构「百科全书」部分节点详情页 UI，提供沉浸式浏览体验。\n更新「All in One 开发者端」部分节点 UI，适配新版「百科全书」。',
  },
  {
    code: 'v1.0.0',
    time: '2026-04-28',
    title: '巴别塔恢复运行',
    desc: 'DEMO 阶段结束，正式版本上线。\n新增「有求必应」AI 响应次数限制：单个 IP 每日可用 3 次。\n更新「百科全书」词条。\n更新「海陆图志」数据。\n更新「有求必应」AI 提示词。\n重构「有求必应」背景动画，减少用户端性能消耗。\n重构「All in One 开发者端」UI，视觉全新升级。\n优化所有页面的加载速度，二次压缩素材，启用懒加载。\n优化「主页」首屏阻塞现象。',
  },
  {
    code: 'v0.4.1',
    time: '2026-04-27',
    title: '自主人工智能苏醒',
    desc: '新增「有求必应」AI 功能，调用 Supabase Edge Functions 接入 Deepseek-v4-flash 模型。\n新增「有求必应」背景音乐。\n重构「海陆图志」的地区详情 UI，实现浮窗化和流畅动画。\n优化「海陆图志」的移动端适配。',
  },
  {
    code: 'v0.4.0',
    time: '2026-04-26',
    title: '工业污染评估与处理组恢复工作',
    desc: '新增「有求必应」页面。\n重构「百科全书」背景动画，减少用户端性能消耗。\n优化「百科全书」的 UI 设计。',
  },
  {
    code: 'v0.3.1',
    time: '2026-04-23',
    title: '数据库更新',
    desc: '更新「百科全书」词条。\n更新「海陆图志」数据。\n优化「百科全书」的图片容器逻辑与文字排版逻辑。',
  },
  {
    code: 'v0.3.0',
    time: '2026-04-21',
    title: '数据库接入供能系统',
    desc: '新增「百科全书」页面，未来将收录 200+ 词条。\n新增「百科全书」背景音乐。\n优化「主页」的卡片平移动画。',
  },
  {
    code: 'v0.2.2',
    time: '2026-04-19',
    title: '全域广播系统开播',
    desc: '重构「主页」UI。\n新增「主页」背景音乐及移动端适配优化。\n新增「海陆图志」全局搜索与过滤功能。',
  },
  {
    code: 'v0.2.1',
    time: '2026-04-14',
    title: '通信链路重构',
    desc: '废除旧有 UI/交互架构，全面引入 Vue3 技术栈。\n新增「海陆图志」SVG 地区图层弹窗。',
  },
  {
    code: 'v0.2.0',
    time: '2026-04-13',
    title: '遗落王座响应请求',
    desc: '新增「海陆图志」页面。',
  },
  {
    code: 'v0.1.1',
    time: '2026-04-12',
    title: '工业母机重启',
    desc: 'Supabase 已完全适配基础框架。\n新增「All in One 开发者端」。',
  },
  {
    code: 'v0.1.0',
    time: '2026-04-11',
    title: '工业系统重启',
    desc: '域名通过审核及备案，「无光的伊甸园」项目上线。',
  },
  {
    code: 'v0.0.2',
    time: '2026-04-08',
    title: '海上作业平台恢复运行',
    desc: '企划进入后期技术实现阶段。',
  },
  {
    code: 'v0.0.1',
    time: '2026-04-05',
    title: '核反应堆重启',
    desc: '企划进入中期设计阶段。',
  },
  {
    code: 'v0.0.0',
    time: '2026-04-01',
    title: '工业污染评估与处理组重组',
    desc: '创建「无光的伊甸园」项目企划。',
  },
]

async function main() {
  // 按版本号从大到小排序
  const sorted = sortVersions([...logData])

  console.log('更新顺序：')
  sorted.forEach((log, i) => {
    console.log(`  ${i + 1}. ${log.code} (${log.time})`)
  })

  // 更新时间基准：按时间排序，从 09:00:00 开始，每个间隔 1800 秒
  const baseDate = new Date('2026-04-01T09:00:00Z')
  
  for (const log of sorted) {
    const logDate = new Date(log.time + 'T09:00:00Z')
    let offset = 0
    // 同一天的需要计算顺序
    const sameDayLogs = sorted.filter(l => l.time === log.time)
    const sameDayIndex = sameDayLogs.findIndex(l => l.code === log.code)
    offset = sameDayIndex * 1800
    
    const createdAt = new Date(logDate.getTime() + offset * 1000).toISOString()

    const { error } = await supabase
      .from('system_logs')
      .update({
        code: log.code,
        time: log.time,
        title: log.title,
        desc: log.desc,
        created_at: createdAt,
      })
      .eq('code', log.code)

    if (error) {
      console.error(`更新 ${log.code} 失败:`, error.message)
    } else {
      console.log(`✅ ${log.code} -> ${createdAt.slice(0,19)}`)
    }
  }

  // 验证排序
  const { data: verify } = await supabase
    .from('system_logs')
    .select('code, time, created_at')
    .order('created_at', { ascending: false })

  console.log('\n验证排序（从新到旧）：')
  verify.forEach((v, i) => console.log(`  ${i+1}. ${v.code} (${v.time})`))
}

main().catch(console.error)
