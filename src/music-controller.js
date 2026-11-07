// Media elements outlive route changes. A new request cancels the old
// envelope but preserves its current gains, including rapid Back/Forward.
export class MusicController {
  constructor(tracks, { enabled = false, hasPreference = false, onChange = () => {}, duration = 2500 } = {}) {
    this.tracks = tracks
    this.enabled = enabled
    this.hasPreference = hasPreference
    this.onChange = onChange
    this.duration = duration
    this.target = null
    this.suspended = false
    this.generation = 0
    this.frame = null
    this.pending = false
    this.blocked = false
    for (const { audio } of Object.values(tracks)) audio.volume = 0
  }

  setTrack(track) {
    if (this.target === track) return
    this.target = track
    if (this.tracks[track]?.autoplay && !this.hasPreference) this.enabled = true
    this.onChange(this.enabled)
    this.transition()
  }

  toggle(forcePlay = false) {
    this.hasPreference = true
    this.enabled = forcePlay || !this.enabled
    this.onChange(this.enabled)
    this.transition()
  }

  retry() {
    if (this.blocked && !this.pending && this.enabled && !this.suspended) this.transition()
  }

  cancel() {
    this.generation++
    cancelAnimationFrame(this.frame)
    this.frame = null
    this.pending = false
  }

  async transition() {
    this.cancel()
    const generation = this.generation
    const target = this.enabled && !this.suspended ? this.target : null
    const incoming = this.tracks[target]?.audio
    this.blocked = false
    if (incoming) {
      incoming.preload = 'auto'
      this.pending = true
      this.onChange(this.enabled)
      try {
        await incoming.play()
      } catch {
        if (generation === this.generation) {
          this.pending = false
          this.blocked = true
          this.onChange(this.enabled)
        }
        return // Keep the outgoing track audible if the new one cannot start.
      }
      if (generation !== this.generation) return
      this.pending = false
      this.onChange(this.enabled)
    }
    // Lazy registration may add tracks during a fade; this envelope owns only
    // the tracks whose starting gains were captured together.
    const fadingTracks = Object.entries(this.tracks)
    const starts = Object.fromEntries(fadingTracks.map(([key, { audio }]) => [key, audio.volume]))
    let previous = null
    let elapsed = 0
    const tick = now => {
      if (generation !== this.generation) return
      const delta = previous === null ? 0 : now - previous
      previous = now
      // A buffering incoming track must not fade the old one into silence.
      if (!incoming || (!incoming.paused && incoming.readyState >= 3)) elapsed += delta
      const progress = Math.min(1, elapsed / this.duration)
      const blend = (1 - Math.cos(Math.PI * progress)) / 2
      for (const [key, { audio, volume }] of fadingTracks) {
        const end = key === target ? volume : 0
        // Equal-power interpolation avoids a volume dip halfway through.
        audio.volume = Math.sqrt((1 - blend) * starts[key] ** 2 + blend * end ** 2)
        if (progress === 1 && key !== target) audio.pause()
      }
      if (progress < 1) this.frame = requestAnimationFrame(tick)
      else { this.frame = null; this.onChange(this.enabled) }
    }
    this.frame = requestAnimationFrame(tick)
  }

  setHidden(hidden) {
    if (this.suspended === hidden) return
    this.suspended = hidden
    if (hidden) {
      this.cancel()
      for (const { audio } of Object.values(this.tracks)) {
        audio.pause()
        audio.volume = 0
      }
      this.onChange(this.enabled)
    } else this.transition()
  }

  destroy() {
    this.cancel()
    for (const { audio } of Object.values(this.tracks)) audio.pause()
  }
}
