import { startPageLoop } from '../../page-lifecycle.js'
import { useRef, useEffect } from 'react'

export default function GalaxyStars({ reducedMotion }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let width = 0
    let height = 0
    // Stable placement keeps the sky from reshuffling on resize.
    let seed = 7321
    const random = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    // A low-resolution, layered dust cloud adds depth without a tiled texture.
    const dust = document.createElement('canvas')
    dust.width = 480
    dust.height = 300
    const dustContext = dust.getContext('2d')
    const pixels = dustContext.createImageData(dust.width, dust.height)
    const hash = (x, y) => {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
      return n - Math.floor(n)
    }
    const noise = (x, y) => {
      const ix = Math.floor(x), iy = Math.floor(y)
      const fx = x - ix, fy = y - iy
      const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
      return (hash(ix, iy) * (1 - u) + hash(ix + 1, iy) * u) * (1 - v)
        + (hash(ix, iy + 1) * (1 - u) + hash(ix + 1, iy + 1) * u) * v
    }
    for (let y = 0; y < dust.height; y++) {
      for (let x = 0; x < dust.width; x++) {
        const nx = x / dust.width, ny = y / dust.height
        let cloud = 0, weight = .55
        for (let octave = 0; octave < 5; octave++) {
          const frequency = 5 * 2 ** octave
          cloud += noise(nx * frequency, ny * frequency) * weight
          weight *= .5
        }
        const distance = (ny - (.96 - nx * .85) + (noise(nx * 5, ny * 5) - .5) * .3) / .18
        const band = Math.exp(-(distance ** 2))
        const density = Math.max(0, cloud - .26) * band
        const index = (y * dust.width + x) * 4
        pixels.data[index] = 83 + cloud * 35
        pixels.data[index + 1] = 104 + cloud * 22
        pixels.data[index + 2] = 138
        pixels.data[index + 3] = density * 100
      }
    }
    dustContext.putImageData(pixels, 0, 0)
    const stars = Array.from({ length: 1050 }, (_, i) => {
      const x = random()
      return {
        x, y: i > 280 ? .96 - x * .85 + (random() + random() - 1) * .25 : random(),
        radius: i < 12 ? .8 + random() * .4 : .15 + random() * .55,
        alpha: .08 + random() * .38, phase: random() * Math.PI * 2,
        color: i % 4 === 0 ? '235,210,161' : '168,206,246',
      }
    })
    const draw = (time = 0) => {
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(dust, 0, 0, width, height)
      stars.forEach((star, i) => {
        const x = star.x * width
        const y = star.y * height
        const alpha = star.alpha * (reducedMotion ? 1 : .8 + .2 * Math.sin(time * .0004 + star.phase))
        if (i < 12) {
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 6)
          glow.addColorStop(0, `rgba(${star.color},${alpha * .6})`)
          glow.addColorStop(1, `rgba(${star.color},0)`)
          ctx.fillStyle = glow
          ctx.fillRect(x - 6, y - 6, 12, 12)
        }
        ctx.beginPath()
        ctx.fillStyle = `rgba(${star.color},${alpha})`
        ctx.arc(x, y, star.radius, 0, Math.PI * 2)
        ctx.fill()
      })
    }
    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * ratio
      canvas.height = height * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      draw()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    const stopLoop = reducedMotion ? () => {} : startPageLoop(draw)
    return () => {
      observer.disconnect()
      stopLoop()
    }
  }, [reducedMotion])
  return <canvas ref={canvasRef} className="galaxy-starfield" aria-hidden="true" />
}
