import { useRef, useEffect } from 'react'

function Starfield({ mouseX, mouseY, onRipples }) {
  const canvasRef = useRef(null)
  const ripples = useRef([])
  const rippleIdCounter = useRef(0)
  const rippleTimerRef = useRef(null)

  const createRandomRipple = () => {
    const id = rippleIdCounter.current++
    const newRipple = {
      id,
      top: (Math.random() * 80 + 10) + '%',
      left: (Math.random() * 80 + 10) + '%',
      size: (Math.random() * 150 + 150) + 'px',
      delays: [0],
    }
    ripples.current = [...ripples.current, newRipple]
    if (onRipples) onRipples(ripples.current)
    setTimeout(() => {
      ripples.current = ripples.current.filter(r => r.id !== id)
      if (onRipples) onRipples(ripples.current)
    }, 4200)
  }

  const scheduleNextRipple = () => {
    rippleTimerRef.current = setTimeout(() => {
      createRandomRipple()
      scheduleNextRipple()
    }, Math.random() * 3000 + 1500)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    let animationFrameId
    let width = window.innerWidth
    let height = window.innerHeight
    const stars = []
    const meteors = []

    const initCanvasData = () => {
      stars.length = 0
      meteors.length = 0
      for (let i = 0; i < 450; i++) {
        let isMilkyWay = Math.random() < 0.88
        let x, y
        if (isMilkyWay) {
          let t = (Math.random() - 0.5) * 1.6
          let spread = (Math.random() + Math.random() + Math.random() - 1.5) * 0.18
          x = 0.5 + t * 0.866 + spread * 0.5
          y = 0.5 + t * -0.5 + spread * 0.866
        } else {
          x = Math.random()
          y = Math.random()
        }
        let depthRandom = Math.random()
        let layer = depthRandom > 0.85 ? 3 : (depthRandom > 0.4 ? 2 : 1)
        let size = layer === 3 ? (Math.random() * 0.8 + 0.6) : (layer === 2 ? (Math.random() * 0.5 + 0.3) : (Math.random() * 0.3 + 0.1))
        stars.push({
          x, y, size,
          parallaxBaseX: layer * 30,
          parallaxBaseY: layer * 30,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.002 + 0.001,
          rgb: Math.random() > 0.65 ? '212, 181, 142' : '255, 255, 255',
        })
      }
      for (let i = 0; i < 6; i++) {
        meteors.push({
          x: Math.random() * width + width * 0.2,
          y: Math.random() * height * 0.5 - height * 0.5,
          length: Math.random() * 100 + 50,
          speed: Math.random() * 0.8 + 0.5,
          delay: Math.random() * 3000 + 1000,
        })
      }
    }

    const drawCanvas = (currentTime) => {
      try {
        const time = Number.isFinite(currentTime) ? currentTime : performance.now()
        const w = width > 0 ? width : window.innerWidth || 1024
        const h = height > 0 ? height : window.innerHeight || 768
        const mX = Number.isFinite(Number(mouseX)) ? Number(mouseX) : 0
        const mY = Number.isFinite(Number(mouseY)) ? Number(mouseY) : 0

        ctx.clearRect(0, 0, w, h)
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i]
          let px = (s.x * w - mX * s.parallaxBaseX) % w
          if (px < 0) px += w
          let py = (s.y * h - mY * s.parallaxBaseY) % h
          if (py < 0) py += h
          if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(s.size)) continue
          const coreAlpha = 0.5 + Math.sin(time * s.twinkleSpeed + s.phase) * 0.5
          if (coreAlpha > 0.3 && s.size > 0.4) {
            const r1 = Math.max(0.01, s.size * 0.5)
            const r2 = Math.max(0.01, s.size * 4)
            const grad = ctx.createRadialGradient(px, py, r1, px, py, r2)
            grad.addColorStop(0, `rgba(${s.rgb}, ${coreAlpha * 0.4})`)
            grad.addColorStop(1, `rgba(${s.rgb}, 0)`)
            ctx.beginPath()
            ctx.fillStyle = grad
            ctx.arc(px, py, r2, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.beginPath()
          ctx.fillStyle = `rgba(${s.rgb}, ${coreAlpha})`
          ctx.arc(px, py, s.size, 0, Math.PI * 2)
          ctx.fill()
        }
        for (let i = 0; i < meteors.length; i++) {
          const m = meteors[i]
          if (m.delay > 0) { m.delay -= 33; continue }
          m.x -= m.speed * 33
          m.y += m.speed * 33
          if (!Number.isFinite(m.x) || !Number.isFinite(m.y)) {
            m.x = Math.random() * w + w * 0.2
            m.y = Math.random() * h * 0.5 - h * 0.5
          }
          const endX = m.x + m.length * 0.707
          const endY = m.y - m.length * 0.707
          const grad = ctx.createLinearGradient(m.x, m.y, endX, endY)
          grad.addColorStop(0, 'rgba(212, 181, 142, 1)')
          grad.addColorStop(1, 'rgba(212, 181, 142, 0)')
          ctx.beginPath()
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.5
          ctx.lineCap = 'round'
          ctx.moveTo(m.x, m.y)
          ctx.lineTo(endX, endY)
          ctx.stroke()
          if (m.x < -100 || m.y > h + 100) {
            m.x = Math.random() * w + w * 0.2
            m.y = Math.random() * h * 0.5 - h * 0.5
            m.delay = Math.random() * 5000 + 2000
          }
        }
      } catch (e) {
        console.warn('Starfield drawCanvas error', e)
      }
    }

    const loop = (currentTime) => {
      animationFrameId = requestAnimationFrame(loop)
      drawCanvas(currentTime)
    }

    const handleResize = () => {
      try {
        width = window.innerWidth
        height = window.innerHeight
        if (canvasRef.current) {
          canvasRef.current.width = width
          canvasRef.current.height = height
        }
        initCanvasData()
      } catch (e) {
        console.warn('Starfield resize error', e)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    requestAnimationFrame(loop)

    createRandomRipple()
    scheduleNextRipple()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      if (rippleTimerRef.current) clearTimeout(rippleTimerRef.current)
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <canvas ref={canvasRef} className="block absolute inset-0" />
      <div style={{ transform: `translate(${-mouseX * 12}px, ${-mouseY * 12}px)` }}>
        {ripples.current && ripples.current.map(ripple => (
          <div key={'ripple' + ripple.id} className="absolute" style={{ top: ripple.top, left: ripple.left }}>
            {ripple.delays.map((delay, index) => (
              <div key={'point' + index} className="space-ripple-point" style={{ width: ripple.size, height: ripple.size, animationDelay: delay + 's' }} />
            ))}
            {ripple.delays.map((delay, index) => (
              <div key={'core' + index} className="space-ripple-core" style={{ animationDelay: delay + 's' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Starfield
