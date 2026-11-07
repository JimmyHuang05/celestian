import { soundLibrary } from './sound-library.js'
import { readPreference, writePreference, subscribePreference } from './preferences.js'
import { pageIsActive, subscribePageActivity } from './page-lifecycle.js'

// Effects are scoped to their visible document; BGM continues in the owner.
export function getSoundManager() {
  if (window.__celestianSoundManager) return window.__celestianSoundManager
  let context, muted = readPreference('soundMuted')
  const buffers = new Map(), media = new Map(), channels = new Map(), lastPlayed = new Map(), listeners = new Set()
  const channelFor = name => {
    if (!channels.has(name)) channels.set(name, { version: 0, timer: null, voice: null })
    return channels.get(name)
  }
  const cancel = name => {
    const channel = channelFor(name)
    channel.version++
    clearTimeout(channel.timer)
    if (channel.voice) {
      const voice = channel.voice
      channel.voice = null
      if (voice.pause) voice.pause()
      else {
        voice.gain.gain.cancelScheduledValues(context.currentTime)
        voice.gain.gain.setTargetAtTime(0, context.currentTime, .018)
        try { voice.source.stop(context.currentTime + .09) } catch { /* Already ended. */ }
      }
    }
  }
  const cancelAll = () => { for (const name of channels.keys()) cancel(name) }
  const prepare = async id => {
    const config = soundLibrary[id]
    if (!config || muted) return null
    if (!config.buffered) {
      if (!media.has(id)) { const audio = new Audio(config.src); audio.preload = 'none'; audio.volume = config.volume; media.set(id, audio) }
      return media.get(id)
    }
    context ??= new (window.AudioContext || window.webkitAudioContext)()
    if (!buffers.has(id)) buffers.set(id, fetch(config.src).then(response => {
      if (!response.ok) throw new Error('Sound unavailable')
      return response.arrayBuffer()
    }).then(bytes => context.decodeAudioData(bytes)).catch(error => { buffers.delete(id); throw error }))
    return buffers.get(id)
  }
  const manager = {
    get muted() { return muted },
    prepare, cancel,
    unlock() { if (context?.state === 'suspended') void context.resume().catch(() => {}) },
    setMuted(value) { writePreference('soundMuted', Boolean(value)) },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    play(id, { delay = 0, waitForLoad = false } = {}) {
      const config = soundLibrary[id]
      if (!config || muted || !pageIsActive()) return
      const now = performance.now()
      if (now - (lastPlayed.get(id) ?? -Infinity) < (config.cooldown || 0)) return
      lastPlayed.set(id, now)
      cancel(config.channel)
      const channel = channelFor(config.channel), version = channel.version
      if (!config.buffered) {
        // Call play during the gesture, without an async fetch/decode boundary.
        let audio = media.get(id)
        if (!audio) { audio = new Audio(config.src); audio.volume = config.volume; media.set(id, audio) }
        audio.currentTime = 0
        channel.voice = audio
        void audio.play().catch(() => {})
        return
      }
      const pending = prepare(id)
      pending.catch(() => {})
      manager.unlock()
      channel.timer = setTimeout(async () => {
        try {
          const buffer = await pending
          if (channel.version !== version || muted || !pageIsActive() || context.state !== 'running') return
          if (!waitForLoad && performance.now() > now + delay + 500) return
          const source = context.createBufferSource(), gain = context.createGain()
          source.buffer = buffer; gain.gain.value = config.volume
          source.connect(gain); gain.connect(context.destination)
          const voice = { source, gain }; channel.voice = voice
          source.onended = () => { source.disconnect(); gain.disconnect(); if (channel.voice === voice) channel.voice = null }
          source.start()
        } catch { /* A subsequent interaction can retry a failed asset. */ }
      }, delay)
    },
  }
  subscribePreference('soundMuted', value => {
    muted = value
    if (muted) cancelAll()
    for (const listener of listeners) listener()
  })
  subscribePageActivity(active => { if (!active) cancelAll() })
  window.addEventListener('pagehide', event => { if (!event.persisted) { cancelAll(); void context?.close().catch(() => {}) } })
  window.__celestianSoundManager = manager
  return manager
}
