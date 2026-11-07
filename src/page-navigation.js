import { getMusicManager } from './music-manager.js'
import { mountMusicPlayer } from './music-player.js'
import { pageForPath } from './page-registry.js'
import { setPageCovered } from './page-lifecycle.js'
import { isPlainNavigation } from './page-actions.js'

const managedPath = path => Boolean(pageForPath(path))

function pageKey(target) {
  const url = new URL(target, location.origin)
  return (url.pathname.replace(/\/+$/, '') || '/') + url.search + url.hash
}

// Keep the owning document alive while isolated standalone renderers change.
export function installPageNavigation() {
  if (window.__celestianMusicNavigation) return window.__celestianMusicNavigation
  let parentNavigation
  try { if (window.parent !== window) parentNavigation = window.parent.__celestianMusicNavigation } catch { /* Cross-origin embedding. */ }
  const manager = getMusicManager()
  const player = parentNavigation ? window.parent.__celestianVinylPlayer : mountMusicPlayer(manager)
  const owner = crypto.randomUUID()
  const originalPath = location.pathname
  const reactHost = Boolean(document.getElementById('root'))
  const standalonePath = path => pageForPath(path)?.kind === 'standalone'
  let frame, baseUrl, baseTitle, baseTrack, overflow, previousFocus, inertElements = []
  const restore = () => {
    frame?.remove()
    frame = null
    for (const [element, wasInert] of inertElements) element.inert = wasInert
    inertElements = []
    document.body.style.overflow = overflow
    document.title = baseTitle
    manager.select(baseTrack)
    manager.setPage(new URL(baseUrl, location.origin).pathname)
    setPageCovered(false)
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
  }
  const show = (target, originUrl = location.pathname + location.search + location.hash) => {
    player?.close()
    const frameUrl = new URL(target, location.origin)
    const entry = pageForPath(frameUrl.pathname)
    if (entry?.embedded) frameUrl.searchParams.set('embedded', '1')
    if (!frame) {
      previousFocus = document.activeElement
      setPageCovered(true)
      baseUrl = originUrl
      baseTitle = document.title
      baseTrack = manager.controller.target
      overflow = document.body.style.overflow
      inertElements = [...document.body.children]
        .filter(element => element.id !== 'celestian-dev-navigation' && !element.hasAttribute('data-music-manager') && !element.hasAttribute('data-music-player'))
        .map(element => [element, element.inert])
      for (const [element] of inertElements) element.inert = true
      document.body.style.overflow = 'hidden'
      frame = document.createElement('iframe')
      frame.id = 'music-page-frame'
      frame.title = entry?.title || '无光的伊甸园 · 页面'
      frame.allow = 'autoplay'
      frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483645;background:#101015'
      frame.addEventListener('load', () => {
        try {
          document.title = frame.contentDocument.title || baseTitle
          frame.contentDocument.addEventListener('pointerdown', () => player?.close())
        } catch { /* Keep the existing title. */ }
      })
      frame.src = frameUrl.href
      document.body.append(frame)
    } else frame.contentWindow.location.replace(frameUrl.href)
    frame.focus()
  }
  const navigation = parentNavigation || {
    close() { if (frame) history.back() },
    syncFrameUrl(target, source) {
      if (!frame || source !== frame.contentWindow) return
      const url = new URL(target, location.origin)
      if (url.origin !== location.origin || !managedPath(url.pathname)) return
      const relative = url.pathname + url.search + url.hash
      history.replaceState({ ...history.state, musicPage: { url: relative, base: baseUrl, owner } }, '', relative)
    },
    navigate(target) {
      const url = new URL(target, location.origin)
      if (url.origin !== location.origin || !managedPath(url.pathname)) return false
      const relative = url.pathname + url.search + url.hash
      if (frame && pageKey(relative) === pageKey(baseUrl)) {
        history.pushState({ ...history.state, musicPage: null }, '', relative)
        restore()
        return true
      }
      show(relative)
      history.pushState({ ...history.state, musicPage: { url: relative, base: baseUrl, owner } }, '', relative)
      return true
    },
  }
  window.__celestianMusicNavigation = navigation
  if (!parentNavigation) window.addEventListener('popstate', event => {
    if (event.state?.musicPage) {
      event.stopImmediatePropagation()
      // After a manual refresh, earlier entries belong to another document.
      if (event.state.musicPage.owner !== owner) {
        location.reload()
        return
      }
      show(event.state.musicPage.url, event.state.musicPage.base)
    } else {
      if (frame) {
        restore()
        manager.setPage(location.pathname)
      }
      if ((!reactHost && location.pathname !== originalPath) || (reactHost && standalonePath(location.pathname))) {
        event.stopImmediatePropagation()
        location.reload()
      }
    }
  }, true)
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]')
    if (!isPlainNavigation(event, link)) return
    const url = new URL(link.href)
    if (url.origin !== location.origin || !managedPath(url.pathname)) return
    if (url.pathname === location.pathname && url.search === location.search) return
    if (navigation.navigate(url.href)) event.preventDefault()
  })
  if (!parentNavigation) window.addEventListener('message', event => {
    if (!frame || event.origin !== location.origin || event.source !== frame.contentWindow) return
    if (event.data?.type === 'profile:close') navigation.close()
    if (event.data?.type === 'profile:selection' && typeof event.data.id === 'string') {
      const url = new URL(location.href)
      url.searchParams.set('id', event.data.id)
      navigation.syncFrameUrl(url.href, event.source)
    }
  })
  document.addEventListener('click', manager.retry)
  document.addEventListener('keydown', manager.retry)
  if (pageForPath(location.pathname)) manager.setPage(location.pathname)
  return navigation
}

export function openPage(target) {
  return installPageNavigation().navigate(target)
}
