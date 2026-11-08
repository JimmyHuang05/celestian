import { useEffect, useRef } from 'react'
import { galaxyDensity } from './galaxyDensity.js'
import './galaxy-canvas.css'

// One deterministic still frame, redrawn only when its container changes size.
export default function StaticStarfield() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d')
    if (!ctx) return
    let seed = 27421
    const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646 }
    const stars = Array.from({ length: 450 }, () => {
      let x, y
      do { x = random(); y = random() } while (random() > galaxyDensity(x, y))
      const depth = random(), layer = depth > .85 ? 3 : depth > .4 ? 2 : 1
      const size = layer === 3 ? random() * .8 + .6 : layer === 2 ? random() * .5 + .3 : random() * .3 + .1
      return { x, y, size, alpha: .5 + Math.sin(random() * Math.PI * 2) * .5, rgb: random() > .65 ? '212,181,142' : '255,255,255' }
    })
    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const ratio = Math.min(devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      for (const s of stars) {
        const x = s.x * width, y = s.y * height
        if (s.alpha > .3 && s.size > .4) {
          const gradient = ctx.createRadialGradient(x, y, s.size * .5, x, y, s.size * 4)
          gradient.addColorStop(0, `rgba(${s.rgb},${s.alpha * .4})`); gradient.addColorStop(1, `rgba(${s.rgb},0)`)
          ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(x, y, s.size * 4, 0, Math.PI * 2); ctx.fill()
        }
        ctx.fillStyle = `rgba(${s.rgb},${s.alpha})`; ctx.beginPath(); ctx.arc(x, y, s.size, 0, Math.PI * 2); ctx.fill()
      }
    }
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])
  return <canvas ref={ref} data-static-starfield className="celestian-galaxy-dust" aria-hidden="true" />
}
