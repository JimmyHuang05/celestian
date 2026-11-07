import { memo, useEffect, useRef, useState } from 'react'
import { fetchGallery, galleryText } from './gallery-content.js'
import assets from './gallery-scene-assets.json'
import { mountGallery } from '../../gallery-live.js'
import './gallery-detail.css'
import '../../page-actions.css'
import './gallery-actions.css'

function GalleryDetail({ node, onClose, entryId, onEntryChange }) {
  const host = useRef(null), gallery = useRef(null), callbacks = useRef(null)
  const [data, setData] = useState(null), [error, setError] = useState(false), [attempt, setAttempt] = useState(0)
  useEffect(() => { callbacks.current = { onClose, onEntryChange, entryId } })
  useEffect(() => {
    const controller = new AbortController()
    fetchGallery(node.id, controller.signal).then(entries => {
      setData(entries.map(entry => ({
        ...entry, english: entry.englishName,
        images: entry.images.map(url => assets[url] || url),
        paragraphs: entry.blocks.map(block => galleryText(block.content) + (block.author ? ' —— ' + galleryText(block.author) : '')),
      })))
    }).catch(error => { if (error.name !== 'AbortError') setError(true) })
    return () => controller.abort()
  }, [node.id, attempt])
  useEffect(() => {
    if (!data?.length) return
    document.documentElement.classList.add('gallery-active')
    gallery.current = mountGallery(host.current, data, {
      initialId: callbacks.current.entryId,
      onClose: () => callbacks.current.onClose(),
      onSceneChange: id => callbacks.current.onEntryChange?.(id),
    })
    return () => {
      gallery.current?.destroy()
      gallery.current = null
      document.documentElement.classList.remove('gallery-active')
    }
  }, [data])
  useEffect(() => { gallery.current?.select(entryId) }, [entryId])
  return <div className="live-gallery" aria-label="留影">
    <div ref={host} className="gallery-mount" />
    {!data?.length && <div className="gallery-header-tools">
      <button className="page-action page-action--close" onClick={onClose} aria-label="关闭并返回百科" title="关闭并返回百科"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
    </div>}
    {!data?.length && (error || data) && <div className="gallery-loading" role="status">
      <p>{error ? '留影暂时无法载入' : '此处风景，尚待收录'}</p>
      {error && <button onClick={() => { setError(false); setAttempt(value => value + 1) }}>重新载入</button>}
    </div>}
  </div>
}
export default memo(GalleryDetail)
