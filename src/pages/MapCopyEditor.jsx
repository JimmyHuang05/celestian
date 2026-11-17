import { useCallback, useEffect, useRef, useState } from 'react'
import './map-copy-editor.css'
import { buildMapShare } from '../map-ui/share.js'
import { DEFAULT_LAYERS } from '../map-ui/preferences.js'

const DRAFT_KEY = 'celestian-copy-editor-drafts-v1'
const kinds = { country: '国家 / 地区', city: '城市 / 据点', scene: '附属景点', region: '地区资料' }
const readDrafts = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {} } catch { return {} } }

export default function MapCopyEditor() {
  const [catalog, setCatalog] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [entries, setEntries] = useState({})
  const [drafts, setDrafts] = useState(readDrafts)
  const [errors, setErrors] = useState({})
  const [selected, setSelected] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(() => new URLSearchParams(location.search).get('preview') === '1')
  const refs = useRef({ catalog: null, entries: {}, drafts, errors: {}, busy: false })
  refs.current.drafts = drafts
  refs.current.entries = entries
  refs.current.errors = errors

  useEffect(() => {
    const controller = new AbortController()
    fetch('/__mapplus/copy', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw Error(data.error || '无法读取文案')
      refs.current.catalog = data
      setCatalog(data); setEntries(data.entries)
      const requested = new URLSearchParams(location.search).get('id')
      setSelected(data.nodes.some(n => n.id === requested) ? requested : data.nodes[0]?.id || '')
    }).catch(error => { if (!controller.signal.aborted) setLoadError(error.message) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts)); setStorageError(false) }
    catch { setStorageError(true) }
    function leave(event) { if (Object.keys(drafts).length) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', leave)
    return () => window.removeEventListener('beforeunload', leave)
  }, [drafts])

  const savePending = useCallback(async (retry = false) => {
    const state = refs.current
    if (state.busy || !state.catalog) return
    state.busy = true; setSaving(true)
    const failed = {}
    try {
      for (const [id, draft] of Object.entries(state.drafts)) {
        if (!state.catalog.nodes.some(n => n.id === id)) { failed[id] = { message: '条目已不在目录中，请先导出保留草稿' }; continue }
        if (state.errors[id]?.conflict || (state.errors[id] && !retry)) continue
        try {
          const response = await fetch('/__mapplus/copy', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Copy-Token': state.catalog.token },
            body: JSON.stringify({ id, description: draft.description, parentId: draft.parentId, expectedRevision: draft.baseRevision }),
          })
          const data = await response.json()
          if (!response.ok) {
            failed[id] = { message: data.error || '保存失败', conflict: response.status === 409, current: data.current }
            continue
          }
          state.entries = { ...state.entries, [id]: data.entry }
          setEntries(current => ({ ...current, [id]: data.entry }))
          setErrors(current => { const next = { ...current }; delete next[id]; return next })
          setDrafts(current => {
            const next = { ...current }
            if (next[id]?.description === draft.description && next[id]?.parentId === draft.parentId) delete next[id]
            else if (next[id]) next[id] = { ...next[id], baseRevision: data.entry.revision }
            return next
          })
        } catch { failed[id] = { message: '本地服务暂时无法连接，草稿已保留。请重试保存。' } }
      }
      if (Object.keys(failed).length) setErrors(current => ({ ...current, ...failed }))
    } finally { state.busy = false; setSaving(false) }
  }, [])

  useEffect(() => {
    if (!catalog || !Object.keys(drafts).length) return
    const timer = setTimeout(() => savePending(), 900)
    return () => clearTimeout(timer)
  }, [drafts, catalog, savePending])
  useEffect(() => {
    const onKey = event => { if ((event.ctrlKey || event.metaKey) && event.key === 's') { event.preventDefault(); savePending(true) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [savePending])

  function edit(node, fields) {
    setDrafts(current => ({ ...current, [node.id]: {
      description: entries[node.id]?.description ?? node.description,
      parentId: entries[node.id]?.parentId ?? node.parentId,
      baseRevision: entries[node.id]?.revision ?? null,
      ...current[node.id], ...fields,
    } }))
  }
  function select(id) {
    setSelected(id)
    const address = new URL(location.href); address.searchParams.set('id', id)
    window.history.replaceState(null, '', address)
  }
  function exportCopy() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), entries, drafts, nodes: catalog.nodes }, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob), link = document.createElement('a')
    link.href = href; link.download = 'celestian-文案备份.json'; link.click(); setTimeout(() => URL.revokeObjectURL(href), 1000)
  }
  function resolveConflict(useDraft) {
    const conflict = errors[selected]
    setEntries(current => ({ ...current, [selected]: conflict.current }))
    setDrafts(current => {
      const next = { ...current }
      if (useDraft) next[selected] = { ...next[selected], baseRevision: conflict.current?.revision ?? null }
      else delete next[selected]
      return next
    })
    setErrors(current => { const next = { ...current }; delete next[selected]; return next })
  }

  if (!catalog) return <div className="copy-app copy-loading"><h1>海陆图志 · 文案室</h1><p role="status">{loadError || '正在整理国家、城市与景点…'}</p>{loadError && <button onClick={() => location.reload()}>重新连接</button>}</div>
  const effective = catalog.nodes.map(node => ({ ...node, ...entries[node.id], ...drafts[node.id] }))
  const byId = new Map(effective.map(node => [node.id, node]))
  const node = byId.get(selected) || effective[0]
  const base = catalog.nodes.find(n => n.id === node.id)
  const children = effective.filter(n => n.parentId === node.id)
  const countries = effective.filter(n => n.kind === 'country')
  const chain = []; let ancestor = node
  while (ancestor) { chain.unshift(ancestor); ancestor = byId.get(ancestor.parentId) }
  const q = search.trim().toLowerCase()
  const matches = effective.filter(n => `${n.title} ${n.foreignTitle} ${n.description}`.toLowerCase().includes(q))
  const draftCount = Object.keys(drafts).length
  const error = errors[node.id]
  const saved = entries[node.id]
  const topStatus = saving ? '正在保存…' : Object.keys(errors).length ? '有内容尚未保存' : draftCount ? `待保存 ${draftCount} 项` : '所有更改已保存'
  const previewLink = (() => {
    const city = chain.find(n => n.kind === 'city')
    const region = chain.findLast(n => n.id.startsWith('region:'))
    const selection = city?.placed ? { kind: 'point', id: city.markerId } : region ? { kind: 'region', id: region.id.slice(7) } : null
    return buildMapShare(location.href, { layers: { ...DEFAULT_LAYERS, countries: true }, labelMode: 'auto',
      view: { coordinates: catalog.coordinates, center: city?.center || [.5, .5], zoom: city?.center ? 3 : 1.5 } }, selection, '/mapplus/')
  })()
  const link = (item, compact = false) => <button className={`copy-tree-item ${node.id === item.id ? 'active' : ''} ${compact ? 'nested' : ''}`} onClick={() => select(item.id)} title={item.title} aria-current={node.id === item.id ? 'page' : undefined}>
    <span>{item.title}</span>{drafts[item.id] ? <i title="未保存">●</i> : entries[item.id] ? <i className="saved" title="已编辑">✓</i> : null}
  </button>
  return <div className="copy-app">
    <header className="copy-top"><a className="copy-brand" href="/mapplus/" target="_blank" rel="noreferrer"><span>CELESTIAN ATLAS</span><strong>海陆图志 <em>文案室</em></strong></a><div className="copy-top-actions"><span className={`copy-status ${Object.keys(errors).length ? 'error' : ''}`} role="status">● {topStatus}</span><button className="copy-primary" aria-expanded={previewOpen} aria-controls="copy-live-preview" onClick={() => setPreviewOpen(value => !value)}>{previewOpen ? '收起地图预览' : '展开地图预览'}</button><button onClick={exportCopy}>导出备份</button><a href="/mapplus/" target="_blank" rel="noreferrer">打开地图 ↗</a></div></header>
    <div className="copy-layout"><aside className="copy-sidebar"><div className="copy-sidebar-head"><p>世界目录</p><label className="copy-search"><span className="copy-sr">搜索国家、城市或景点</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索国家、城市、景点…" /></label><small>{countries.length} 个国家 / 地区 · {effective.filter(n => n.kind === 'city').length} 个地点</small></div>
      <nav className="copy-tree" aria-label="国家城市景点目录">{q ? matches.map(item => <div key={item.id}>{link(item)}<small className="copy-result-kind">{kinds[item.kind]} · {byId.get(item.parentId)?.title}</small></div>) : countries.map(country => <details key={country.id} open={chain[0]?.id === country.id || undefined}>
        <summary><span>{country.title}</span><small>{effective.filter(n => n.kind === 'city' && n.parentId === country.id).length}</small></summary>
        {link(country)}{effective.filter(n => n.parentId === country.id).map(child => <div key={child.id}>{child.kind === 'city' && effective.some(n => n.parentId === child.id) ? <details open={chain.some(n => n.id === child.id) || undefined}><summary><span>{child.title}</span></summary>{link(child, true)}{effective.filter(n => n.parentId === child.id).map(scene => <div key={scene.id}>{link(scene, true)}</div>)}</details> : link(child, true)}</div>)}
      </details>)}</nav><div className="copy-sidebar-foot">在目录中选择条目，编辑后自动保存。<br />仅同步本机地图预览。</div></aside>
      <main className="copy-main"><nav className="copy-breadcrumb" aria-label="当前位置">{chain.map((item, i) => <span key={item.id}>{i > 0 && <b> / </b>}<button onClick={() => select(item.id)}>{item.title}</button></span>)}</nav>
        <div className="copy-heading"><div><p className="copy-eyebrow">{kinds[node.kind]}{node.locationType && ` · ${node.locationType}`}</p><h1>{node.title}</h1>{node.foreignTitle && <p className="copy-foreign">{node.foreignTitle}</p>}</div><a className="copy-map-link" href={previewLink} target="_blank" rel="noreferrer">在地图中查看 ↗</a></div>
        {previewOpen && <section className="copy-live-preview" id="copy-live-preview"><div className="copy-section-title"><h2>MapPlus · 实时网页预览</h2><a href={previewLink} target="_blank" rel="noreferrer">在新标签页中打开 ↗</a></div><iframe title="MapPlus 实时网页预览" src={previewLink} /><p>修改下方简介并保存，预览中的资料卡会自动更新。切换条目可定位对应地点。</p></section>}
        {storageError && <div className="copy-alert" role="alert">浏览器草稿缓存不可用，请保持页面打开并完成保存，或导出备份。</div>}
        {Object.keys(errors).length > 0 && !error && <div className="copy-alert" role="alert">其他条目有未保存的更改。<button onClick={() => select(Object.keys(errors)[0])}>查看问题条目</button></div>}
        {error && <div className="copy-alert" role="alert"><strong>{error.message}</strong>{error.conflict ? <><p>另一页面保存的内容：</p><blockquote>{error.current?.description ?? base.description}</blockquote><button onClick={() => resolveConflict(false)}>采用磁盘版本</button><button onClick={() => resolveConflict(true)}>用我的草稿保存</button></> : <button onClick={() => savePending(true)}>重试保存</button>}</div>}
        <section className="copy-editor-grid"><div className="copy-writing"><div className="copy-section-title"><h2>简介</h2><span>{node.description.length} 字</span></div><label className="copy-sr" htmlFor="copy-description">{node.title}简介</label><textarea id="copy-description" maxLength={20000} value={node.description} onChange={e => edit(base, { description: e.target.value })} placeholder="写下这里的故事…" />
          <div className="copy-save-row"><span role="status">{drafts[node.id] ? '草稿待保存 · 停止输入后自动保存' : saved?.updatedAt ? `已保存于 ${new Date(saved.updatedAt).toLocaleTimeString('zh-CN')}` : '正在使用原有文案'}</span><button className="copy-primary" disabled={saving || !draftCount} onClick={() => savePending(true)}>{saving ? '保存中…' : '立即保存'}</button></div>
          <div className="copy-tools"><button disabled={!saved?.history?.length} onClick={() => { const last = saved.history.at(-1); edit(base, { description: last.description, parentId: last.parentId }) }}>恢复上一次保存</button><button disabled={node.description === base.description} onClick={() => edit(base, { description: base.description })}>恢复原始文案</button><span>Ctrl / ⌘ + S 保存</span></div>
          {node.kind === 'city' && <label className="copy-parent">所属国家 / 地区<select value={node.parentId} onChange={e => edit(base, { parentId: e.target.value })}>{countries.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select><small>调整文案目录归属，不改变地图国界。</small></label>}
        </div><aside className="copy-preview"><p className="copy-eyebrow">阅读预览</p>{node.image && <img src={node.image} alt={node.alt || node.title} loading="lazy" />}<h2>{node.title}</h2>{node.foreignTitle && <small>{node.foreignTitle}</small>}<p className="copy-preview-text">{node.description || '这里的故事，尚待补录。'}</p><div className="copy-preview-foot">保存后，已打开的本机地图资料卡约 1 秒内更新。</div></aside></section>
        {children.length > 0 && <section className="copy-children"><div className="copy-section-title"><h2>{node.kind === 'city' ? '附属景点' : '下属地点与地区'}</h2><span>{children.length} 项</span></div><div className="copy-child-grid">{children.map(item => <button key={item.id} onClick={() => select(item.id)}>{item.image && <img src={item.image} alt="" loading="lazy" />}<div><small>{kinds[item.kind]}</small><h3>{item.title} <span>↗</span></h3><p>{item.description || '暂无简介，点击补充'}</p></div></button>)}</div></section>}
        <details className="copy-original"><summary>查看原始文案</summary><p>{base.description || '原始资料尚无简介。'}</p></details>
      </main></div>
  </div>
}
