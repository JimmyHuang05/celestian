import { useLayoutEffect, useRef } from 'react'
import emblem from '../../assets/encyclopedia-icons/node-emblem-aeons.svg'

// The chart is engraved once at the displayed size. All distances are relative
// to the same radius so the seal, scales and orbital paths stay registered.
function engrave(canvas) {
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (!width || !height) return
  const density = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * density)
  canvas.height = Math.round(height * density)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(density, density)
  let seed = 174113
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const turn = 2 * Math.PI
  for (let i = 0; i < Math.min(850, width * height / 600); i++) {
    const x = random() * width, y = random() * height
    const bright = random()
    ctx.fillStyle = 'rgba(77,95,142,' + (.04 + bright * .22) + ')'
    const r = bright > .982 ? 1.35 : .3 + random() * .55
    ctx.beginPath()
    ctx.arc(x, y, r, 0, turn)
    ctx.fill()
    if (bright > .982) {
      ctx.fillRect(x - 3.5, y - .35, 7, .7)
      ctx.fillRect(x - .35, y - 3.5, .7, 7)
    }
  }

  const radius = Math.min(width * .315, height * .31)
  ctx.translate(width * .52, height * .45)
  ctx.scale(radius, radius)
  ctx.lineWidth = .8 / radius
  function ring(rx, ry, tilt, color, from = 0, to = turn) {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.ellipse(0, 0, rx, ry, tilt, from, to)
    ctx.stroke()
  }
  const gold = '#c9a877'
  ring(1.05, 1.05, 0, '#bb976c66')
  ring(1, 1, 0, '#ad8b517d', -.92, 3.9)
  ring(.77, .77, 0, '#ba995e70')
  ring(1.46, .42, -.48, '#ddc09899')
  ring(1.22, .71, .94, '#41599739')
  for (let i = 0; i < 144; i++) {
    const angle = i * turn / 144
    const major = i % 12 === 0
    const end = major ? 1.095 : 1.035
    ctx.strokeStyle = major ? gold : '#c4b89a70'
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * 1.012, Math.sin(angle) * 1.012)
    ctx.lineTo(Math.cos(angle) * end, Math.sin(angle) * end)
    ctx.stroke()
  }
  for (const angle of [-1.13, .35, 2.55]) {
    const x = Math.cos(angle) * 1.05, y = Math.sin(angle) * 1.05
    ctx.fillStyle = '#ad8b51'
    ctx.beginPath()
    ctx.moveTo(x, y - .038)
    ctx.lineTo(x + .019, y)
    ctx.lineTo(x, y + .038)
    ctx.lineTo(x - .019, y)
    ctx.closePath()
    ctx.fill()
  }
}

export default function AeonFirmament() {
  const canvas = useRef(null)
  useLayoutEffect(() => {
    const el = canvas.current
    const observer = new ResizeObserver(() => engrave(el))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <div className="aeon-paper__firmament" aria-hidden="true">
    <canvas ref={canvas} />
    <i className="aeon-paper__seal" style={{ maskImage: `url("${emblem}")` }} />
  </div>
}
