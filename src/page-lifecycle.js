// Each document owns activity; covering a parent must not pause its child frame
// or the persistent music player. Renderers subscribe instead of polling.
let covered = false
let departed = false
const listeners = new Set()
const motion = matchMedia('(prefers-reduced-motion: reduce)')
export const pageIsActive = () => !covered && !departed && !document.hidden
export const pageMotionAllowed = () => pageIsActive() && !motion.matches
function publish() {
  document.documentElement.dataset.pageActive = String(pageIsActive())
  document.documentElement.dataset.pageMotion = String(pageMotionAllowed())
  for (const listener of listeners) listener(pageIsActive(), motion.matches)
}
export function setPageCovered(value) { covered = Boolean(value); publish() }
export function subscribePageActivity(listener) {
  listeners.add(listener)
  listener(pageIsActive(), motion.matches)
  return () => listeners.delete(listener)
}
export function startPageLoop(draw, { respectReducedMotion = true } = {}) {
  let frame, running = false
  const tick = time => { if (!running) return; draw(time); frame = requestAnimationFrame(tick) }
  const unsubscribe = subscribePageActivity((active, reduced) => {
    cancelAnimationFrame(frame)
    running = active && !(respectReducedMotion && reduced)
    if (running) frame = requestAnimationFrame(tick)
    else if (active) draw(performance.now())
  })
  return () => { running = false; cancelAnimationFrame(frame); unsubscribe() }
}
document.addEventListener('visibilitychange', publish)
motion.addEventListener('change', publish)
window.addEventListener('pagehide', () => { departed = true; publish() })
window.addEventListener('pageshow', () => { departed = false; publish() })
const style = document.createElement('style')
style.textContent = ':root[data-page-active="false"] *:not([data-music-player], [data-music-player] *),:root[data-page-active="false"] *:not([data-music-player], [data-music-player] *)::before,:root[data-page-active="false"] *:not([data-music-player], [data-music-player] *)::after{animation-play-state:paused!important}'
document.head.append(style)
publish()
