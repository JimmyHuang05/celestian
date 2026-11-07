import { useEffect, useRef } from 'react'

const RAY_ART = '/images/eden/black-sun-ruins.webp'
const CENTER_ART = '/images/eden/black-sun-framed-cutout.webp'

export default function EdenArtwork() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const imageRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const foreground = imageRef.current
    // Keep the established rays tied to the original borderless artwork.
    const image = new Image()
    let frame = 0
    let settleTimer = 0
    let pixels
    let sourceWidth
    let sourceHeight

    function sample(x, y, channel) {
      const sx = Math.max(0, Math.min(sourceWidth - 1, x))
      const sy = Math.max(0, Math.min(sourceHeight - 1, y))
      const x0 = Math.floor(sx)
      const y0 = Math.floor(sy)
      const x1 = Math.min(x0 + 1, sourceWidth - 1)
      const y1 = Math.min(y0 + 1, sourceHeight - 1)
      const fx = sx - x0
      const fy = sy - y0
      const top = pixels[(y0 * sourceWidth + x0) * 4 + channel] * (1 - fx)
        + pixels[(y0 * sourceWidth + x1) * 4 + channel] * fx
      const bottom = pixels[(y1 * sourceWidth + x0) * 4 + channel] * (1 - fx)
        + pixels[(y1 * sourceWidth + x1) * 4 + channel] * fx
      return top * (1 - fy) + bottom * fy
    }

    function render(preview = false) {
      if (!image.naturalWidth) return
      if (!pixels) {
        const source = document.createElement('canvas')
        sourceWidth = source.width = image.naturalWidth
        sourceHeight = source.height = image.naturalHeight
        const ctx = source.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight)
        pixels = ctx.getImageData(0, 0, sourceWidth, sourceHeight).data
      }

      const width = container.clientWidth
      const height = container.clientHeight
      if (!width || !height) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      // Preserve the mural's fine linework, with a bounded one-shot render.
      const resolution = Math.min(window.devicePixelRatio || 1, (preview ? 800 : 1920) / Math.max(width, height))
      const w = canvas.width = Math.max(1, Math.round(width * resolution))
      const h = canvas.height = Math.max(1, Math.round(height * resolution))
      const bounds = foreground.getBoundingClientRect()
      const sceneBounds = container.getBoundingClientRect()
      const halfWidth = bounds.width / width * w / 2
      const halfHeight = bounds.height / height * h / 2
      if (!halfWidth || !halfHeight) return
      const centerX = (bounds.left - sceneBounds.left + bounds.width / 2) / width * w
      const centerY = (bounds.top - sceneBounds.top + bounds.height / 2) / height * h
      const output = ctx.createImageData(w, h)
      const sourceHalfWidth = (sourceWidth - 1) / 2
      const sourceHalfHeight = (sourceHeight - 1) / 2
      const falloff = Math.min(w, h) * .085
      const night = [18, 22, 33]

      for (let y = 0; y < h; y++) {
        const dy = (y + .5 - centerY) / halfHeight
        for (let x = 0; x < w; x++) {
          const dx = (x + .5 - centerX) / halfWidth
          const radius = Math.max(Math.abs(dx), Math.abs(dy))
          // The inner area is filled separately below, never left as a hole.
          if (radius < .94) continue
          // Begin inside the feathered image, hiding the join beneath it.
          const edgeX = dx / radius * .94
          const edgeY = dy / radius * .94
          const distance = (1 - .94 / radius) * Math.hypot(x + .5 - centerX, y + .5 - centerY)
          const fade = 1 - Math.exp(-distance / falloff)
          // Blend several narrow bands from inside the edge instead of
          // stretching one row of pixels into broad, flat stripes.
          const depth = .006 * fade
          const sx = sourceHalfWidth * (1 + edgeX * (1 - depth))
          const sy = sourceHalfHeight * (1 + edgeY * (1 - depth))
          const innerX = sourceHalfWidth * (1 + edgeX * (1 - depth - .012))
          const innerY = sourceHalfHeight * (1 + edgeY * (1 - depth - .012))
          const deepX = sourceHalfWidth * (1 + edgeX * (1 - depth - .032))
          const deepY = sourceHalfHeight * (1 + edgeY * (1 - depth - .032))
          const softness = .5 + fade * 2.5
          const tangentX = -edgeY * softness
          const tangentY = edgeX * softness
          const targetIndex = (y * w + x) * 4
          for (let channel = 0; channel < 3; channel++) {
            const edge = sample(sx, sy, channel)
            const layers = sample(innerX, innerY, channel) * .65 + sample(deepX, deepY, channel) * .35
            const diffused = (sample(sx + tangentX, sy + tangentY, channel)
              + sample(sx - tangentX, sy - tangentY, channel)) * .5
            const color = edge * (1 - fade * .65) + layers * fade * .4 + diffused * fade * .25
            output.data[targetIndex + channel] = color * (1 - fade * .92) + night[channel] * fade * .92
          }
          output.data[targetIndex + 3] = 255
        }
      }
      ctx.putImageData(output, 0, 0)
      // Fill the hidden center as well so an interim resize cannot expose
      // the page background through the old canvas's transparent rectangle.
      ctx.globalCompositeOperation = 'destination-over'
      ctx.drawImage(image, centerX - halfWidth, centerY - halfHeight, halfWidth * 2, halfHeight * 2)
      ctx.globalCompositeOperation = 'source-over'
    }

    function schedule() {
      cancelAnimationFrame(frame)
      clearTimeout(settleTimer)
      frame = requestAnimationFrame(() => render(true))
      settleTimer = window.setTimeout(() => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => render())
      }, 140)
    }
    image.addEventListener('load', schedule)
    image.src = RAY_ART
    foreground.addEventListener('load', schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(container)
    observer.observe(foreground)
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(settleTimer)
      observer.disconnect()
      image.removeEventListener('load', schedule)
      foreground.removeEventListener('load', schedule)
    }
  }, [])

  return <span ref={containerRef} className="eden-opening__scene">
    <canvas ref={canvasRef} className="eden-opening__rays" aria-hidden="true" />
    <img ref={imageRef} className="eden-opening__art eden-opening__art--framed" src={CENTER_ART} width="1672" height="941" alt="金色纹饰环绕黑日与凋零的圣树" fetchPriority="high" />
  </span>
}
