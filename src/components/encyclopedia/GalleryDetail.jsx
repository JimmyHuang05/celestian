import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { fetchGallery, galleryMarkup, galleryText, scenePresentation } from './gallery-content.js'
import './gallery-detail.css'

const number = value => String(value).padStart(2, '0')

function Icon({ name }) {
  const paths = {
    back: <path d="m14 6-6 6 6 6M8 12h13" />,
    next: <path d="m9 5 7 7-7 7" />,
    previous: <path d="m15 5-7 7 7 7" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    frame: <><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" /><path d="M8 8h8v8H8z" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    music: <><path d="M9 18V6l11-2v12M9 9l11-2" /><ellipse cx="6" cy="18" rx="3" ry="2" /><ellipse cx="17" cy="16" rx="3" ry="2" /></>,
    muted: <path d="M10 7 6 10H3v4h3l4 3V7Zm5 2 6 6m0-6-6 6" />,
    grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
    read: <path d="M4 5h12v14H4zM8 9h4m-4 4h4m8-5v13H7" />,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

// Decode first: keep the last complete scene while the next one arrives.
function SceneImage({ src, name, position, onSwipe }) {
  const [frames, setFrames] = useState({ current: null, previous: null })
  const [failure, setFailure] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const pointer = useRef(null)
  const { desktop, mobile } = position
  useEffect(() => {
    if (!src) return
    let cancelled = false
    const image = new Image()
    image.onload = async () => {
      try { await image.decode() } catch { /* onload confirms a usable image. */ }
      if (!cancelled) {
        setFailure(null)
        setFrames(previous => previous.current?.src === src ? previous : {
          previous: previous.current, current: { src, name, desktop, mobile },
        })
      }
    }
    image.onerror = () => { if (!cancelled) setFailure(src) }
    image.src = src
    return () => { cancelled = true }
  }, [src, name, desktop, mobile, attempt])
  const failed = src && failure === src
  const loading = src && frames.current?.src !== src && !failed
  return <div className="gallery-scene" aria-busy={Boolean(loading)}
    onPointerDown={event => {
      if (event.isPrimary && event.pointerType !== 'mouse') pointer.current = { x: event.clientX, y: event.clientY }
    }}
    onPointerCancel={() => { pointer.current = null }}
    onPointerUp={event => {
      if (!pointer.current) return
      const dx = event.clientX - pointer.current.x, dy = event.clientY - pointer.current.y
      pointer.current = null
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? 1 : -1)
    }}>
    {src && [frames.previous, frames.current].filter(Boolean).map((frame, index, list) => <img
      key={frame.src} src={frame.src} alt={index === list.length - 1 ? frame.name : ''}
      draggable="false" className={'gallery-scene-image ' + (index === list.length - 1 ? 'is-current' : 'is-previous')}
      style={{ '--scene-position': frame.desktop, '--scene-mobile-position': frame.mobile }} />)}
    {(loading || failed || !src) && <div className={'gallery-image-status ' + (failed || !src ? 'is-error' : '')} role="status">
      {loading ? <><span className="gallery-loading-line" />正在展开画面</> : <>
        <span>{src ? '这幅留影暂时无法载入' : '这份档案尚未收录画面'}</span>
        {src && <button onClick={() => { setFailure(null); setAttempt(value => value + 1) }}>重新加载</button>}
      </>}
    </div>}
  </div>
}

function GalleryPanel({ entries, index, onSelect, onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current, opener = document.activeElement
    element.showModal()
    return () => { element.close(); if (opener?.isConnected) opener.focus() }
  }, [])
  return <dialog ref={dialog} className="gallery-dialog" aria-labelledby="gallery-panel-title"
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="gallery-panel">
      <header className="gallery-panel-header">
        <h2 id="gallery-panel-title">留影目录<small>ARCHIVE INDEX · {number(entries.length)}</small></h2>
        <button className="gallery-icon-button" onClick={onClose} aria-label="关闭面板"><Icon name="close" /></button>
      </header>
      <div className="gallery-panel-scroll" tabIndex={0} role="region" aria-label="留影目录">
        <div className="gallery-index-grid">
          {entries.map((item, i) => <button key={item.id} aria-current={i === index ? 'true' : undefined} onClick={() => onSelect(i)}>
            <span className="gallery-index-image">{item.images[0] && <img src={scenePresentation(item).thumbnail} alt="" loading="lazy" />}</span>
            <span className="gallery-index-label"><small>{number(i + 1)}</small><span>{item.name}<em>{item.subtitle}</em></span></span>
          </button>)}
        </div>
      </div>
    </section>
  </dialog>
}

function GalleryDetail({ node, onClose, entryId, onEntryChange, isPlayingBgm, onToggleBgm }) {
  const [data, setData] = useState({ status: 'loading', entries: [] })
  const [attempt, setAttempt] = useState(0)
  const [selection, setSelection] = useState(null)
  const [photo, setPhoto] = useState({ id: null, index: 0 })
  const [panel, setPanel] = useState(null)
  const [immersed, setImmersed] = useState(false)
  const [fit, setFit] = useState(false)
  const showInterface = useRef(null)
  const hideInterface = useRef(null)
  const { entries, status } = data
  const index = Math.max(0, entries.findIndex(item => item.id === (entryId || selection)))
  const entry = entries[index]
  const photoIndex = entry && photo.id === entry.id ? Math.max(0, Math.min(photo.index, entry.images.length - 1)) : 0
  const src = entry?.images[photoIndex] || ''
  const presentation = scenePresentation(entry)

  useEffect(() => {
    const controller = new AbortController()
    fetchGallery(node.id, controller.signal).then(result => setData({ status: 'ready', entries: result })).catch(error => {
      if (error.name !== 'AbortError') setData({ status: 'error', entries: [] })
    })
    return () => controller.abort()
  }, [node.id, attempt])

  useEffect(() => {
    if (entries.length && !entries.some(item => item.id === entryId)) onEntryChange?.(entries[0].id)
  }, [entries, entryId, onEntryChange])

  const choose = useCallback(nextIndex => {
    const next = entries[nextIndex]
    if (!next) return
    setSelection(next.id)
    setPanel(null)
    onEntryChange?.(next.id)
  }, [entries, onEntryChange])
  const step = useCallback(direction => choose(index + direction), [choose, index])

  useEffect(() => {
    function keydown(event) {
      if (panel || event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return
      if (event.key === 'Escape') {
        if (immersed) { setImmersed(false); requestAnimationFrame(() => hideInterface.current?.focus()) }
        else if (fit) setFit(false)
        else onClose()
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1)
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [panel, immersed, fit, onClose, step])

  function toggleImmersion() {
    setImmersed(value => !value)
    requestAnimationFrame(() => (immersed ? hideInterface : showInterface).current?.focus())
  }

  return <main className={'cinematic-gallery ' + (immersed ? 'is-immersed ' : '') + (fit ? 'is-fitted' : '')} aria-label="留影">
    {entry && <SceneImage src={src} name={entry.name + ' · 视角 ' + (photoIndex + 1)} position={presentation} onSwipe={step} />}
    <div className="gallery-interface" inert={immersed} aria-hidden={immersed}>
      <button className="gallery-close gallery-icon-button" aria-label="返回百科" title="返回百科" onClick={onClose}><Icon name="close" /></button>
      {status === 'loading' ? <div className="gallery-empty" role="status"><span className="gallery-loading-line" /><p>正在展开留影</p></div> : !entry ? <div className="gallery-empty" role="status">
        <span className="gallery-eyebrow">CELESTIAN · GALLERY</span>
        <h1>{status === 'error' ? '留影暂时未能抵达' : '此处风景，尚待收录'}</h1>
        {status === 'error' && <button onClick={() => { setData({ status: 'loading', entries: [] }); setAttempt(value => value + 1) }}>重新载入</button>}
      </div> : <>
        <nav className="gallery-pagination" aria-label="切换地点">
          <button className="gallery-icon-button gallery-previous" disabled={index === 0} aria-label="上一处留影" onClick={() => step(-1)}><Icon name="previous" /></button>
          <button className="gallery-icon-button gallery-next" disabled={index === entries.length - 1} aria-label="下一处留影" onClick={() => step(1)}><Icon name="next" /></button>
        </nav>
        {entry.images.length > 1 && <div className="gallery-views" role="group" aria-label="场景视角">
          {entry.images.map((url, i) => <button key={url} aria-label={'视角 ' + (i + 1)} aria-pressed={photoIndex === i} onClick={() => setPhoto({ id: entry.id, index: i })}><span /></button>)}
        </div>}
        <section className="gallery-details" key={entry.id} aria-label={entry.name + '场景档案'}>
          <div className="gallery-details-content">
            <header className="gallery-identity">
              {entry.englishName && <p className="gallery-english-name" lang="en">{entry.englishName}</p>}
              <h1>{entry.name}</h1>
              {entry.subtitle && <p className="gallery-subtitle">{entry.subtitle}</p>}
              {!!entry.facts.length && <dl className="gallery-facts">{entry.facts.map((fact, i) => <div key={i}>
                <dt>{fact.key}</dt><dd dangerouslySetInnerHTML={{ __html: galleryMarkup(fact.value) }} />
              </div>)}</dl>}
            </header>
            <div className="gallery-narrative">
              <div className="gallery-story-heading"><h2>场景纪事</h2><span aria-hidden="true" /><small lang="en">CHRONICLE</small></div>
              <article className="gallery-story" tabIndex={0} role="region" aria-label="场景正文">
                {entry.blocks.map((block, i) => block.type === 'quote' ? <blockquote key={i}>
                  <p dangerouslySetInnerHTML={{ __html: galleryMarkup(block.content) }} />
                  {block.author && <cite>—— {galleryText(block.author)}</cite>}
                </blockquote> : <p key={i} dangerouslySetInnerHTML={{ __html: galleryMarkup(block.content) }} />)}
                {!entry.blocks.length && <p>这片风景的故事，尚待记录。</p>}
              </article>
            </div>
          </div>
          <footer className="gallery-archive-footer">
            <button className="gallery-index-trigger" onClick={() => setPanel('index')} aria-label="打开全部留影">
              <Icon name="grid" /><span>留影目录</span><span className="gallery-record-count"><b>{number(index + 1)}</b><i>/</i>{number(entries.length)}</span>
            </button>
            <div className="gallery-tools">
              {onToggleBgm && <button className="gallery-tool-button" aria-label={isPlayingBgm ? '静音背景音乐' : '开启背景音乐'} aria-pressed={!isPlayingBgm} title={isPlayingBgm ? '静音背景音乐' : '开启背景音乐'} onClick={onToggleBgm}><Icon name={isPlayingBgm ? 'music' : 'muted'} /><span>音乐 · {isPlayingBgm ? '开' : '关'}</span></button>}
              <button className="gallery-tool-button" disabled={!src} aria-label={fit ? '铺满画面' : '查看完整构图'} aria-pressed={fit} title={fit ? '铺满画面' : '查看完整构图'} onClick={() => setFit(value => !value)}><Icon name="frame" /><span>{fit ? '铺满画面' : '完整构图'}</span></button>
              <button ref={hideInterface} className="gallery-tool-button" aria-label="隐藏界面，沉浸观赏" title="隐藏界面" onClick={toggleImmersion}><Icon name="eye" /><span>沉浸观赏</span></button>
            </div>
          </footer>
        </section>
      </>}
    </div>
    {immersed && <button ref={showInterface} className="gallery-restore" onClick={toggleImmersion}><Icon name="eye" /><span>显示界面</span></button>}
    {panel && entry && <GalleryPanel entries={entries} index={index} onSelect={choose} onClose={() => setPanel(null)} />}
  </main>
}

export default memo(GalleryDetail)
