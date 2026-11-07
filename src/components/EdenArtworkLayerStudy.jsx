import { useEffect, useRef, useState } from 'react'
import EdenLayeredArtwork from './EdenLayeredArtwork'
import { EDEN_ART_LAYERS, EDEN_ART_SIZE, EDEN_ORIGINAL_ART, createEdenLayerSettings } from './eden-artwork-layers'
import '../fonts/eden-seal.css'
import '../eden-artwork-layers.css'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export default function LayerStudy() {
  const [settings, setSettings] = useState(createEdenLayerSettings)
  const [selected, setSelected] = useState('tree')
  const [solo, setSolo] = useState(null)
  const [original, setOriginal] = useState(false)
  const [parallax, setParallax] = useState(false)
  const [demo, setDemo] = useState(false)
  const [reference, setReference] = useState(false)
  const [referenceOpacity, setReferenceOpacity] = useState(0.35)
  const [title, setTitle] = useState(false)
  const [errors, setErrors] = useState([])
  const [notice, setNotice] = useState('')
  const stage = useRef(null)
  const drag = useRef(null)
  const layer = EDEN_ART_LAYERS.find(item => item.id === selected)
  const active = settings[selected]
  const visibleCount = EDEN_ART_LAYERS.filter(item => settings[item.id].visible).length

  useEffect(() => {
    const canvas = stage.current
    if (!demo || original || !canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame
    let start
    function animate(now) {
      start ??= now
      const time = (now - start) / 1000
      const easeIn = Math.min(1, time / 1.5)
      canvas.style.setProperty('--look-x', `${Math.sin(time / 3.8) * 0.65 * easeIn}%`)
      canvas.style.setProperty('--look-y', `${Math.sin(time / 5.1) * 0.35 * easeIn}%`)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      canvas.style.setProperty('--look-x', '0%')
      canvas.style.setProperty('--look-y', '0%')
    }
  }, [demo, original])

  function update(id, patch) {
    setSettings(previous => ({ ...previous, [id]: { ...previous[id], ...patch } }))
  }

  function select(id) {
    setSelected(id)
    if (solo) setSolo(id)
    setOriginal(false)
  }

  function clearMotion() {
    stage.current?.style.setProperty('--look-x', '0%')
    stage.current?.style.setProperty('--look-y', '0%')
  }

  function startDrag(event) {
    if (parallax || demo || original || (!solo && !active.visible) || event.button !== 0) return
    const rect = stage.current.getBoundingClientRect()
    drag.current = { id: selected, pointer: event.pointerId, x: event.clientX, y: event.clientY,
      initial: { ...active }, width: rect.width, height: rect.height }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus({ preventScroll: true })
  }

  function move(event) {
    if (parallax && !demo && !original && event.pointerType !== 'touch') {
      const rect = stage.current.getBoundingClientRect()
      stage.current.style.setProperty('--look-x', `${((event.clientX - rect.left) / rect.width - 0.5) * 1.4}%`)
      stage.current.style.setProperty('--look-y', `${((event.clientY - rect.top) / rect.height - 0.5) * 0.8}%`)
      return
    }
    const current = drag.current
    if (!current || current.pointer !== event.pointerId) return
    update(current.id, {
      x: clamp(current.initial.x + (event.clientX - current.x) / current.width * 100, -100, 100),
      y: clamp(current.initial.y + (event.clientY - current.y) / current.height * 100, -100, 100),
    })
  }

  function stopDrag(event) {
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function nudge(event) {
    if (original || parallax || demo || (!solo && !active.visible)) return
    const offset = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
    if (!offset) return
    event.preventDefault()
    const step = event.shiftKey ? 10 : 1
    update(selected, {
      x: clamp(active.x + offset[0] * step / EDEN_ART_SIZE.width * 100, -100, 100),
      y: clamp(active.y + offset[1] * step / EDEN_ART_SIZE.height * 100, -100, 100),
    })
  }

  function resetAll() {
    setSettings(createEdenLayerSettings())
    setSolo(null)
    setOriginal(false)
    setParallax(false)
    setDemo(false)
    setReference(false)
    clearMotion()
  }

  function downloadSettings() {
    const blob = new Blob([JSON.stringify({ version: 3, source: 'user-web-extractions', layout: 'frameless-fullbleed', canvas: EDEN_ART_SIZE, layers: settings }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'eden-frameless-layer-layout-v3.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('当前各层的位置与缩放参数已导出。')
  }

  return <div className="layer-study">
    <header className="study-header">
      <div><p className="study-kicker">CELESTIAN REQUIEM / ARTWORK LAYERS</p><h1>开屏 · 美术拆层 <span>03 / 无框满幅</span></h1></div>
      <a className="study-home" href="/?dev-entry=opening">返回开屏 ↗</a>
    </header>
    <main className="study-workspace">
      <section className="study-viewer" aria-label="图层画布">
        <div className="study-toolbar">
          <div className="study-view-buttons">
            <button aria-pressed={!original} onClick={() => setOriginal(false)}>分层合成</button>
            <button aria-pressed={original} onClick={() => { setOriginal(true); clearMotion() }}>原图对照</button>
            <button aria-pressed={reference && !original} onClick={() => { setReference(!reference); setOriginal(false) }}>叠图校准</button>
          </div>
          <div className="study-options">
            <label><input type="checkbox" checked={title} disabled={original} onChange={event => setTitle(event.target.checked)} /> 显示标题</label>
            <label><input type="checkbox" checked={parallax} disabled={original} onChange={event => { setParallax(event.target.checked); setDemo(false); drag.current = null; clearMotion() }} /> 鼠标视差</label>
            <button aria-pressed={demo} disabled={original} onClick={() => { setDemo(!demo); setParallax(false); drag.current = null; clearMotion() }}>{demo ? '暂停演示' : '播放视差'}</button>
          </div>
        </div>
        <div className="study-canvas-space">
          <div ref={stage} className={`study-stage ${original ? 'is-original' : ''} ${parallax || demo ? 'is-parallax' : ''}`}
            tabIndex={0} role="group" aria-label={`画布，当前选择${layer.name}；方向键微调，按住 Shift 加速`}
            onPointerDown={startDrag} onPointerMove={move} onPointerUp={stopDrag}
            onPointerCancel={stopDrag} onLostPointerCapture={() => { drag.current = null }}
            onPointerLeave={() => { if (!demo) clearMotion() }} onKeyDown={nudge}>
            <EdenLayeredArtwork settings={settings} solo={solo} title={title}
              onError={id => setErrors(previous => previous.includes(id) ? previous : [...previous, id])} />
            {original && <img className="study-original" src={EDEN_ORIGINAL_ART} alt="拆层前的原始开屏插画" draggable="false" />}
            {reference && !original && <img className="study-original study-reference" src={EDEN_ORIGINAL_ART} alt="" aria-hidden="true" draggable="false" style={{ opacity: referenceOpacity }} />}
          </div>
        </div>
        <div className="study-status"><span>{original ? '原始插画' : demo ? '轻微视差演示中 · 前后景缓慢错动' : parallax ? '移动鼠标，查看各层的景深差异' : `拖动画布移动「${layer.name}」`}</span><span>1672 × 941 · {solo ? '单层预览' : `${visibleCount} / 8 层显示`}</span></div>
        {reference && !original && <label className="study-reference-control">原图叠加 <input type="range" min="0.05" max="0.9" step="0.05" value={referenceOpacity} onChange={event => setReferenceOpacity(Number(event.target.value))} /><output>{Math.round(referenceOpacity * 100)}%</output></label>}
        <div className="study-strip" aria-label="选择美术图层">
          {EDEN_ART_LAYERS.map(item => <button key={item.id} className={selected === item.id ? 'is-selected' : ''} aria-pressed={selected === item.id} onClick={() => select(item.id)}>
            <span className="study-thumb"><img src={item.src} alt="" draggable="false" /></span>
            <span><small>{item.number}</small>{item.name}</span>
          </button>)}
        </div>
        <p className="study-note">无框满幅构图：两侧拱廊向画外延展，石阶铺到下沿。保留底图山景；金色外框与备用山景默认关闭，仍可单独开启。现有首页仍使用原图。</p>
        {!solo && settings.landscape.visible && settings.distance.visible && <p className="study-note study-layer-warning">备用山景已打开，会与底图山景重叠。查看单层效果可点击「只看这一层」。</p>}
        {errors.length > 0 && <p className="study-error" role="alert">图层加载失败：{errors.map(id => EDEN_ART_LAYERS.find(item => item.id === id)?.name).join('、')}。请刷新后重试。</p>}
      </section>
      <aside className="study-inspector">
        <div className="inspector-heading"><span>图层</span><small>由前至后</small></div>
        <div className="study-layer-list">
          {[...EDEN_ART_LAYERS].reverse().map(item => <div key={item.id} className={`study-layer-row ${selected === item.id ? 'is-selected' : ''}`}>
            <button className="study-layer-select" onClick={() => select(item.id)} aria-pressed={selected === item.id}><small>{item.number}</small>{item.name}</button>
            <input type="checkbox" aria-label={`显示${item.name}`} checked={settings[item.id].visible} onChange={event => update(item.id, { visible: event.target.checked })} />
          </div>)}
        </div>
        <div className="study-layer-detail">
          <p className="study-kicker">SELECTED LAYER / {layer.number}</p>
          <h2>{layer.name}</h2><p>{layer.detail}</p>
          <div className="study-layer-actions">
            <button aria-pressed={solo === selected} onClick={() => { setSolo(solo === selected ? null : selected); setOriginal(false); setReference(false) }}>{solo === selected ? '返回合成' : '只看这一层'}</button>
            <a href={layer.src} download={layer.file}>下载 PNG ↓</a>
          </div>
          <div className="study-position-fields">
            {['x', 'y'].map(axis => <label key={axis}>{axis.toUpperCase()} <span>%</span><input type="number" step="0.1" min="-100" max="100" value={Number(active[axis].toFixed(2))} onChange={event => { const value = event.target.valueAsNumber; if (Number.isFinite(value)) update(selected, { [axis]: clamp(value, -100, 100) }) }} /></label>)}
          </div>
          <label className="study-slider">缩放 <output>{Math.round(active.scale * 100)}%</output><input type="range" min="0.2" max="1.8" step="0.01" value={active.scale} onChange={event => update(selected, { scale: Number(event.target.value) })} /></label>
          <label className="study-slider">纵向比例 <output>{Math.round(active.stretchY * 100)}%</output><input type="range" min="0.5" max="1.5" step="0.01" value={active.stretchY} onChange={event => update(selected, { stretchY: Number(event.target.value) })} /></label>
          <label className="study-slider">不透明度 <output>{Math.round(active.opacity * 100)}%</output><input type="range" min="0" max="1" step="0.01" value={active.opacity} onChange={event => update(selected, { opacity: Number(event.target.value) })} /></label>
          <button className="study-reset-layer" onClick={() => update(selected, { ...layer.initial })}>重置这一层</button>
        </div>
        <footer className="study-inspector-footer"><button onClick={downloadSettings}>导出位置参数 ↓</button><button onClick={resetAll}>全部复位</button><p aria-live="polite">{notice || '画布支持拖动与方向键微调。Shift + 方向键每次移动 10 像素。'}</p></footer>
      </aside>
    </main>
  </div>
}

