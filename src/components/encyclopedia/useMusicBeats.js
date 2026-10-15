import { useEffect, useRef } from 'react'
import approvedBeats from './encyclopedia-beats.json'

// Analyse the unchanged track before output volume/muting. Cues are tied to
// media time, so muted playback, seeking and looping share one timeline.
export function buildBeatMap(buffer, diagnostics) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i))
  const hop = 512, frames = [], rate = buffer.sampleRate
  const smoothing = 1 - Math.exp(-2 * Math.PI * 180 / rate)
  let bass = 0, lastLevel = 0
  for (let start = 0; start + hop < buffer.length; start += hop) {
    let energy = 0, lowEnergy = 0
    for (let i = start; i < start + hop; i++) {
      let sample = 0
      for (const channel of channels) sample += channel[i] / channels.length
      bass += smoothing * (sample - bass)
      energy += sample * sample; lowEnergy += bass * bass
    }
    const level = Math.sqrt(energy / hop) + .8 * Math.sqrt(lowEnergy / hop)
    frames.push({ time: start / rate, level, flux: Math.max(0, level - lastLevel) })
    lastLevel = level
  }
  const candidates = [], radius = Math.round(.4 * rate / hop)
  const peakWindow = Math.ceil(.1 * rate / hop)
  for (let i = 2; i < frames.length - 2; i++) {
    const frame = frames[i]
    if (frame.flux < .004 || frame.level < .025) continue
    if (frame.flux < frames[i - 1].flux || frame.flux < frames[i + 1].flux) continue
    let mean = 0, count = 0
    for (let j = Math.max(0, i - radius); j < Math.min(frames.length, i + radius); j++) { mean += frames[j].flux; count++ }
    const threshold = Math.max(.004, mean / count * 2.8)
    if (frame.flux < threshold) continue
    // Rank an attack by the energy it reaches, not just its first-frame slope.
    // Keep timing at the attack so the flash does not lag behind the sound.
    let peak = frame
    for (let j = i + 1; j < Math.min(frames.length, i + peakWindow + 1); j++) {
      if (frames[j].level > peak.level) peak = frames[j]
    }
    candidates.push({ time: frame.time, peakTime: peak.time, level: peak.level,
      score: peak.level, accepted: false })
  }
  const selected = []
  for (const candidate of [...candidates].sort((a, b) => b.score - a.score || a.time - b.time)) {
    if (selected.some(other => Math.abs(other.time - candidate.time) < .35)) continue
    candidate.accepted = true
    selected.push(candidate)
  }
  const strongest = Math.max(.025, ...selected.map(c => c.score))
  const cues = selected.sort((a, b) => a.time - b.time).map(c => ({
    time: c.time, strength: Math.max(.25, Math.min(1, c.score / strongest))
  }))
  if (diagnostics) Object.assign(diagnostics, { frames, hop, rate, radius, candidates })
  return cues
}

export default function useMusicBeats(audioRef, onBeat) {
  const callback = useRef(onBeat)
  useEffect(() => { callback.current = onBeat }, [onBeat])
  useEffect(() => {
    const audio = audioRef?.current
    if (!audio) return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const cues = approvedBeats.cues
    let frame, index = 0, previousTime = null
    const align = () => {
      index = cues.findIndex(cue => cue.time > audio.currentTime)
      if (index < 0) index = cues.length
      previousTime = audio.currentTime
    }
    const tick = () => {
      const time = audio.currentTime
      if (audio.paused || audio.seeking || document.hidden || motion.matches) align()
      else {
        if (previousTime === null || time < previousTime || time - previousTime > .4) align()
        while (index < cues.length && cues[index].time <= time) {
          const cue = cues[index++]
          if (time - cue.time < .12) callback.current(cue)
        }
        previousTime = time
      }
      frame = requestAnimationFrame(tick)
    }
    audio.addEventListener('seeked', align)
    align(); frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      audio.removeEventListener('seeked', align)
    }
  }, [audioRef])
}
