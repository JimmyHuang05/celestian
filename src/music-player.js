import './music-player.css'

const playPath = 'M8.5 6.5 19 12 8.5 17.5Z'
const pausePath = 'M7.5 6h3v12h-3zM13.5 6h3v12h-3z'
const time = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

// This view belongs to the persistent document. Only the manager owns media and mixing.
export function mountMusicPlayer(manager) {
  if (window.__celestianVinylPlayer) return window.__celestianVinylPlayer
  const events = new AbortController()
  const { signal } = events
  const root = document.createElement('aside')
  root.id = 'celestian-music-player'
  root.className = 'celestian-player'
  root.dataset.musicPlayer = ''
  root.dataset.open = 'false'
  root.dataset.playing = 'false'
  root.setAttribute('aria-label', '全站音乐播放器')
  root.innerHTML = `
    <button class="celestian-player__disc" type="button" aria-label="播放背景音乐" aria-expanded="false" aria-controls="celestian-player-panel">
      <span class="celestian-player__orbit" aria-hidden="true"></span>
      <span class="celestian-player__record" aria-hidden="true"><span class="celestian-player__label">
        <svg viewBox="0 0 24 24" focusable="false"><path d="m12 3 2.1 6.9L21 12l-6.9 2.1L12 21l-2.1-6.9L3 12l6.9-2.1Z"/></svg>
        <img class="celestian-player__cover" alt="" width="192" height="192" decoding="async" draggable="false">
        <span class="celestian-player__spindle"></span>
      </span></span>
    </button>
    <div class="celestian-player__panel" id="celestian-player-panel" inert>
      <div class="celestian-player__content">
        <div class="celestian-player__information">
          <span class="celestian-player__title" aria-live="polite"></span>
          <span class="celestian-player__subtitle"></span>
          <input class="celestian-player__seek" type="range" min="0" max="1000" step="1" value="0" disabled aria-label="歌曲进度">
        </div>
        <button class="celestian-player__play" type="button" aria-label="播放背景音乐"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${playPath}"/></svg></button>
      </div>
    </div>`
  document.body.append(root)
  const disc = root.querySelector('.celestian-player__disc')
  const panel = root.querySelector('.celestian-player__panel')
  const title = root.querySelector('.celestian-player__title')
  const subtitle = root.querySelector('.celestian-player__subtitle')
  const play = root.querySelector('.celestian-player__play')
  const glyph = play.querySelector('path')
  const seek = root.querySelector('.celestian-player__seek')
  const cover = root.querySelector('.celestian-player__cover')
  let hovered = false, pinned = false, closeTimer, currentPage, currentTitle, currentSubtitle, currentGlyph
  let currentCover, coverRevision = 0

  const updateCover = source => {
    if (currentCover === source) return
    currentCover = source
    const revision = ++coverRevision
    cover.classList.remove('is-ready')
    if (!source) { cover.removeAttribute('src'); return }
    // Decode only the selected track's thumbnail; stale requests cannot replace a newer cover.
    const pendingCover = new Image()
    pendingCover.src = source
    pendingCover.decode().then(() => {
      if (signal.aborted || revision !== coverRevision) return
      cover.src = source
      cover.classList.add('is-ready')
    }).catch(() => { /* The engraved star remains visible if artwork is unavailable. */ })
  }

  const setOpen = open => {
    root.dataset.open = String(open)
    panel.inert = !open
    panel.setAttribute('aria-hidden', String(!open))
    disc.setAttribute('aria-expanded', String(open))
  }
  const close = () => { clearTimeout(closeTimer); pinned = false; hovered = false; setOpen(false) }
  const closeLater = () => {
    clearTimeout(closeTimer)
    closeTimer = setTimeout(() => {
      const focus = document.activeElement
      if (!hovered && !pinned && !(root.contains(focus) && focus.matches(':focus-visible'))) setOpen(false)
    }, 400)
  }
  root.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return
    hovered = true; clearTimeout(closeTimer); setOpen(true)
  }, { signal })
  root.addEventListener('pointerleave', () => { hovered = false; closeLater() }, { signal })
  root.addEventListener('focusin', () => { clearTimeout(closeTimer); setOpen(true) }, { signal })
  root.addEventListener('focusout', closeLater, { signal })
  const togglePlayback = () => {
    const state = manager.getSnapshot()
    if (state.trackId) manager.toggle(state.blocked)
  }
  disc.addEventListener('click', event => {
    // Touch has no hover: keep the controls available after toggling playback.
    pinned = event.pointerType === 'touch'
    setOpen(true)
    togglePlayback()
  }, { signal })
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return
    event.preventDefault(); event.stopPropagation(); disc.focus({ preventScroll: true }); close()
  }, { signal })
  // Native page-wide keyboard shortcuts must not also react to player controls.
  root.addEventListener('keyup', event => { if ([' ', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) event.stopPropagation() }, { signal })
  root.addEventListener('keydown', event => { if ([' ', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) event.stopPropagation() }, { signal })
  document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close() }, { signal })
  window.addEventListener('blur', () => { if (document.activeElement?.tagName === 'IFRAME') close() }, { signal })
  play.addEventListener('click', togglePlayback, { signal })
  seek.addEventListener('input', () => manager.seekTo(Number(seek.value) / 1000), { signal })

  const render = () => {
    const state = manager.getSnapshot()
    if (currentPage !== state.pageId) { currentPage = state.pageId; close() }
    root.dataset.page = state.pageId || ''
    root.dataset.playing = String(state.playing)
    root.dataset.pending = String(state.pending)
    updateCover(state.cover || '')
    if (currentTitle !== state.title) {
      currentTitle = state.title
      title.textContent = state.title
      title.title = state.title
    }
    if (currentSubtitle !== state.subtitle) {
      currentSubtitle = state.subtitle
      subtitle.textContent = state.subtitle
      subtitle.title = state.subtitle
    }
    const nextGlyph = state.playing || (state.pending && state.enabled) ? pausePath : playPath
    if (currentGlyph !== nextGlyph) { currentGlyph = nextGlyph; glyph.setAttribute('d', nextGlyph) }
    play.disabled = !state.trackId
    const playbackLabel = state.blocked ? '重试播放背景音乐' : nextGlyph === pausePath ? '暂停背景音乐' : '播放背景音乐'
    play.setAttribute('aria-label', playbackLabel)
    disc.setAttribute('aria-label', playbackLabel)
    disc.title = playbackLabel
    seek.disabled = !state.canSeek
    seek.value = state.canSeek ? Math.round(state.position / state.duration * 1000) : 0
    seek.style.setProperty('--progress', `${Number(seek.value) / 10}%`)
    seek.setAttribute('aria-valuetext', `${time(state.position)} / ${state.canSeek ? time(state.duration) : '尚未载入'}`)
  }
  const unsubscribe = manager.subscribe(render, window)
  const player = { root, close, destroy() {
    clearTimeout(closeTimer); unsubscribe(); events.abort(); root.remove()
    delete window.__celestianVinylPlayer
  } }
  window.__celestianVinylPlayer = player
  setOpen(false); render()
  return player
}

if (import.meta.hot) import.meta.hot.dispose(() => window.__celestianVinylPlayer?.destroy())
