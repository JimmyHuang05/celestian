import { useEffect, useRef, useState } from 'react'
import MapIcon from './MapIcon.jsx'
import { regionMeta, POLLUTION_STYLES } from './region-presentation.js'
import { cityScenes } from './city-scenes.js'
import { regionScenes } from './region-scenes.js'
import scenePreviews from './scene-previews.json'
import useMapCopy from '../use-map-copy.js'
import { countryCultureProfile } from '../mapplus-culture.js'
import { countryHistories, countryHistoryTimelines } from '../map-country-histories.js'
import { countrySituation1818 } from '../map-country-1818.js'
import { countryFlagUrl } from '../map-country-flags.js'
import { pollutionArtwork, watchPollution } from '../map-pollution.js'
import { markerIcon, pollutionMarkerGrade } from '../map-markers.js'

const sizes = ['summary', 'half', 'full']
const names = ['摘要', '半屏', '展开']

const countryOverviewFields = [
  ['capital', '首都'],
  ['temporarySeat', '临时政府'],
  ['government', '政治体制'],
  ['monarch', '国家领袖'],
  ['rulingParty', '执政党派'],
  ['population', '人口数量'],
  ['territory', '国土面积'],
]

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

function TerritoryOutline({ preview }) {
  const host = useRef(null)
  const legend = useRef(null)

  useEffect(() => {
    const container = host.current
    // Keep the outline and its overlay under the same DOM owner.
    container.innerHTML = preview
    const outline = container.firstElementChild
    const overlay = document.createElementNS(outline.namespaceURI, 'g')
    const refresh = () => {
      const artwork = pollutionArtwork(outline, undefined, { inset: true })
      overlay.replaceChildren(...artwork.children)
      legend.current.hidden = !overlay.querySelector('[data-pollution-wash]')
    }
    outline.append(overlay)
    refresh()
    const controller = new AbortController()
    watchPollution(refresh, controller.signal)
    return () => { controller.abort(); container.replaceChildren() }
  }, [preview])

  return <>
    <div ref={host} aria-label="选中领土轮廓" />
    <div ref={legend} className="map-region-preview__legend" hidden>
      <span><i aria-hidden="true" style={{ background: '#e1847757', borderColor: '#e18477' }} />污染区</span>
    </div>
  </>
}

function PollutionCoreReport({ core }) {
  const crop = { '--core-map-x': `${-core.x / 2048 * 100}%`, '--core-map-y': `${-core.y / 1024 * 100}%` }
  const [grade, gradeName] = POLLUTION_STYLES[core.level].label.split(' · ')
  return <section className="map-core-report" aria-label="污染记录">
    <div className="map-core-report__map" style={crop} role="img" aria-label="爆发点周边地形，断环标记爆发位置">
      <img src="/mapplus/natural-ridge-v2/terrain-parchment.webp" alt="" draggable="false" />
      <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: markerIcon('污染原点', undefined, pollutionMarkerGrade(core)) }} />
    </div>
    <dl className="map-core-report__record">
      <div><dt>形成时间</dt><dd>{core.year ? <time dateTime={String(core.year)}>{core.year} 年</time> : <strong>年份待定</strong>}<span>{core.event}</span></dd></div>
      <div className="map-core-report__severity">
        <dt>侵蚀等阶</dt>
        <dd><strong>{core.beyondScale ? 'V+' : grade}</strong><span>{core.beyondScale ? '无法计算' : gradeName}</span></dd>
      </div>
    </dl>
    <section aria-label="已知危害">
      <div className="map-description-heading">已知危害</div>
      <div className="map-country-overview map-core-report__hazards"><dl>
        <div><dt>恶土化面积</dt><dd>{core.hazard.land}</dd></div>
        <div><dt>累计死伤</dt><dd>{core.hazard.casualties}</dd></div>
      </dl></div>
    </section>
    <section className="map-country-history" aria-label="已知情报">
      <div className="map-description-heading">已知情报</div>
      <HistoryTimeline events={core.timeline} />
    </section>
  </section>
}

function HistoryTimeline({ events }) {
  return <ol className="map-history-timeline">{events.map(event => <li key={event.date + ' ' + event.title}>
    <div className="map-history-timeline__heading">
      <span className="map-history-timeline__date">{event.date}</span>
      {event.title && <h3 className="map-history-timeline__title">{event.title}</h3>}
    </div>
    <p>{event.text}</p>
  </li>)}</ol>
}

export default function MapDetail({ row: sourceRow, localCopy = false, closing, size, onSize, onClose, onTerritoryView, onShare }) {
  const copy = useMapCopy(localCopy)
  const row = copy.row(localCopy && sourceRow.isRegion ? countryCultureProfile(sourceRow) : sourceRow)
  const country = row.group_id || row.title
  const history = row.isRegion && countryHistories[country]
  const historyTimeline = row.isRegion && countryHistoryTimelines[country]
  const situation = localCopy && row.isRegion && countrySituation1818[country]?.[0]
  const description = [row.description, situation].filter(Boolean).join('\n\n')
  const overview = row.countryOverview
  const flag = row.isRegion && countryFlagUrl(row)
  const panel = useRef(null)
  const drag = useRef(null)
  const scroll = useRef(null)
  const identity = row.isRegion ? row.sourceRegionId : row.id
  const scenes = (row.isLandmark ? row.sceneRegionIds.flatMap(id => regionScenes[id] || [])
    : row.isRegion ? regionScenes[row.legacyRegionId || identity] : cityScenes[row.id])?.map(copy.scene)
  const meta = regionMeta(localCopy ? {...row,status:null} : row)
  const affiliation = localCopy || row.mergedEmpire ? '' : meta.affiliation

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
  return <aside ref={panel} className={`map-marker-detail${row.pollutionCore ? ' map-marker-detail--pollution-core' : ''}${closing ? ' is-closing' : ''}`} aria-label={row.pollutionCore ? '污染原点资料' : row.isRegion ? '区域资料' : '地点资料'}>
    <button className="map-sheet-handle" aria-label="拖动调整资料卡高度" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={event => finish(event, true)} onLostPointerCapture={event => finish(event, true)} onKeyDown={event => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : Math.max(0, Math.min(2, sizes.indexOf(size) + (event.key === 'ArrowUp' ? 1 : -1)))
      onSize(sizes[next])
    }}><span /></button>
    <div className="map-marker-detail__top">
      <span className="map-marker-detail__type">{row.isLandmark ? '海陆图志 · 奇观' : row.isRegion ? '海陆图志 · 地域' : `海陆图志 · ${row.type || '地点'}`}</span>
      <div className="map-sheet-sizes" aria-label="资料卡大小">{sizes.map((value, i) => <button key={value} aria-pressed={size === value} onClick={() => onSize(value)}>{names[i]}</button>)}</div>
      <button className="map-icon-button map-detail-share" onClick={onShare} aria-label={row.isRegion ? '分享此区域' : '分享此地点'} title="分享"><MapIcon name="share" /></button>
      <button className="map-icon-button map-marker-detail__close" onClick={() => onClose(true)} aria-label="关闭资料卡" title="关闭 · Esc"><MapIcon name="close" /></button>
    </div>
    <div ref={scroll} className="map-marker-detail__scroll">
      <div key={identity} className="map-marker-detail__content">
        <h2 className={row.isRegion && (row.is_primary || row.countryOverview) ? 'map-country-title' : undefined}>{row.title || row.sub_group_id || row.group_id || '未命名地点'}</h2>
        {row.foreign_title && <p className="map-marker-detail__foreign" lang={row.pollutionCore ? 'en' : undefined}>{row.foreign_title}</p>}
        {(affiliation || meta.status) && <div className="map-marker-detail__meta">
          {affiliation && <p>{affiliation}</p>}
          {meta.status && <span className="map-region-status" data-status={meta.status} data-special="true">{meta.status}</span>}
        </div>}
        <div className="map-marker-detail__body">
          {localCopy && !row.pollutionCore && <div className="map-description-heading">简介</div>}
          {flag && <figure className="map-detail-country-flag"><img src={flag} fetchPriority="high" decoding="async" alt={`${row.group_id || row.title}国旗`} /></figure>}
          {row.pollutionCore ? <PollutionCoreReport core={row.pollutionCore} /> : <div className="map-marker-detail__description">{(description || '这里的故事，尚待补录。').split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>}
          {(row.countryOverview || (row.isRegion && row.is_primary)) && <section className="map-country-overview" aria-label="国家概况">
            <dl>
              {countryOverviewFields.filter(([key]) =>
                (key !== 'temporarySeat' || overview?.temporarySeat) &&
                (key !== 'rulingParty' || !overview?.hideRulingParty)
              ).map(([key, label]) => {
                const isCouncilSeat = key === 'capital' && overview?.councilSeat
                return <div key={key}>
                  <dt>{isCouncilSeat ? '议事地点' : (key === 'capital' ? overview?.seatLabel : key === 'monarch' ? overview?.leaderLabel : null) ?? label}</dt>
                  <dd>{(isCouncilSeat ? overview.councilSeat : overview?.[key]) || <span>待定</span>}</dd>
                </div>
              })}
            </dl>
          </section>}
          {row.preview && <figure className="map-region-preview"><figcaption>领土略图</figcaption><TerritoryOutline preview={row.preview} />
            {row.previewStatuses?.length > 0 && <div className="map-region-preview__legend" aria-label="略图状态图例">{row.previewStatuses.map(status => <span key={status} data-status={status}><i aria-hidden="true" style={Object.values(POLLUTION_STYLES).find(item => item.label === status) ? { background: Object.values(POLLUTION_STYLES).find(item => item.label === status).ink + '70', borderColor: Object.values(POLLUTION_STYLES).find(item => item.label === status).ink } : undefined} />{status}</span>)}</div>}
          </figure>}
          {history && <section className="map-country-history" aria-label="历史沿革">
            <div className="map-description-heading">历史沿革</div>
            {historyTimeline ? <HistoryTimeline events={historyTimeline} /> : <div className="map-marker-detail__description">{history.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>}
          </section>}
          {row.isRegion && scenes?.length > 0 && <div className="map-region-scenes-heading">地域留影</div>}
          {!row.isRegion && scenes?.length > 0 && <div className="map-city-scenes-heading">风物</div>}
          {scenes?.map((scene, index) => <figure className={`map-city-scene${(row.isRegion || !row.isRegion) && index === 0 ? ' map-city-scene--first' : ''}`} key={`${identity}-${scene.title}-${index}`}>
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
