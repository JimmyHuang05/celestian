import { useEffect, useRef, useState } from 'react'
import { getMusicManager } from '../music-manager.js'
import { soundIcon } from '../page-actions.js'
import './atlas-music-control.css'

export default function AtlasMusicControl({ showPlayer = true }) {
  const [manager] = useState(getMusicManager)
  const [track, setTrack] = useState(() => manager.getSnapshot())
  const [open, setOpen] = useState(false)
  const host = useRef(null), timer = useRef(null), trigger = useRef(null), dismissed = useRef(false)
  useEffect(() => manager.subscribe(() => setTrack(manager.getSnapshot()), window), [manager])
  useEffect(() => {
    const outside = event => { if (!host.current?.contains(event.target)) { clearTimeout(timer.current); setOpen(false) } }
    document.addEventListener('pointerdown', outside)
    return () => { clearTimeout(timer.current); document.removeEventListener('pointerdown', outside) }
  }, [])
  const reveal = (delay = 0) => {
    clearTimeout(timer.current)
    if (!showPlayer || dismissed.current) return
    if (delay) timer.current = setTimeout(() => setOpen(true), delay)
    else setOpen(true)
  }
  const leave = () => { clearTimeout(timer.current); timer.current = setTimeout(() => {
    if (!host.current?.contains(document.activeElement)) setOpen(false)
  }, 180) }
  const playing = track.playing || (track.pending && track.enabled)
  return <div ref={host} className="atlas-music"
    onPointerEnter={event => { if (event.pointerType !== 'touch') reveal(200) }}
    onPointerLeave={() => { dismissed.current = false; leave() }}
    onFocus={() => reveal()} onBlur={leave} onKeyDown={event => {
      if (event.key === 'Escape') {
        dismissed.current = true
        clearTimeout(timer.current)
        trigger.current?.focus()
        setOpen(false)
        event.stopPropagation()
      }
    }}>
    <button ref={trigger} className="page-action atlas-sound-control" type="button"
      aria-label={track.enabled ? '静音' : '开启声音'} title={track.enabled ? '静音' : '开启声音'}
      aria-pressed={!track.enabled} aria-expanded={showPlayer && open} aria-controls={showPlayer ? 'atlas-music-panel' : undefined}
      onClick={event => {
        if (showPlayer && event.nativeEvent.pointerType === 'touch') { dismissed.current = false; setOpen(true) }
        else manager.toggle()
      }}
      dangerouslySetInnerHTML={{ __html: soundIcon(!track.enabled) }} />
    {showPlayer && open && <section id="atlas-music-panel" className="atlas-music-panel" aria-label="音乐播放器">
      <img className="atlas-music-cover" src={track.cover} alt={track.title + '封面'} />
      <div className="atlas-music-titles">
        <strong className="atlas-music-title">{track.title}</strong>
        <span className="atlas-music-title-foreign" lang="en">{track.titleEn}</span>
      </div>
      <button className="atlas-music-play" type="button" disabled={!track.trackId}
        aria-label={playing ? '暂停音乐' : '播放音乐'} onClick={() => manager.toggle(track.blocked)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={playing ? 'M7.5 6h3v12h-3zM13.5 6h3v12h-3z' : 'M8.5 6.5 19 12 8.5 17.5Z'} /></svg>
      </button>
    </section>}
  </div>
}
