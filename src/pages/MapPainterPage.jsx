import { useEffect, useRef, useState } from 'react'
import { PaintRuntime } from '../map-painter/runtime.js'
import '../map-painter/painter.css'

const INITIAL = { ready: false, regions: [], selected: 1, undo: false, redo: false, saveStatus: '正在准备地图…' }
const TOOLS = [{ id: 'paint', label: '涂色', path: 'm4 20 4-1 11-11-3-3L5 16zM14 7l3 3' }, { id: 'erase', label: '擦除', path: 'm4 14 9-10 7 7-9 10H9zM9 9l7 7M11 21h10' }, { id: 'move', label: '移动', path: 'M12 3v18M3 12h18m-12-6 3-3 3 3m-6 12 3 3 3-3M6 9l-3 3 3 3m12-6 3 3-3 3' }]

export default function MapPainterPage() {
  const mapHost = useRef(null), runtime = useRef(null), importInput = useRef(null)
  const [state, setState] = useState(INITIAL)
  const [tool, setTool] = useState('paint'), [size, setSize] = useState(32)
  const [error, setError] = useState(''), [restoreFile, setRestoreFile] = useState(null)
  const [working, setWorking] = useState(false)
  const [repairMessage, setRepairMessage] = useState('')
  const [showLabels, setShowLabels] = useState(true)
  const [showLegacy, setShowLegacy] = useState(false)
  const [loadingLegacy, setLoadingLegacy] = useState(false)
  const [regionSearch, setRegionSearch] = useState('')
  const current = state.regions.find(region => region.id === state.selected)
  const query = regionSearch.trim().toLowerCase()
  const filteredRegions = state.regions.filter(region => !query || [region.name, region.source?.regionId, region.source?.groupId, region.source?.subGroupId, ...(region.sources || []).flatMap(source => [source.regionId, source.groupId, source.subGroupId, source.originalName])].filter(Boolean).join(' ').toLowerCase().includes(query))

  useEffect(() => {
    const editor = new PaintRuntime(mapHost.current, setState)
    editor.onPicked = () => { setTool('paint'); setRegionSearch('') }
    runtime.current = editor
    // Defer acquisition so StrictMode's initial cleanup cannot contend for its lock.
    const start = setTimeout(() => editor.open().catch(e => { if (!editor.destroyed) setError(e.message) }), 0)
    return () => { clearTimeout(start); editor.destroy(); runtime.current = null }
  }, [])

  function chooseTool(value) { setTool(value); runtime.current.setTool(value) }
  function chooseCountry(id) { runtime.current.end(); runtime.current.selected = id; runtime.current.emit() }
  function addCountry() {
    try { const editor = runtime.current; editor.end(); editor.selected = editor.model.addRegion(); editor.emit(); chooseTool('paint') }
    catch (e) { setError(e.message) }
  }
  function editCountry(field, value) {
    const editor = runtime.current, region = editor.model.regions.find(r => r.id === editor.selected)
    region[field] = value; editor.model.changed()
  }
  async function restore() {
    setWorking(true)
    try { await runtime.current.importFile(restoreFile); setRestoreFile(null); setError('') }
    catch (e) { setError(`无法恢复：${e.message}`) }
    finally { setWorking(false) }
  }
  async function repairCoasts() {
    setWorking(true); setRepairMessage('正在检查全图海岸…')
    try { setRepairMessage(await runtime.current.repairCoasts()) }
    catch (e) { setError(e.message); setRepairMessage('') }
    finally { setWorking(false) }
  }
  const run = action => { try { action(runtime.current) } catch (e) { setError(e.message) } }
  async function toggleLegacy() {
    const visible = !showLegacy
    setLoadingLegacy(true)
    try { await runtime.current.setLegacyVisible(visible); setShowLegacy(visible) }
    catch (e) { if (e.name !== 'AbortError') setError(e.message) }
    finally { setLoadingLegacy(false) }
  }

  return (
    <main className="paint-app">
      <header className="paint-header">
        <div className="paint-brand"><span className="paint-brand__seal">绘</span><div><h1>地图涂色工作台</h1><p>CELESTIAN · WORLD ATELIER</p></div></div>
        <div className="paint-save" role="status"><span className={state.saveStatus.includes('失败') || state.saveStatus.includes('未') ? 'unsaved' : ''} />{state.saveStatus}</div>
        <div className="paint-file-actions">
          <button disabled={!state.ready} onClick={() => run(e => e.backup())}>下载备份</button>
          <button disabled={!state.ready} onClick={() => importInput.current.click()}>恢复备份</button>
          <button className="paint-primary" disabled={!state.ready} onClick={() => run(e => e.exportSVG())}>导出 SVG <span>↗</span></button>
          <input ref={importInput} type="file" accept=".json,application/json" hidden onChange={e => { setRestoreFile(e.target.files[0] || null); e.target.value = '' }} />
        </div>
      </header>
      <fieldset disabled={working} className="paint-edit-lock">
      <aside className="paint-sidebar">
        <section className="paint-intro"><span className="paint-eyebrow">{state.countryProject ? '国家已合并 · 原分区保留' : state.legacyProject ? '旧分区 · 可继续编辑' : '一张地图，慢慢画'}</span><h2>{state.legacyProject ? '接着原来的画。' : '选国家，涂上去。'}</h2><p>{state.countryProject ? '同国的大陆、岛屿与飞地已合并。待确认的区域单独保留。' : state.legacyProject ? '旧区域已迁入独立草稿。选择区域后，可继续涂色、擦除和调整。' : '只能涂陆地。已经属于其他国家的地方，会自动避开。'}</p>
          {state.countryProject && state.mergeSummary && <details className="paint-merge-info"><summary>合并结果与资料差异</summary><p>{state.mergeSummary.before} 个原区域 → {state.mergeSummary.confirmedGroups} 个确认分组，{state.mergeSummary.unassigned} 个待归属区域。原名、描述与状态均保留。</p>{state.mergeSummary.conflicts.map(item => <p key={item.id}>{item.name}：{Object.keys(item.fields).map(key => ({ title: '名称', description: '介绍', status: '状态', color: '配色', status_color: '状态色' })[key]).join('、')}有差异，未覆盖原资料。</p>)}<a href="/map-painter/?project=legacy">查看合并前的分区草稿 ↗</a></details>}
        </section>
        <section className="paint-countries"><div className="paint-section-title"><h2>{state.legacyProject ? '原有区域' : '我的国家'} <span>{state.regions.length}</span></h2><button onClick={addCountry} disabled={!state.ready} aria-label="新增国家">＋ 新增</button></div>
          {state.regions.length > 8 && <input className="paint-region-search" aria-label="搜索区域" placeholder="搜名称、原编号或分组" value={regionSearch} onChange={e => setRegionSearch(e.target.value)} />}
          <div className="paint-country-list" role="group" aria-label="选择国家">{filteredRegions.map(region => <button key={region.id} className={`paint-country ${region.id === state.selected ? 'is-selected' : ''}`} aria-pressed={region.id === state.selected} onClick={() => chooseCountry(region.id)}><span className="paint-swatch" style={{ background: region.color }} /><span>{region.name || '未命名国家'}{region.sources ? <small>{region.pending ? '待确认归属' : `已合并 ${region.sources.length} 块原区域`}</small> : region.source && <small>{region.source.regionId}</small>}</span><span className="paint-country-check">{region.id === state.selected ? '✓' : ''}</span></button>)}{!filteredRegions.length && <p className="paint-tool-hint">没有找到这个区域。</p>}</div>
          {current && <div className="paint-country-details"><label>国家名称<input aria-label="国家名称" value={current.name} maxLength={80} onChange={e => editCountry('name', e.target.value)} onBlur={() => { if (!current.name.trim()) editCountry('name', `国家 ${current.id}`) }} /></label><label className="paint-color-label">显示颜色<input type="color" aria-label="国家颜色" value={current.color} onChange={e => editCountry('color', e.target.value)} /></label></div>}
        </section>
        <section className="paint-tools"><div className="paint-section-title"><h2>怎么画</h2><span>滚轮可缩放</span></div>
          <button className="paint-picker" disabled={!state.ready} aria-pressed={tool === 'pick'} onClick={() => chooseTool(tool === 'pick' ? 'paint' : 'pick')}>⌖ {tool === 'pick' ? '点击地图选取区域 · 再点取消' : '吸管 · 从地图选取区域'}</button>
          <p className="paint-tool-hint">点击已有色块，选中对应区域后自动回到涂色。也可按住 Alt 点击取色。</p>
          <div className="paint-mouse-guide"><p><span>左键</span>涂色</p><p><span>右键</span>擦除当前国家</p><p><span>按住滚轮</span>拖动地图</p></div>
          <div className="paint-touch-tools"><div className="paint-tool-switch">{TOOLS.map(item => <button key={item.id} disabled={!state.ready} aria-pressed={tool === item.id} onClick={() => chooseTool(item.id)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.path} /></svg>{item.label}</button>)}</div></div>
          <div className="paint-brush-label"><label htmlFor="brush-size">画笔大小</label><span>{size} px</span></div><input id="brush-size" type="range" min="6" max="80" value={size} onChange={e => { setSize(+e.target.value); runtime.current.size = +e.target.value }} />
          <p className="paint-tool-hint">放大后，可以画得更细。擦除只影响当前国家。</p>
          <button className="paint-picker" disabled={!state.ready || working} onClick={repairCoasts}>全图补齐海岸漏点</button>
          <p className="paint-tool-hint" role="status">{repairMessage || '自动补齐沿海小缝隙，不覆盖已有归属；整次操作可撤销。'}</p>
          <div className="paint-history"><button disabled={!state.undo || working} onClick={() => run(e => { e.end(); e.model.undo() })}>↶ 撤销</button><button disabled={!state.redo || working} onClick={() => run(e => { e.end(); e.model.redo() })}>↷ 重做</button></div>
        </section>
        <footer className="paint-sidebar-footer"><span>✓ 海洋不能涂</span><span>✓ 国家不重叠</span><p>草稿仅保存在这个浏览器。<br />重要改动后，记得下载一份备份。</p></footer>
      </aside>
      <section className={`paint-map-area tool-${tool}`} aria-label="地图编辑区">
        <div ref={mapHost} className="paint-map" />
        {state.ready && <div className="paint-active-pill"><span style={{ background: current?.color }} />{tool === 'move' ? '正在移动地图' : `${tool === 'erase' ? '擦除' : '正在涂'} · ${current?.name || '未命名国家'}`}</div>}
        {!state.ready && !error && <div className="paint-loading" role="status">{state.saveStatus}</div>}
        <div className="paint-map-controls"><button className="paint-label-toggle" disabled={!state.ready || loadingLegacy} aria-label="显示旧分区参考" aria-pressed={showLegacy} onClick={toggleLegacy}>{loadingLegacy ? '…' : '旧分区'}</button><button className="paint-label-toggle" disabled={!state.ready} aria-label="显示地图文字" aria-pressed={showLabels} onClick={() => { const next = !showLabels; setShowLabels(next); runtime.current.setLabelsVisible(next) }}>文字</button><button disabled={!state.ready} aria-label="放大地图" onClick={() => runtime.current.map.zoomIn()}>＋</button><button disabled={!state.ready} aria-label="缩小地图" onClick={() => runtime.current.map.zoomOut()}>−</button><button disabled={!state.ready} onClick={() => runtime.current.map.fitBounds(runtime.current.bounds)}>全图</button></div>
        <div className="paint-map-caption">WORLD MAP / 240705 <span>本地创作 · 尚未发布</span></div>
      </section>
      </fieldset>
      {error && <div className="paint-message" role="alert"><span>{error}</span><button onClick={() => state.ready ? setError('') : location.reload()}>{state.ready ? '知道了' : '重新加载'}</button></div>}
      {restoreFile && <div className="paint-modal-backdrop"><section className="paint-modal" role="dialog" aria-modal="true" aria-labelledby="restore-title"><h2 id="restore-title">恢复这份备份？</h2><p>它会替换当前草稿。建议先下载当前备份，避免丢失已有涂色。</p><div><button disabled={working} onClick={() => run(e => e.backup())}>先备份当前草稿</button><button disabled={working} onClick={() => setRestoreFile(null)}>取消</button><button className="paint-primary" disabled={working} onClick={restore}>{working ? '恢复中…' : '替换并恢复'}</button></div></section></div>}
    </main>
  )
}
