import { useEffect, useRef } from 'react'
import { galaxyDensity } from './galaxyDensity.js'
import { STAR_REVEAL_DURATION, starArrivalOpacity } from './starArrival.js'
import './galaxy-canvas.css'

// Transparent, stationary star dust; no continuous light-colored cloud overlay.
export default function GalaxyVeil({ revealRef }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let seed = 13871
    const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646 }
    const dust = []
    for (let i = 0; i < 18000; i++) {
      const x = random(), y = random()
      if (random() > galaxyDensity(x, y) * .35) continue
      dust.push({ x, y, radius: .15 + random() * .3, alpha: .1 + random() * .22,
        color: random() > .65 ? '212,181,142' : '199,204,215' })
    }
    const draw = (time = performance.now()) => {
      const width = canvas.clientWidth, height = canvas.clientHeight
      const ratio = Math.min(devicePixelRatio || 1, 2)
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio)
        canvas.height = Math.round(height * ratio)
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.clearRect(0, 0, width, height)
      dust.forEach((star, index) => {
        const alpha = star.alpha * starArrivalOpacity(index + 450, time, revealRef?.current)
        if (alpha <= 0) return
        ctx.fillStyle = `rgba(${star.color},${alpha})`
        ctx.beginPath()
        ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2)
        ctx.fill()
      })
    }
    const observer = new ResizeObserver(() => draw())
    observer.observe(canvas); draw()
    let frame
    const animate = time => {
      draw(time)
      if (revealRef?.current != null && time < revealRef.current + STAR_REVEAL_DURATION) {
        frame = requestAnimationFrame(animate)
      }
    }
    if (revealRef?.current != null) frame = requestAnimationFrame(animate)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [revealRef])
  return <canvas ref={ref} data-galaxy-veil className="celestian-galaxy-dust" aria-hidden="true" />
}
