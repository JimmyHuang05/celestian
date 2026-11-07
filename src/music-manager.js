import { MusicController } from './music-controller.js'
import { musicLibrary, musicForPath, MUSIC_FADE_MS } from './music-library.js'
import { pageForPath } from './page-registry.js'

import { readPreference, writePreference, readMusicPreference, subscribePreference } from './preferences.js'

export function getMusicManager() {
  // Managed same-origin pages share the actual player, not just its settings.
  try {
    if (window.parent !== window && window.parent.__celestianMusicManager) return window.parent.__celestianMusicManager
  } catch { /* An unrelated embedding origin cannot own this player. */ }
  if (window.__celestianMusicManager) return window.__celestianMusicManager
  const listeners = new Set()
  const tracks = {}
  const positions = readPreference('musicPositions')
  const host = document.createElement('div')
  host.hidden = true
  host.dataset.musicManager = ''
  document.body.append(host)
  const notify = () => { for (const listener of listeners) listener() }
  const controller = new MusicController(tracks, { ...readMusicPreference(), duration: MUSIC_FADE_MS, onChange: notify })
  let pageId = null
  const save = () => {
    for (const [id, { audio }] of Object.entries(tracks)) positions[id] = audio.currentTime
    writePreference('musicPositions', positions)
    if (controller.hasPreference) writePreference('musicEnabled', controller.enabled)
  }
  const manager = {
    controller,
    get enabled() { return controller.enabled },
    getAudio(id) {
      if (!musicLibrary[id]) throw new Error(`Unknown music track: ${id}`)
      if (!tracks[id]) {
        const config = musicLibrary[id]
        const audio = document.createElement('audio')
        audio.loop = true
        audio.volume = 0
        // A muted page should not download music alongside its first-screen artwork.
        // The controller enables loading immediately when playback is requested.
        audio.preload = 'none'
        audio.dataset.musicTrack = id
        if (config.elementId) audio.id = config.elementId
        for (const [src, type] of config.sources) {
          const source = document.createElement('source')
          source.src = src
          source.type = type
          audio.append(source)
        }
        audio.addEventListener('loadedmetadata', () => {
          const position = positions[id]
          if (Number.isFinite(position) && position > 0 && position < audio.duration) audio.currentTime = position
          notify()
        }, { once: true })
        for (const event of ['durationchange', 'timeupdate', 'play', 'playing', 'pause', 'waiting', 'ended', 'emptied', 'error', 'seeked']) {
          audio.addEventListener(event, () => { if (controller.target === id) notify() })
        }
        host.append(audio)
        tracks[id] = { ...config, audio }
      }
      return tracks[id].audio
    },
    select(id) {
      if (id) manager.getAudio(id)
      controller.setTrack(id)
    },
    setPage(pathname) {
      pageId = pageForPath(pathname)?.id || null
      manager.select(musicForPath(pathname, controller.target))
      notify()
    },
    getSnapshot() {
      const audio = tracks[controller.target]?.audio
      const duration = Number.isFinite(audio?.duration) ? audio.duration : 0
      return {
        pageId, trackId: controller.target, title: musicLibrary[controller.target]?.title || '暂无音乐',
        subtitle: musicLibrary[controller.target]?.subtitle || '',
        cover: musicLibrary[controller.target]?.cover || '',
        enabled: controller.enabled, pending: controller.pending, blocked: controller.blocked,
        playing: Boolean(controller.enabled && !controller.suspended && !controller.blocked && audio && !audio.paused),
        position: audio?.currentTime || 0, duration, canSeek: duration > 0,
      }
    },
    seekTo(fraction) {
      const audio = tracks[controller.target]?.audio
      if (!Number.isFinite(fraction) || !Number.isFinite(audio?.duration) || audio.duration <= 0) return false
      try { audio.currentTime = Math.max(0, Math.min(1, fraction)) * audio.duration } catch { return false }
      save(); notify()
      return true
    },
    toggle(forcePlay = false) {
      controller.toggle(forcePlay)
      save()
    },
    subscribe(listener, owner = window) {
      listeners.add(listener)
      const unsubscribe = () => {
        listeners.delete(listener)
        owner.removeEventListener('pagehide', unsubscribe)
      }
      owner.addEventListener('pagehide', unsubscribe, { once: true })
      return unsubscribe
    },
    retry() { controller.retry() },
  }
  window.__celestianMusicManager = manager
  document.addEventListener('click', manager.retry)
  document.addEventListener('keydown', manager.retry)
  document.addEventListener('visibilitychange', () => controller.setHidden(document.hidden))
  window.addEventListener('pagehide', () => { save(); controller.setHidden(true) })
  window.addEventListener('pageshow', () => controller.setHidden(document.hidden))
  window.addEventListener('beforeunload', save)
  subscribePreference('musicEnabled', enabled => {
    if (typeof enabled === 'boolean' && controller.enabled !== enabled) controller.toggle()
  })
  controller.setHidden(document.hidden)
  return manager
}
