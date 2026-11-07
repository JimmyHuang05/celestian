import { useEffectEvent, useLayoutEffect, useRef } from 'react'
import './encyclopedia-transition.css'

// Expand the clicked card itself, preserving its current hover appearance.
export default function EncyclopediaTransition({ card, onCovered }) {
  const surfaceRef = useRef(null)
  const cardRef = useRef(null)
  const notifyCovered = useEffectEvent(onCovered)

  useLayoutEffect(() => {
    const surface = surfaceRef.current
    const host = cardRef.current
    const rect = card.getBoundingClientRect()
    const clone = card.cloneNode(true)
    const originals = [card, ...card.querySelectorAll('*')]
    const copies = [clone, ...clone.querySelectorAll('*')]
    originals.forEach((original, index) => {
      const style = getComputedStyle(original)
      for (const property of ['opacity', 'filter', 'transform', 'color', 'background-color', 'text-shadow', '-webkit-text-stroke-width', '-webkit-text-stroke-color']) {
        copies[index].style.setProperty(property, style.getPropertyValue(property))
      }
      copies[index].style.transition = 'none'
      copies[index].style.animation = 'none'
      // The copied SVG gradients need unique IDs while both cards exist.
      if (original.id) copies[index].id = `arrival-${original.id}`
      for (const attribute of ['fill', 'stroke']) {
        const value = original.getAttribute(attribute)
        if (value?.startsWith('url(#')) copies[index].setAttribute(attribute, value.replace('url(#', 'url(#arrival-'))
      }
    })
    clone.removeAttribute('href')
    clone.setAttribute('tabindex', '-1')
    Object.assign(clone.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%',
      transform: 'none', margin: '0', filter: 'none',
    })
    host.append(clone)
    Object.assign(host.style, {
      left: `${rect.left}px`, top: `${rect.top}px`,
      width: `${rect.width}px`, height: `${rect.height}px`,
    })
    const width = window.innerWidth, height = window.innerHeight
    const scale = Math.max(width / rect.width, height / rect.height) * 1.14
    const dx = width / 2 - rect.left - rect.width / 2
    const dy = height / 2 - rect.top - rect.height / 2
    const startClip = `inset(${rect.top}px ${width - rect.right}px ${height - rect.bottom}px ${rect.left}px round 20px)`
    const options = { duration: 1550, easing: 'cubic-bezier(.42,0,.2,1)', fill: 'forwards' }
    const spread = surface.animate([
      { clipPath: startClip }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
    ], options)
    const enlarge = host.animate([
      { transform: 'translate(0,0) scale(1)', filter: 'brightness(1)', opacity: 1 },
      { transform: `translate(${dx * .65}px,${dy * .65}px) scale(${1 + (scale - 1) * .65})`, filter: 'brightness(.2)', opacity: 1, offset: .65 },
      { transform: `translate(${dx}px,${dy}px) scale(${scale})`, filter: 'brightness(0)', opacity: 0 },
    ], options)
    let complete = false
    const finish = () => {
      if (complete) return
      complete = true
      // Keep a fully opaque, full-viewport cover through the route commit.
      // Commit the end state before cancelling WAAPI, including early exits.
      surface.style.clipPath = 'inset(0px)'
      surface.dataset.covered = 'true'
      host.style.opacity = '0'
      spread.cancel()
      enlarge.cancel()
      notifyCovered()
    }
    spread.finished.then(finish).catch(() => {})
    // A resize cannot leave a partially covered viewport or stale geometry.
    const resize = () => finish()
    const escape = event => { if (event.key === 'Escape') finish() }
    const fallback = window.setTimeout(finish, 1900)
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', escape)
    return () => {
      complete = true
      clearTimeout(fallback)
      spread.cancel()
      enlarge.cancel()
      host.replaceChildren()
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', escape)
    }
  }, [card])

  return <div className="encyclopedia-transition" aria-busy="true" aria-label="正在进入百科全书">
    <div ref={surfaceRef} className="encyclopedia-transition__surface" aria-hidden="true">
      <div ref={cardRef} className="encyclopedia-transition__card eden-home" />
    </div>
  </div>
}
