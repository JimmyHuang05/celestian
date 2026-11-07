import { subscribePageActivity } from './page-lifecycle.js'

// Let visible artwork paint before optional WebGL code competes for bandwidth/CPU.
// A covered document waits until it becomes visible again.
export function afterArtwork(images, callback) {
  let disposed = false, ready = false, active = false, started = false
  let frame, idle
  const requestIdle = window.requestIdleCallback || (fn => setTimeout(fn, 100))
  const cancelIdle = window.cancelIdleCallback || clearTimeout
  function schedule() {
    cancelAnimationFrame(frame); cancelIdle(idle)
    if (disposed || !ready || !active || started) return
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        idle = requestIdle(() => {
          if (disposed || !active || started) return
          started = true
          callback()
        }, { timeout: 1000 })
      })
    })
  }
  const stopActivity = subscribePageActivity(value => { active = value; schedule() })
  Promise.allSettled([...images].map(image => image.decode())).then(() => { ready = true; schedule() })
  return () => { disposed = true; stopActivity(); cancelAnimationFrame(frame); cancelIdle(idle) }
}
