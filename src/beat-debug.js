import { buildBeatMap } from './components/encyclopedia/useMusicBeats.js'

const audio = document.querySelector('#music')
const stage = document.querySelector('#stage')
const canvas = document.querySelector('#chart')
const ctx = canvas.getContext('2d')
const diagnostics = {}
const storageKey = 'celestian-beat-debug-edits-v1'
let duration = 0, drawnStart = -4
function saveEdits(message) {
  cues.sort((a, b) => a.time - b.time)
  align()
  try {
    localStorage.setItem(storageKey, JSON.stringify({ duration, cues }))
    document.querySelector('#edit-status').textContent = `${message} · 已保存到本机`
  } catch { document.querySelector('#edit-status').textContent = `${message} · 浏览器无法保存，刷新后会丢失` }
  updateStatus()
}
function updateStatus() {
  document.querySelector('#status').textContent = ` 已就绪 · ${duration.toFixed(1)} 秒 · ${cues.length} 个触发点`
}
function editTime(event) {
  const rect = canvas.getBoundingClientRect()
  return drawnStart + (event.clientX - rect.left - canvas.clientLeft) / canvas.clientWidth * 8
}
canvas.addEventListener('click', event => {
  if (!ready) return
  const time = editTime(event)
  if (time < 0 || time >= duration) return
  if (cues.some(c => Math.abs(c.time - time) < .025)) return
  cues.push({ time, strength: 1, manual: true })
  saveEdits(`新增 ${time.toFixed(3)} 秒`)
})
canvas.addEventListener('contextmenu', event => {
  event.preventDefault()
  if (!ready) return
  const time = editTime(event), tolerance = 12 / canvas.clientWidth * 8
  let nearest = -1, distance = tolerance
  cues.forEach((cue, index) => {
    const delta = Math.abs(cue.time - time)
    if (delta <= distance) { nearest = index; distance = delta }
  })
  if (nearest < 0) {
    document.querySelector('#edit-status').textContent = '附近没有触发点，请右键点击竖线附近（12 像素内）'
    return
  }
  const [removed] = cues.splice(nearest, 1)
  saveEdits(`删除 ${removed.time.toFixed(3)} 秒`)
})
let cues = [], frames = [], cursor = 0, previous = null, flashUntil = 0, ready = false
audio.volume = .35
const align = () => {
  cursor = cues.findIndex(cue => cue.time > audio.currentTime)
  if (cursor < 0) cursor = cues.length
  previous = audio.currentTime
  flashUntil = 0
  stage.classList.remove('hit')
}
audio.addEventListener('seeked', align)
audio.addEventListener('pause', () => { flashUntil = 0; stage.classList.remove('hit') })
document.querySelector('#restart').onclick = () => { audio.currentTime = 0; align(); audio.play().catch(() => {}) }
document.querySelector('#export').onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ duration, cues }, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url; link.download = 'encyclopedia-beats.json'; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function load() {
  let context
  try {
    const response = await fetch(audio.src)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const bytes = await response.arrayBuffer()
    context = new AudioContext()
    const buffer = await context.decodeAudioData(bytes)
    cues = buildBeatMap(buffer, diagnostics)
    duration = buffer.duration
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey))
      if (saved && Math.abs(saved.duration - duration) < .01 && Array.isArray(saved.cues) && saved.cues.every(c => Number.isFinite(c.time) && c.time >= 0 && c.time < duration && Number.isFinite(c.strength) && c.strength >= 0 && c.strength <= 1)) {
        cues = saved.cues.sort((a, b) => a.time - b.time)
        document.querySelector('#edit-status').textContent = '已恢复本机保存的触发点'
      }
    } catch { /* Invalid or unavailable storage leaves the automatic map intact. */ }
    const prefix = [0]
    diagnostics.frames.forEach(frame => prefix.push(prefix.at(-1) + frame.flux))
    frames = diagnostics.frames.map((frame, i) => {
      const lo = Math.max(0, i - diagnostics.radius), hi = Math.min(diagnostics.frames.length, i + diagnostics.radius)
      return { ...frame, threshold: Math.max(.004, (prefix[hi] - prefix[lo]) / (hi - lo) * 2.8) }
    })
    ready = true; align()
    document.querySelector('#export').disabled = false
    document.querySelector('#restart').disabled = false
    updateStatus()
  } catch (error) {
    document.querySelector('#status').textContent = ` 分析失败：${error.message}，请刷新重试`
  } finally { if (context) await context.close() }
}
function draw() {
  const w = canvas.clientWidth, h = canvas.clientHeight, ratio = Math.min(devicePixelRatio || 1, 2)
  if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
    canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio)
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const time = audio.currentTime, start = time - 4, end = time + 4
  drawnStart = start
  const subset = ready ? frames.slice(Math.max(0, Math.floor(start * diagnostics.rate / diagnostics.hop)), Math.ceil(end * diagnostics.rate / diagnostics.hop)) : []
  const max = Math.max(.08, ...subset.map(f => f.level)) * 1.15
  const y = value => h - 22 - value / max * (h - 36)
  for (const [field, color] of [['level', '#91baf0'], ['flux', '#e9c88d'], ['threshold', '#d78693']]) {
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath()
    subset.forEach((f, i) => { const x = (f.time - start) / 8 * w; if (i) ctx.lineTo(x, y(f[field])); else ctx.moveTo(x, y(f[field])) })
    ctx.stroke()
  }
  cues.filter(cue => cue.time >= start && cue.time <= end).forEach(cue => {
    const x = (cue.time - start) / 8 * w
    ctx.strokeStyle = cue.manual ? '#80dfc4' : '#e9c88d88'; ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, h - 22); ctx.stroke()
  })
  for (const candidate of diagnostics.candidates || []) {
    const accepted = cues.some(c => !c.manual && c.time === candidate.time)
    if (candidate.peakTime < start || candidate.peakTime > end) continue
    const x = (candidate.peakTime - start) / 8 * w, cy = y(candidate.level)
    ctx.strokeStyle = accepted ? '#e9c88d' : '#738095'
    ctx.beginPath()
    if (accepted) ctx.arc(x, cy, 4, 0, Math.PI * 2)
    else { ctx.moveTo(x - 2, cy - 2); ctx.lineTo(x + 2, cy + 2); ctx.moveTo(x + 2, cy - 2); ctx.lineTo(x - 2, cy + 2) }
    ctx.stroke()
  }
  ctx.strokeStyle = '#ecf0f6'; ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke()
  ctx.fillStyle = '#9ba7b7'; ctx.font = '10px monospace'
  ctx.fillText(`${Math.max(0, start).toFixed(1)}s`, 8, h - 5)
  ctx.fillText(`${time.toFixed(2)}s`, w / 2 + 5, 12)
  ctx.fillText(`${end.toFixed(1)}s`, w - 50, h - 5)
  if (ready) {
    const current = frames[Math.min(frames.length - 1, Math.floor(time * diagnostics.rate / diagnostics.hop))]
    document.querySelector('#flux').textContent = current.flux.toFixed(5)
    document.querySelector('#threshold').textContent = current.threshold.toFixed(5)
    if (audio.paused || audio.seeking || document.hidden) align()
    else {
      if (previous === null || time < previous || time - previous > .4) align()
      while (cursor < cues.length && cues[cursor].time <= time) {
        const cue = cues[cursor++]
        if (time - cue.time < .12) {
          flashUntil = performance.now() + 160
          document.querySelector('#event').textContent = `重音触发 · ${cue.time.toFixed(3)} 秒`
          document.querySelector('#last').textContent = `${cue.time.toFixed(3)}s / ${cue.strength.toFixed(2)}`
        }
      }
      previous = time
    }
  }
  stage.classList.toggle('hit', performance.now() < flashUntil)
  requestAnimationFrame(draw)
}
load(); requestAnimationFrame(draw)
