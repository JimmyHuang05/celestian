import { POLLUTION_STYLES } from './region-presentation.js'
import { useEffect, useRef, useState } from 'react'
import MapIcon from './MapIcon.jsx'
import { markerIcon, pollutionMarkerGrades } from '../map-markers.js'
import { markerPriority } from './marker-visibility.js'
import MapBasemapPicker from './MapBasemapPicker.jsx'

const switches = [
  ['labels', '地名与文字', '显示地图文字'],
  ['points', '地点与标记', '显示地点与标记'],
  ['countries', '国家疆域', '显示国家疆域'],
  ['statuses', '特殊状态', '显示特殊状态'],
]

export default function MapControls({ mapPlus = false, basemapStyle = 'default', onBasemapStyle, layers, onLayer, labelMode, onLabelMode, legend, pointTypes, onZoom, onFull, onCenter, onReset, onBack, canGoBack, zoomLimits, onShare }) {
  const [open, setOpen] = useState(false)
  const host = useRef(null)
  const toggle = useRef(null)
  useEffect(() => {
    const outside = event => { if (!host.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])
  return <nav ref={host} className="tiled-map__controls" aria-label="地图操作" onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); toggle.current?.focus() }
  }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <div className="map-control-group">
      <button ref={toggle} className="map-icon-button" aria-label="地图显示设置" title="地图显示" aria-expanded={open} aria-controls="map-display-settings" onClick={() => setOpen(!open)}><MapIcon name="layers" /></button>
    </div>
    {open && <div className="map-display-panel" id="map-display-settings">
      <div className="map-display-panel__header"><h2>图层与图例</h2><button className="map-icon-button" aria-label="关闭图层设置" onClick={() => { setOpen(false); toggle.current?.focus() }}><MapIcon name="close" /></button></div>
      {mapPlus && <MapBasemapPicker value={basemapStyle} onChange={onBasemapStyle} />}
      {mapPlus && <><button aria-label="政区显示" aria-pressed={layers.countries} onClick={() => onLayer('countries')}><span>政区显示</span><span className="map-switch" aria-hidden="true"><i /></span></button>{layers.countries && <p className="map-display-note">显示各国国境线与国旗。</p>}</>}
      {mapPlus && <button aria-label="显示航线与名称" aria-pressed={layers.routes!==false} onClick={()=>onLayer('routes')}><span>航线与名称</span><span className="map-switch" aria-hidden="true"><i /></span></button>}
      {([...switches.filter(([key]) => !mapPlus || (key !== 'countries' && key !== 'statuses')), ...(mapPlus ? [['rivers', '河流与湖泊', '显示河流与湖泊']] : [])]).map(([key, title, label]) => <button key={key} aria-label={label} aria-pressed={layers[key]} onClick={() => onLayer(key)}><span>{title}</span><span className="map-switch" aria-hidden="true"><i /></span></button>)}
      <fieldset className="map-label-mode" disabled={!layers.labels}><legend>地名显示</legend><div>{[['auto', '自动分级'], ['all', '完整原图']].map(([value, label]) => <button key={value} aria-pressed={labelMode === value} onClick={() => onLabelMode(value)}>{label}</button>)}</div></fieldset>
      <details className="map-legend">
        <summary>地图图例<MapIcon name="chevron" /></summary>
        <div className="map-legend__points">{[...pointTypes].sort((a, b) => markerPriority(a) - markerPriority(b)).flatMap(type =>
          (type === '污染原点' ? pollutionMarkerGrades : [undefined]).map(grade =>
            <div key={grade ? type + grade : type}><span aria-hidden="true" dangerouslySetInnerHTML={{ __html: markerIcon(type, '#d4b58e', grade) }} /><span>{grade ? `${type} ${grade}` : type}</span></div>
          )
        )}</div>
        {!mapPlus && <div className="map-legend__states">{[...Object.values(POLLUTION_STYLES), { label: '深渊', color: '#79658d', fill: '44' }].map(item => <div key={item.label}><svg width="26" height="20" viewBox="0 0 26 20" aria-hidden="true"><rect x="3" y="3" width="20" height="14" fill={item.color + item.fill} stroke={item.color} strokeDasharray={item.label === '深渊' ? '1 3' : '4 3'} /></svg><span>{item.label}</span></div>)}</div>}
        {layers.countries && <div className="map-legend__countries"><p>{mapPlus ? '国家与地区' : '已配置的国家与区域'}</p>{legend.map(item => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span></div>)}</div>}
      </details>
      <button onClick={() => { onCenter(); setOpen(false) }}><span>回到地图中心</span><MapIcon name="center" /></button>
      <button onClick={onShare}><span>分享当前视野</span><MapIcon name="share" /></button>
      <button onClick={() => { onReset(); setOpen(false) }}><span>恢复默认地图</span><MapIcon name="reset" /></button>

    </div>}
    <div className="map-control-group map-control-group--zoom">
      <button className="map-icon-button" aria-label="放大地图" title="放大" disabled={zoomLimits.max} onClick={() => onZoom(1)}><MapIcon name="plus" /></button>
      <button className="map-icon-button" aria-label="缩小地图" title="缩小" disabled={zoomLimits.min} onClick={() => onZoom(-1)}><MapIcon name="minus" /></button>
    </div>
    <div className="map-control-group"><button className="map-icon-button" aria-label="查看全图" title="查看全图" onClick={onFull}><MapIcon name="globe" /></button></div>
    <div className="map-control-group map-share-control"><button className="map-icon-button" aria-label="分享当前视野" title="分享当前视野" onClick={onShare}><MapIcon name="share" /></button></div>
    {canGoBack && <div className="map-control-group"><button className="map-icon-button" aria-label="返回上一视图" title="返回上一视图" onClick={onBack}><MapIcon name="back" /></button></div>}
  </nav>
}
