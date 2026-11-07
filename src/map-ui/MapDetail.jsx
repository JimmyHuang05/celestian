import { useEffect, useRef, useState } from 'react'
import MapIcon from './MapIcon.jsx'
import { regionMeta, POLLUTION_STYLES } from './region-presentation.js'
import { cityScenes } from './city-scenes.js'
import { regionScenes } from './region-scenes.js'
import scenePreviews from './scene-previews.json'

const sizes = ['summary', 'half', 'full']
const names = ['摘要', '半屏', '展开']

function SceneImage({ scene }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [useOriginal, setUseOriginal] = useState(false)
  if (!scene.image) return null
  const preview = scenePreviews[scene.image]
  return <div className={`map-scene-image${loaded ? ' is-loaded' : ''}`}>
    {!loaded && <div className="map-scene-placeholder" role="img" aria-label={`${scene.title}：${failed ? '图片暂时无法加载' : '图片加载中'}`} />}
    <img src={!useOriginal && preview ? preview : scene.image} alt={scene.alt || scene.title} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => {
      if (preview && !useOriginal) setUseOriginal(true)
      else setFailed(true)
    }} />
  </div>
}

export default function MapDetail({ row, closing, size, onSize, onClose, onTerritoryView, onShare }) {
  const panel = useRef(null)
  const drag = useRef(null)
  const scroll = useRef(null)
  const identity = row.isRegion ? row.sourceRegionId : row.id
  const scenes = row.isRegion ? regionScenes[identity] : cityScenes[row.id]
  const meta = regionMeta(row)

  useEffect(() => { scroll.current?.scrollTo(0, 0) }, [identity])
  useEffect(() => {
    const host = panel.current?.closest('.tiled-map')
    return () => { host?.style.removeProperty('--sheet-drag-height'); host?.removeAttribute('data-sheet-dragging') }
  }, [])

  function start(event) {
    if (event.button !== 0 || !matchMedia('(max-width: 640px)').matches) return
    const host = panel.current.closest('.tiled-map')
    drag.current = { y: event.clientY, height: panel.current.getBoundingClientRect().height, host, id: event.pointerId }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event) {
    const state = drag.current
    if (!state || event.pointerId !== state.id) return
    const max = Math.max(120, state.host.clientHeight - 180)
    const height = Math.max(90, Math.min(max, state.height + state.y - event.clientY))
    state.heightNow = height
    state.host.dataset.sheetDragging = 'true'
    state.host.style.setProperty('--sheet-drag-height', `${height}px`)
  }
  function finish(event, cancelled = false) {
    const state = drag.current
    if (!state) return
    drag.current = null
    state.host.style.removeProperty('--sheet-drag-height')
    state.host.removeAttribute('data-sheet-dragging')
    if (event.currentTarget.hasPointerCapture(state.id)) event.currentTarget.releasePointerCapture(state.id)
    if (cancelled || state.heightNow === undefined) return
    const h = state.host.clientHeight, max = Math.max(120, h - 180)
    const heights = [Math.min(154, max), Math.min(h * .46, 420, max), max]
    const nearest = heights.reduce((best, value, i) => Math.abs(value - state.heightNow) < Math.abs(heights[best] - state.heightNow) ? i : best, 0)
    onSize(sizes[nearest])
  }
  return <aside ref={panel} className={`map-marker-detail${closing ? ' is-closing' : ''}`} aria-label={row.isRegion ? '区域资料' : '地点资料'}>
    <button className="map-sheet-handle" aria-label="拖动调整资料卡高度" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={event => finish(event, true)} onLostPointerCapture={event => finish(event, true)} onKeyDown={event => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : Math.max(0, Math.min(2, sizes.indexOf(size) + (event.key === 'ArrowUp' ? 1 : -1)))
      onSize(sizes[next])
    }}><span /></button>
    <div className="map-marker-detail__top">
      <span className="map-marker-detail__type">{row.isRegion ? '海陆图志 · 地域' : `海陆图志 · ${row.type || '地点'}`}</span>
      <div className="map-sheet-sizes" aria-label="资料卡大小">{sizes.map((value, i) => <button key={value} aria-pressed={size === value} onClick={() => onSize(value)}>{names[i]}</button>)}</div>
      <button className="map-icon-button map-detail-share" onClick={onShare} aria-label={row.isRegion ? '分享此区域' : '分享此地点'} title="分享"><MapIcon name="share" /></button>
      <button className="map-icon-button map-marker-detail__close" onClick={() => onClose(true)} aria-label="关闭资料卡" title="关闭 · Esc"><MapIcon name="close" /></button>
    </div>
    <div ref={scroll} className="map-marker-detail__scroll">
      <div key={identity} className="map-marker-detail__content">
        <h2>{row.title || row.sub_group_id || row.group_id || '未命名地点'}</h2>
        {row.foreign_title && <p className="map-marker-detail__foreign">{row.foreign_title}</p>}
        {(meta.affiliation || meta.status) && <div className="map-marker-detail__meta">
          {meta.affiliation && <p>{meta.affiliation}</p>}
          {meta.status && <span className="map-region-status" data-status={meta.status} data-special="true">{meta.status}</span>}
        </div>}
        <div className="map-marker-detail__body">
          <div className="map-marker-detail__description">{row.description || '这里的故事，尚待补录。'}</div>
          {row.preview && <figure className="map-region-preview"><figcaption>领土略图</figcaption><div aria-label="选中领土轮廓" dangerouslySetInnerHTML={{ __html: row.preview }} />
            {row.previewStatuses?.length > 0 && <div className="map-region-preview__legend" aria-label="略图状态图例">{row.previewStatuses.map(status => <span key={status} data-status={status}><i aria-hidden="true" style={Object.values(POLLUTION_STYLES).find(item => item.label === status) ? { background: Object.values(POLLUTION_STYLES).find(item => item.label === status).ink + '70', borderColor: Object.values(POLLUTION_STYLES).find(item => item.label === status).ink } : undefined} />{status}</span>)}</div>}
          </figure>}
          {row.isRegion && scenes?.length > 0 && <div className="map-region-scenes-heading">地域留影</div>}
          {scenes?.map((scene, index) => <figure className={`map-city-scene${row.isRegion && index === 0 ? ' map-city-scene--region-first' : ''}`} key={`${identity}-${scene.title}-${index}`}>
            <SceneImage key={scene.image || 'placeholder'} scene={scene} />
            <figcaption><h3>{scene.title}</h3>{scene.foreign_title && <p className="map-city-scene__foreign">{scene.foreign_title}</p>}<p>{scene.description}</p></figcaption>
          </figure>)}
          {row.isRegion && <div className="map-territory-actions">
            <button aria-label={`查看${row.focusLabel || '此区域'}`} onClick={() => onTerritoryView(false)}><MapIcon name="center" />定位此地</button>
            {row.hasWholeTerritory && <button onClick={() => onTerritoryView(true)}><MapIcon name="globe" />全部领土</button>}
          </div>}
          {!row.isRegion && <details className="map-region-coordinate"><summary>制图坐标<MapIcon name="chevron" /></summary><p>X {Number(row.lng).toFixed(2)} · Y {Number(row.lat).toFixed(2)}</p></details>}
        </div>
      </div>
    </div>
  </aside>
}
