export const soundIcon = muted => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4Z"/>${muted ? '<path d="m16 9 6 6m0-6-6 6"/>' : '<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'}</svg>`
export function updateSoundButton(button, muted, { enable = '开启声音', disable = '静音' } = {}) {
  button.type = 'button'
  button.innerHTML = soundIcon(muted)
  button.setAttribute('aria-pressed', String(muted))
  button.setAttribute('aria-label', muted ? enable : disable)
  button.title = muted ? enable : disable
}
export function isPlainNavigation(event, link) {
  return !event.defaultPrevented && !event.button && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && link && !link.target && !link.hasAttribute('download')
}
