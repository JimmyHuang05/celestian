import { memo, useEffect, useRef, useState } from 'react'
import { fetchGallery, galleryText } from './gallery-content.js'
import assets from './gallery-scene-assets.json'
import { mountGallery } from '../../gallery-live.js'
import './gallery-detail.css'

function GalleryDetail({ node, onClose, entryId, onEntryChange, isPlayingBgm, onToggleBgm }) {
  const host = useRef(null), gallery = useRef(null), callbacks = useRef(null)
  const [data, setData] = useState(null), [error, setError] = useState(false), [attempt, setAttempt] = useState(0)
  useEffect(() => { callbacks.current = { onClose, onEntryChange, onToggleBgm, entryId, isPlayingBgm } })
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
      music: callbacks.current.isPlayingBgm,
      onClose: () => callbacks.current.onClose(),
      onSceneChange: id => callbacks.current.onEntryChange?.(id),
      onToggleMusic: () => callbacks.current.onToggleBgm?.(),
    })
    return () => {
      gallery.current?.destroy()
      gallery.current = null
      document.documentElement.classList.remove('gallery-active')
    }
  }, [data])
  useEffect(() => { gallery.current?.select(entryId) }, [entryId])
  useEffect(() => { gallery.current?.setMusic(isPlayingBgm) }, [isPlayingBgm])
  return <div className="live-gallery" aria-label="留影">
    <div ref={host} className="gallery-mount" />
    {!data?.length && <div className="gallery-loading" role="status">
      <p>{error ? '留影暂时无法载入' : data ? '此处风景，尚待收录' : '正在展开留影…'}</p>
      {error && <button onClick={() => { setError(false); setAttempt(value => value + 1) }}>重新载入</button>}
      <button onClick={onClose}>返回百科</button>
    </div>}
  </div>
}
export default memo(GalleryDetail)
