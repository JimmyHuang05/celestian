import { useEffect, useRef, useState } from 'react'
import MapIcon from './MapIcon.jsx'
import { searchMap } from './search.js'
import { regionMeta } from './region-presentation.js'

export default function MapSearch({ points, regions, query, setQuery, type, onType, open, onOpen, onSelect, inputRef }) {
  const host = useRef(null)
  const filterButton = useRef(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const results = searchMap(points, regions, query, type)
  const types = Array.isArray(type) ? type : type ? [type] : []
  const visible = !filterOpen && open && Boolean(query.trim() || types.length)
  const counts = points.reduce((all, row) => { all[row.type] = (all[row.type] || 0) + 1; return all }, {})

  useEffect(() => {
    const outside = event => {
      if (!host.current?.contains(event.target)) { onOpen(false); setFilterOpen(false) }
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [onOpen])

  useEffect(() => {
    if (visible && active >= 0) document.getElementById(`map-result-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, visible])

  function choose(result) {
    if (!result) return
    onOpen(false); setFilterOpen(false); setActive(-1)
    onSelect(result)
    if (matchMedia('(max-width: 640px)').matches) inputRef.current?.blur()
  }
  function changeType(value) {
    onType(value ? types.includes(value) ? types.filter(item => item !== value) : [...types, value] : [])
    setActive(-1); onOpen(false)
  }
  function keyDown(event) {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Escape' && (visible || filterOpen)) {
      event.preventDefault(); event.stopPropagation(); onOpen(false); setFilterOpen(false); setActive(-1)
    } else if (!filterOpen && ['ArrowDown', 'ArrowUp'].includes(event.key) && results.length && (query || types.length)) {
      event.preventDefault(); onOpen(true)
      setActive(index => event.key === 'ArrowDown' ? (index + 1) % results.length : (index <= 0 ? results.length - 1 : index - 1))
    } else if (event.key === 'Enter' && visible && results.length) {
      event.preventDefault(); choose(results[active >= 0 ? active : 0])
    }
  }
  return <div ref={host} className="map-search" onKeyDown={keyDown} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) { onOpen(false); setFilterOpen(false) }
  }}>
    <div className="map-search__bar">
      <button ref={filterButton} className="map-icon-button map-search__filter-toggle" aria-label="筛选地点分类" aria-expanded={filterOpen} aria-controls="map-type-panel" data-active={types.length > 0} onClick={() => { setFilterOpen(!filterOpen); onOpen(false) }}><MapIcon name="filter" />{types.length > 0 && <span className="map-filter-count">{types.length}</span>}</button>
      <input ref={inputRef} role="combobox" aria-label="搜索地点或区域" aria-autocomplete="list" aria-expanded={visible} aria-controls="map-search-results" aria-activedescendant={visible && active >= 0 && results[active] ? `map-result-${active}` : undefined} autoComplete="off" placeholder="搜索地点、国家或区域" value={query} onFocus={() => onOpen(true)} onChange={event => { setQuery(event.target.value); setActive(-1); onOpen(true) }} />
      {query && <button className="map-icon-button" aria-label="清空搜索" onClick={() => { setQuery(''); setActive(-1); inputRef.current?.focus() }}><MapIcon name="close" /></button>}
    </div>
    {filterOpen && <div className="map-search__filter-panel" id="map-type-panel">
      <div className="map-type-heading" id="map-type-heading">地点分类</div>
      <div className="map-type-options" role="group" aria-labelledby="map-type-heading" onKeyDown={event => {
        event.stopPropagation()
        const buttons = [...event.currentTarget.querySelectorAll('button')]
        const index = buttons.indexOf(document.activeElement)
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault()
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
          buttons[next]?.focus()
        } else if (event.key === 'Escape') { event.preventDefault(); setFilterOpen(false); filterButton.current?.focus() }
      }}>
        {[['', points.length], ...Object.entries(counts)].map(([name, count]) => <button key={name} type="button" aria-pressed={name ? types.includes(name) : !types.length} onClick={() => changeType(name)}>
          <span className="map-type-check" aria-hidden="true">{(name ? types.includes(name) : !types.length) ? '✓' : ''}</span><span>{name || '全部地点'}</span><span className="map-type-count">{count}</span>
        </button>)}
      </div>
      <p>可多选地点分类；选择全部地点可取消筛选。</p>
    </div>}
    {visible && <div className="map-search__results-shell">
      <div className="map-search__results" id="map-search-results" role="listbox" aria-label="搜索结果">
        {!results.length && <p className="map-search__empty">没有找到匹配结果，试试其他名称。</p>}
        {['region', 'point'].map(kind => {
          const entries = results.map((result, index) => ({ ...result, index })).filter(result => result.kind === kind)
          return entries.length > 0 && <div key={kind} role="group" aria-label={kind === 'region' ? '国家与区域' : '地点'}>
            <p className="map-search__group" aria-hidden="true">{kind === 'region' ? '国家与区域' : '地点'}<span>{entries.length}</span></p>
            {entries.map(({ row, index, key }) => <button key={key} id={`map-result-${index}`} role="option" aria-selected={active === index} tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => choose(results[index])}>
              <span className="map-search__result-icon"><MapIcon name={kind === 'region' ? 'region' : 'pin'} /></span>
              <span><strong>{row.title || '未命名地点'}</strong><small>{kind === 'region' ? [regionMeta(row).affiliation, regionMeta(row).status].filter(Boolean).join(' ｜ ') : [row.type, row.foreign_title].filter(Boolean).join(' · ')}</small></span>
            </button>)}
          </div>
        })}
      </div>
      <div className="map-search__hint"><span>↑ ↓ 选择 · Enter 定位</span><button onClick={() => { setQuery(''); onType(''); setActive(-1); onOpen(false) }}>清除条件</button></div>
      <span className="sr-only" role="status">找到 {results.length} 个结果</span>
    </div>}
  </div>
}
