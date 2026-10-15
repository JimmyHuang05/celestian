import { useEffect, useRef } from 'react'
import { galaxyDensity } from './galaxyDensity.js'
import './galaxy-canvas.css'

// Transparent, stationary star dust; no continuous light-colored cloud overlay.
export default function GalaxyVeil() {
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
    const draw = () => {
      const width = canvas.clientWidth, height = canvas.clientHeight
      const ratio = Math.min(devicePixelRatio || 1, 2)
      canvas.width = width * ratio
      canvas.height = height * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.clearRect(0, 0, width, height)
      dust.forEach(star => {
        ctx.fillStyle = `rgba(${star.color},${star.alpha})`
        ctx.beginPath()
        ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2)
        ctx.fill()
      })
    }
    const observer = new ResizeObserver(draw)
    observer.observe(canvas); draw()
    return () => observer.disconnect()
  }, [])
  return <canvas ref={ref} data-galaxy-veil className="celestian-galaxy-dust" aria-hidden="true" />
}
