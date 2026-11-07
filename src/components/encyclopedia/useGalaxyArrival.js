import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function useGalaxyArrival(onReady) {
  const location = useLocation()
  const navigate = useNavigate()
  const [animated] = useState(() => Boolean(location.state?.galaxyArrival)
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [phase, setPhase] = useState(animated ? 'black' : null)
  const starRevealRef = useRef(animated ? Infinity : null)
  const notifyReady = useEffectEvent(() => onReady?.())

  useEffect(() => {
    if (!location.state?.galaxyArrival) return
    // Consume the arrival flag so reload and browser Back do not replay it.
    const state = { ...location.state }
    delete state.galaxyArrival
    navigate(location.pathname + location.search + location.hash, { replace: true, state })
  }, [location, navigate])

  useEffect(() => {
    let firstFrame, paintedFrame
    let sky, reveal, done
    let cancelled = false
    const finish = () => {
      starRevealRef.current = null
      setPhase(null)
      document.getElementById('encyclopedia-app')?.focus({ preventScroll: true })
    }
    // The persistent cover stays up while the destination mounts and its
    // canvases draw. Two RAFs guarantee a black destination frame is painted
    // before releasing the cover; navigation scheduling cannot expose home.
    firstFrame = requestAnimationFrame(() => {
      paintedFrame = requestAnimationFrame(() => {
        if (cancelled) return
        notifyReady()
        if (!animated) return
        starRevealRef.current = performance.now()
        setPhase('stars')
        sky = window.setTimeout(() => setPhase('sky'), 1400)
        reveal = window.setTimeout(() => setPhase('revealing'), 2200)
        // Seven nodes: 6 × 100ms stagger + 720ms growth, then a short buffer.
        done = window.setTimeout(finish, 3620)
      })
    })
    const escape = event => {
      if (event.key !== 'Escape') return
      cancelled = true
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(paintedFrame)
      clearTimeout(sky)
      clearTimeout(reveal)
      clearTimeout(done)
      notifyReady()
      finish()
    }
    if (animated) window.addEventListener('keydown', escape)
    return () => {
      cancelled = true
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(paintedFrame)
      clearTimeout(sky)
      clearTimeout(reveal)
      clearTimeout(done)
      window.removeEventListener('keydown', escape)
    }
  }, [animated])

  return { phase, starRevealRef }
}
