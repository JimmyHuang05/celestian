import { newWorldMarker } from '../map-marker-overrides.js'
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { WATER_BASE, WATER_KEY, cleanWaterDraft, waterResultSvg } from '../map-water-draft.js'
import './map-water-editor.css'

const BOUNDS = [[-1024, 0], [0, 2048]]
const TOOLS = [['move', '移动地图'], ['river', '画河流'], ['lake', '涂湖泊'], ['erase', '擦除草稿']]
const empty = () => ({ version: 1, baseCheck: WATER_BASE, updatedAt: 0, strokes: [] })
const download = (name, content, type = 'application/json') => {
  const url = URL.createObjectURL(new Blob([content], { type })), a = document.createElement('a')
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export default function MapWaterEditorPage() {
  const host = useRef(null), runtime = useRef(null), draftRef = useRef(empty()), worker = useRef(null), history = useRef({ undo: [], redo: [] })
  const options = useRef({ tool: 'move', radius: 6, busy: false }), credentials = useRef(null), saveQueue = useRef(Promise.resolve()), input = useRef(null)
  const [draft, setDraft] = useState(empty), [ready, setReady] = useState(false), [tool, setTool] = useState('move'), [radius, setRadius] = useState(6)
  const [style, setStyle] = useState('geo'), [view, setView] = useState('draft'), [result, setResult] = useState(null), [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('正在载入底图…'), [saved, setSaved] = useState(''), [error, setError] = useState(''), [showCities, setShowCities] = useState(true)
  const [historyVersion, setHistoryVersion] = useState(0)

  function commit(strokes, record = true) {
    if (strokes.length > 250) { setError('最多保留250笔，请先导出或整理草稿'); return }
    if (record) { history.current.undo.push(draftRef.current.strokes); history.current.undo = history.current.undo.slice(-60); history.current.redo = [] }
    const next = { ...empty(), strokes, updatedAt: Date.now() }
    draftRef.current = next; setDraft(next); setHistoryVersion(v => v + 1); setResult(null); setView('draft'); setError('')
  }
  function undo(redo = false) {
    const from = redo ? 'redo' : 'undo', to = redo ? 'undo' : 'redo', previous = history.current[from].pop()
    if (!previous) return
    history.current[to].push(draftRef.current.strokes); commit(previous, false)
  }

  useEffect(() => {
    let alive = true
    const map = L.map(host.current, { crs: L.CRS.Simple, minZoom: -2, maxZoom: 4, zoomControl: false, attributionControl: false, maxBounds: [[-1120, -160], [96, 2208]], maxBoundsViscosity: .8 })
    map.fitBounds(BOUNDS)
    const drawings = L.featureGroup().addTo(map), cities = L.featureGroup().addTo(map)
    const rt = { map, drawings, cities, base: null, rivers: null, preview: null, metadata: null, current: null }
    runtime.current = rt
    const resize = new ResizeObserver(() => map.invalidateSize()); resize.observe(host.current)
    async function start() {
      try {
        const [meta, archive] = await Promise.all([
          fetch('/mapplus/manifest.json').then(r => { if (!r.ok) throw Error('底图加载失败'); return r.json() }),
          (async () => {
            if (import.meta.env.DEV) {
              try { const r = await fetch('/__mapplus/water-draft'); if (r.ok && r.headers.get('content-type')?.includes('application/json')) return r.json() } catch { /* local backup remains available */ }
            }
            try { const r = await fetch('/mapplus/water-editor/draft.json', { cache: 'no-store' }); if (r.ok) return await r.json() } catch { /* first draft */ }
            return { revision: null, draft: null }
          })(),
        ])
        if (!alive) return
        if (meta.worldCheck !== WATER_BASE) throw Error('底图版本已更新，编辑器需要重新接入当前存档')
        rt.metadata = meta; rt.base = L.imageOverlay(meta.basemapStyles.geo.url, BOUNDS).addTo(map)
        rt.rivers = L.imageOverlay(meta.vectorLayers.rivers.url, BOUNDS).addTo(map)
        drawings.bringToFront()
        credentials.current = archive.token ? { token: archive.token, revision: archive.revision } : null
        let local = null
        try { const raw = localStorage.getItem(WATER_KEY); if (raw) local = cleanWaterDraft(JSON.parse(raw)) } catch { setError('本机草稿无法读取；仍可载入项目草稿') }
        const remote = archive.draft ? cleanWaterDraft(archive.draft) : null
        const chosen = local && (!remote || local.updatedAt > remote.updatedAt) ? local : remote || empty()
        draftRef.current = chosen; setDraft(chosen); setReady(true); setMessage('选择画河流或涂湖泊，在地图上拖动画笔。')
        const [places, positions] = await Promise.all([fetch('/map/world-240705-base-v2/markers.json').then(r => r.json()), fetch('/mapplus/placements.json').then(r => r.json())])
        if (!alive) return
        const placed = positions['celestian-placement-new-estra-20cbce0ed04d'] || {}
        for (const row of places.data.map(newWorldMarker)) if (placed[row.id]) L.circleMarker(placed[row.id], { radius: 3, color: '#6d4325', weight: 1, fillColor: '#f4e5bf', fillOpacity: .9 }).bindTooltip(document.createTextNode(row.title)).addTo(cities)
      } catch (e) { if (alive) setError(e.message) }
    }
    start()
    const xy = e => { const ll = map.mouseEventToLatLng(e); return [Math.max(0, Math.min(2048, ll.lng)), Math.max(0, Math.min(1024, -ll.lat))] }
    const down = e => {
      const o = options.current
      if (!rt.metadata || o.busy || o.tool === 'move' || e.button !== 0) return
      e.preventDefault(); e.stopImmediatePropagation(); host.current.setPointerCapture(e.pointerId)
      const p = xy(e)
      if (o.tool === 'erase') {
        const threshold = Math.max(o.radius, 9 / 2 ** map.getZoom())
        let nearest = -1, distance = Infinity
        draftRef.current.strokes.forEach((s, i) => { for (const pt of s.points) { const d = Math.hypot(p[0] - pt[0], p[1] - pt[1]) - (s.kind === 'lake' ? s.radius : 0); if (d < distance) { distance = d; nearest = i } } })
        if (nearest >= 0 && distance < threshold) commit(draftRef.current.strokes.filter((_, i) => i !== nearest))
        return
      }
      rt.current = { id: crypto.randomUUID(), kind: o.tool, radius: o.radius, points: [p] }
      rt.ink = L.polyline([[-p[1], p[0]]], { color: '#df9c45', opacity: .8, weight: o.tool === 'lake' ? o.radius * 2 * 2 ** map.getZoom() : 3, lineCap: 'round', interactive: false }).addTo(map)
    }
    const move = e => {
      if (!rt.current) return
      e.preventDefault(); e.stopImmediatePropagation()
      const p = xy(e), last = rt.current.points.at(-1)
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < Math.max(.25, 2 / 2 ** map.getZoom()) || rt.current.points.length >= 4000) return
      rt.current.points.push(p); rt.ink.setLatLngs(rt.current.points.map(([x, y]) => [-y, x]))
    }
    const finish = e => {
      if (!rt.current) return
      e.preventDefault(); e.stopImmediatePropagation()
      const stroke = rt.current; rt.current = null; rt.ink.remove(); rt.ink = null
      if (e.type !== 'pointercancel' && (stroke.kind === 'lake' || stroke.points.length > 1)) commit([...draftRef.current.strokes, stroke])
    }
    const element = host.current
    element.addEventListener('pointerdown', down, true); element.addEventListener('pointermove', move, true); element.addEventListener('pointerup', finish, true); element.addEventListener('pointercancel', finish, true)
    return () => { alive = false; worker.current?.terminate(); resize.disconnect(); element.removeEventListener('pointerdown', down, true); element.removeEventListener('pointermove', move, true); element.removeEventListener('pointerup', finish, true); element.removeEventListener('pointercancel', finish, true); map.remove(); runtime.current = null }
  }, [])

  useEffect(() => {
    options.current = { tool, radius, busy }
    const map = runtime.current?.map
    if (!map) return
    if (tool === 'move' && !busy) { map.dragging.enable(); map.touchZoom.enable() } else { map.dragging.disable(); map.touchZoom.disable() }
  }, [tool, radius, busy])
  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(WATER_KEY, JSON.stringify(draft)); setSaved('已保存到本机') } catch { setSaved('本机保存失败，请下载草稿备份') }
    if (!draft.updatedAt || !credentials.current) return
    const timer = setTimeout(() => {
      saveQueue.current = saveQueue.current.catch(() => {}).then(async () => {
        const credential = credentials.current
        if (!credential) return
        const response = await fetch('/__mapplus/water-draft', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Water-Token': credential.token }, body: JSON.stringify({ revision: credential.revision, draft }) })
        const body = await response.json()
        if (!response.ok) { if (response.status === 409) credentials.current = null; throw Error(body.error || '保存到项目失败') }
        credentials.current.revision = body.revision
        if (draftRef.current.updatedAt === draft.updatedAt) setSaved('已保存到项目与本机')
      }).catch(e => { setSaved('项目保存失败，本机草稿保留'); setError(e.message) })
    }, 600)
    return () => clearTimeout(timer)
  }, [draft, ready])
  useEffect(() => {
    const rt = runtime.current
    if (!ready || !rt) return
    rt.drawings.clearLayers()
    const paint = () => {
      rt.drawings.clearLayers()
      if (view !== 'draft') return
      for (const s of draft.strokes) {
        const opt = { color: s.kind === 'river' ? '#d58a32' : '#379daf', weight: s.kind === 'lake' ? s.radius * 2 * 2 ** rt.map.getZoom() : 3, opacity: .7, lineCap: 'round', lineJoin: 'round', interactive: false }
        if (s.points.length === 1) L.circleMarker([-s.points[0][1], s.points[0][0]], { ...opt, radius: s.radius * 2 ** rt.map.getZoom(), weight: 1, fillOpacity: .6 }).addTo(rt.drawings)
        else L.polyline(s.points.map(([x, y]) => [-y, x]), opt).addTo(rt.drawings)
      }
    }
    paint(); rt.map.on('zoomend', paint)
    rt.preview?.remove(); rt.preview = null
    if (view === 'optimized' && result) {
      rt.rivers.remove()
      const svg = new DOMParser().parseFromString(waterResultSvg(result), 'image/svg+xml').documentElement
      rt.preview = L.svgOverlay(svg, BOUNDS, { interactive: false }).addTo(rt.map)
    } else if (!rt.map.hasLayer(rt.rivers)) rt.rivers.addTo(rt.map)
    rt.drawings.bringToFront(); rt.cities.bringToFront()
    return () => rt.map.off('zoomend', paint)
  }, [draft, view, result, ready])
  useEffect(() => { const rt = runtime.current; if (ready && rt?.base) rt.base.setUrl(rt.metadata.basemapStyles[style].url) }, [style, ready])
  useEffect(() => { const rt = runtime.current; if (!rt) return; if (showCities) rt.cities.addTo(rt.map); else rt.cities.remove() }, [showCities, ready])

  function optimize() {
    if (!draft.strokes.length) return
    setError(''); setBusy(true); setTool('move'); setMessage('准备优化…'); worker.current?.terminate()
    const w = new Worker('/mapplus/water-editor/optimizer.js?v=' + WATER_BASE); worker.current = w
    w.onmessage = ({ data }) => {
      if (data.type === 'progress') setMessage(data.text)
      if (data.type === 'result') { setResult(data.result); setView('optimized'); setMessage('优化完成，可以切换草稿对照。'); setBusy(false); w.terminate() }
      if (data.type === 'error') { setError(data.message); setBusy(false); w.terminate() }
    }
    w.onerror = () => { setError('优化进程失败，草稿已保留，可重新尝试'); setBusy(false); w.terminate() }
    w.postMessage(draft)
  }
  async function importDraft(file) {
    if (!file) return
    try { if (file.size > 16000000) throw Error('备份文件过大'); const data = JSON.parse(await file.text()); const parsed = cleanWaterDraft(data.draft || data); commit(parsed.strokes); setMessage('草稿已导入；可撤销此次导入。') } catch (e) { setError(e.message) }
  }
  const exportDraft = () => download('新埃斯特拉-水系编辑.json', JSON.stringify({ draft, optimized: result, coordinateSystem: { width: 2048, height: 1024, centralMeridian: 31.68515625 }, source: 'https://github.com/guaner-334/civ-atlas' }, null, 2))
  return <main className="water-editor">
    <aside className="water-sidebar">
      <a className="water-back" href="/mapplus/">← 返回地图</a><span className="water-eyebrow">CELESTIAN · HYDROGRAPHY</span><h1>水系编辑</h1><p className="water-intro">画下河流与湖泊，让地势决定水的去向。</p>
      <div className="water-save" role="status">{saved || '载入草稿中…'}</div>
      <fieldset disabled={!ready || busy}><legend>画笔工具</legend><div className="water-tools">{TOOLS.map(([id, label]) => <button key={id} aria-pressed={tool === id} onClick={() => { setTool(id); setView('draft') }}>{label}</button>)}</div><label className="water-size">{tool === 'river' ? '河道宽度' : '笔刷半径'}<span>{radius}</span><input aria-label="笔刷大小" type="range" min="2" max="24" value={radius} onChange={e => setRadius(Number(e.target.value))} /></label><p className="water-tip">拖动画河或涂湖，滚轮缩放；移动工具拖动地图。擦除仅删除新增草稿。</p><div className="water-actions"><button disabled={!history.current.undo.length} onClick={() => undo()}>↶ 撤销</button><button disabled={!history.current.redo.length} onClick={() => undo(true)}>↷ 重做</button></div></fieldset>
      <fieldset disabled={!ready || busy}><legend>底图参照</legend><div className="water-tools">{[['geo', '地理图'], ['elevation', '高程'], ['blank', '白模']].map(([id, label]) => <button key={id} aria-pressed={style === id} onClick={() => setStyle(id)}>{label}</button>)}</div><label className="water-check"><input type="checkbox" checked={showCities} onChange={e => setShowCities(e.target.checked)} />显示已定位地点</label></fieldset>
      <section className="water-optimize"><h2>交给地形校正</h2><p>河流自动确定上下游、切出河谷；湖盆按最低溢出口积水。手绘范围是意图，优化后可能扩大或收缩。</p><button className="water-primary" disabled={!ready || busy || !draft.strokes.length} onClick={optimize}>{busy ? '正在优化…' : 'Civ Atlas 优化预览'}</button>{busy && <button onClick={() => { worker.current?.terminate(); setBusy(false); setMessage('已取消，草稿保留。') }}>取消优化</button>}<p role="status">{message}</p></section>
      {result && <section className="water-result"><h2>本次结果</h2><p>新增湖区网格 {result.summary.newLakeCells} · 手绘河道网格 {result.summary.riverCells}<br />局部最大挖深 {result.summary.maxCut} 米</p>{result.warnings.map(w => <p className="water-warning" key={w}>{w}</p>)}<p>这是水系与局部地形预览。正式地图、气候和地点均未覆盖。</p></section>}
      {error && <div className="water-error" role="alert">{error}<button onClick={() => setError('')} aria-label="关闭提示">×</button></div>}
      <footer><div className="water-actions"><button disabled={!ready || busy} onClick={exportDraft}>下载草稿</button><button disabled={!ready || busy} onClick={() => input.current.click()}>导入草稿</button></div><button disabled={!result || busy} onClick={() => download('新埃斯特拉-水系优化.svg', waterResultSvg(result), 'image/svg+xml')}>导出优化水系 SVG ↗</button><input type="file" accept=".json,application/json" hidden ref={input} onChange={e => { importDraft(e.target.files[0]); e.target.value = '' }} /><p>草稿导出后可以继续交给我，统一更新正式底图与相关图层。</p><a href="https://github.com/guaner-334/civ-atlas" target="_blank" rel="noreferrer">算法：Civ Atlas ↗</a><a href="/mapplus/water-editor/source.zip">源码与许可 ↓</a></footer>
    </aside>
    <section className="water-workspace"><div ref={host} className={'water-map tool-' + tool} aria-label="水系绘制地图" /><div className="water-top"><span>新埃斯特拉（五） · 0°C</span><div role="group" aria-label="对照视图">{[['original', '原图'], ['draft', '草稿'], ['optimized', '优化结果']].map(([id, label]) => <button key={id} disabled={id === 'optimized' && !result} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div></div><div className="water-map-actions"><button aria-label="放大地图" onClick={() => runtime.current?.map.zoomIn()}>＋</button><button aria-label="缩小地图" onClick={() => runtime.current?.map.zoomOut()}>−</button><button onClick={() => runtime.current?.map.fitBounds(BOUNDS)}>全图</button></div><div className="water-bottom">{draft.strokes.filter(s => s.kind === 'river').length} 笔河流 · {draft.strokes.filter(s => s.kind === 'lake').length} 笔湖泊<span>{view === 'optimized' ? '蓝色为优化后的水系' : view === 'original' ? '正在查看原图' : '橙色河流 · 青色湖泊'} · 未应用到正式地图</span></div></section>
    <span hidden>{historyVersion}</span>
  </main>
}
