// Keep the originating document (and its exact audio element) alive while
// displaying the standalone character renderer in an isolated same-origin frame.
let frame
let previousTitle
let previousOverflow

export function openCharacterProfile(target = '/character-profile.html', restore = false) {
  if (frame) return
  const url = new URL(target, location.origin)
  if (url.origin !== location.origin) return
  previousTitle = document.title
  previousOverflow = document.body.style.overflow
  if (!restore) history.pushState({ ...history.state, characterOverlay: true }, '', url.pathname + url.search)
  frame = document.createElement('iframe')
  frame.title = '众生录 · 人物档案'
  frame.allow = 'autoplay'
  frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483646;background:#101827'
  url.searchParams.set('embedded', '1')
  frame.src = url.href
  document.querySelector('#root')?.setAttribute('inert', '')
  document.body.style.overflow = 'hidden'
  document.body.append(frame)
  document.title = frame.title
  frame.focus()
}

export function installProfileNavigation() {
  window.addEventListener('popstate', event => {
    if (history.state?.characterOverlay) {
      event.stopImmediatePropagation()
      if (!frame) openCharacterProfile(location.href, true)
      return
    }
    if (!frame) return
    frame.remove()
    frame = null
    document.querySelector('#root')?.removeAttribute('inert')
    document.body.style.overflow = previousOverflow
    document.title = previousTitle
  }, true)
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    const link = event.target.closest('a[href]')
    if (!link || link.target || link.download) return
    const url = new URL(link.href)
    if (url.origin !== location.origin || url.pathname !== '/character-profile.html') return
    event.preventDefault()
    openCharacterProfile(url.href)
  })
  window.addEventListener('message', event => {
    if (!frame || event.origin !== location.origin || event.source !== frame.contentWindow) return
    if (event.data?.type === 'profile:close') history.back()
    if (event.data?.type === 'profile:selection' && typeof event.data.id === 'string') {
      const url = new URL(location.href)
      url.searchParams.set('id', event.data.id)
      history.replaceState(history.state, '', url.pathname + url.search)
    }
  })
}

export function connectProfileNavigation() {
  if (window.parent === window || !new URLSearchParams(location.search).has('embedded')) return
  document.querySelector('.profile-back')?.addEventListener('click', event => {
    event.preventDefault()
    window.parent.postMessage({ type: 'profile:close' }, location.origin)
  })
}
