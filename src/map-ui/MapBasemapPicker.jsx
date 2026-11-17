import { BASEMAP_STYLES, normalizeBasemapStyle } from './basemap-styles.js'
import legends from './basemap-legends.json'

export default function MapBasemapPicker({ value, onChange }) {
  const active = normalizeBasemapStyle(value)
  const selected = BASEMAP_STYLES.find(style => style.id === active)
  const stops = legends[active]
  const numeric = stops?.[0]?.value !== undefined
  const min = numeric ? stops[0].value : 0, max = numeric ? stops.at(-1).value : 1
  return <div className="map-basemap">
    <fieldset className="map-basemap__picker">
      <legend>底图样式</legend>
      <div>{BASEMAP_STYLES.map(style => <button key={style.id} type="button" aria-label={`${style.label}底图`} aria-pressed={active === style.id} onClick={() => onChange(style.id)}>{style.label}</button>)}</div>
    </fieldset>
    {numeric && <p className="map-basemap__note" aria-live="polite">{selected.note}</p>}
    {numeric && <div className="map-basemap__scale" aria-label={`${selected.note}色标`}>
      <div style={{ background: `linear-gradient(to right, ${stops.map(stop => `${stop.color} ${(stop.value - min) / (max - min) * 100}%`).join(', ')})` }} />
      <p><span>≤ {min.toLocaleString()}</span><span>{active === 'temperature' ? '冷 → 暖' : active === 'precipitation' ? '干 → 湿' : '低 → 高'}</span><span>≥ {max.toLocaleString()}</span></p>
    </div>}
    {active === 'ecology' && <details className="map-basemap__ecology"><summary>生态色标</summary><div>{stops.map(item => <span key={item.name}><i style={{ background: item.color }} />{item.name}</span>)}</div></details>}
    <a className="map-basemap__source" href="https://github.com/guaner-334/civ-atlas" target="_blank" rel="noopener noreferrer" aria-label="地图来源：Civ Atlas，在新标签页打开 GitHub 项目">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 22" /></svg>
      <span>地图来源：<strong>Civ Atlas</strong></span><span aria-hidden="true">↗</span>
    </a>
  </div>
}
