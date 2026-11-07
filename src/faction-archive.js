import './faction-archive.css'
import './page-actions.css'
import { mountProfileGalaxy } from './profile-galaxy.jsx'
import { richText } from './profile-content.js'
import { connectProfileNavigation } from './profile-navigation.js'
import { getMusicManager } from './music-manager.js'
import { musicLibrary } from './music-library.js'

connectProfileNavigation()
const destroySky = mountProfileGalaxy(document.querySelector('#faction-sky'))
const lifecycle = new AbortController()
const { signal } = lifecycle
const manager = getMusicManager()
const list = document.querySelector('#faction-list')
const search = document.querySelector('#faction-search')
const notice = document.querySelector('#archive-notice')
const content = document.querySelector('#faction-content')
const emblem = document.querySelector('#faction-emblem')
const bannerGroup = document.createElement('div')
bannerGroup.className = 'faction-banner-group'
bannerGroup.hidden = true
document.querySelector('.faction-identity').append(bannerGroup)
const story = document.querySelector('#faction-story')
const directory = document.querySelector('#faction-directory')
const dossier = document.querySelector('.faction-dossier')
const details = document.querySelector('.faction-details')
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
function updateReadingEdges() {
  details.classList.toggle('has-content-above', dossier.scrollTop > 8)
  details.classList.toggle('has-content-below', dossier.scrollTop + dossier.clientHeight < dossier.scrollHeight - 8)
}
function openDirectory() {
  search.value = ''
  renderList()
  directory.showModal()
  search.focus()
}
let entries = [], selected = null, loadController

function safeImage(value) {
  if (typeof value !== 'string' || !value) return ''
  try {
    const url = new URL(value, location.origin)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch { return '' }
}
function element(tag, text, className) {
  const node = document.createElement(tag)
  if (text) node.textContent = text
  if (className) node.className = className
  return node
}
function renderList() {
  const focusedId = list.contains(document.activeElement) ? document.activeElement.dataset.id : null
  const query = search.value.trim().toLocaleLowerCase()
  const filtered = entries.filter(entry => `${entry.name} ${entry.affiliation || ''}`.toLocaleLowerCase().includes(query))
  list.replaceChildren()
  for (const entry of filtered) {
    const button = element('button', '', 'faction-list__item')
    button.type = 'button'
    button.dataset.id = entry.id
    button.setAttribute('aria-current', String(entry.id === selected?.id))
    button.append(element('span', String(entries.indexOf(entry) + 1).padStart(2, '0'), 'faction-list__number'),
      element('strong', entry.name), element('small', entry.affiliation || '势力档案'))
    button.addEventListener('click', () => { select(entry.id, true); directory.close() }, { signal })
    list.append(button)
  }
  if (!filtered.length) list.append(element('p', '没有找到匹配的势力。', 'archive-empty'))
  document.querySelector('#faction-count').textContent = `${filtered.length} / ${entries.length}`
  if (focusedId) [...list.children].find(button => button.dataset.id === focusedId)?.focus({ preventScroll: true })
}
function renderBlocks(blocks) {
  story.replaceChildren()
  const facts = document.querySelector('#faction-facts')
  facts.replaceChildren()
  for (const block of Array.isArray(blocks) ? blocks : []) {
    if (!block || typeof block !== 'object') continue
    if (block.type === 'key-value' && block.key) {
      const row = element('div')
      const value = element('dd'); value.append(richText(block.value))
      row.append(element('dt', block.key), value); facts.append(row)
    } else if (['paragraph', 'quote', 'heading'].includes(block.type) && block.content) {
      const node = element(block.type === 'heading' ? 'h3' : block.type === 'quote' ? 'blockquote' : 'p')
      node.append(richText(block.content))
      if (block.type === 'quote' && block.author) node.append(element('cite', block.author))
      story.append(node)
    } else if (block.type === 'image' && safeImage(block.url)) {
      const figure = element('figure')
      const image = element('img'); image.src = safeImage(block.url)
      image.alt = block.caption || ''; image.loading = 'lazy'; image.decoding = 'async'
      image.addEventListener('error', () => { image.hidden = true }, { once: true })
      image.addEventListener('load', updateReadingEdges, { once: true })
      figure.append(image)
      if (block.caption) figure.append(element('figcaption', block.caption))
      story.append(figure)
    }
  }
  if (!story.children.length) story.append(element('p', '这份档案，尚待续写。', 'archive-empty'))
}
function select(id, updateUrl = false) {
  const entry = entries.find(item => item.id === id)
  if (!entry) {
    selected = null; content.hidden = true
    notice.textContent = '未找到这份势力档案，请从目录中选择。'; notice.hidden = false
    const choose = element('button', '打开势力目录')
    choose.type = 'button'; choose.addEventListener('click', openDirectory, { signal }); notice.append(choose)
    renderList(); return
  }
  const changed = selected?.id !== entry.id
  selected = entry; notice.hidden = true; content.hidden = false
  document.title = `${entry.name} · 势力档案`
  document.querySelector('#faction-name').textContent = entry.name
  document.querySelector('#faction-affiliation').textContent = entry.affiliation || '势力档案'
  document.querySelector('#faction-subtitle').textContent = entry.subtitle || ''
  document.querySelector('#faction-index').textContent = `${String(entries.indexOf(entry) + 1).padStart(2, '0')} / ${String(entries.length).padStart(2, '0')}`
  emblem.hidden = !safeImage(entry.emblem)
  if (!emblem.hidden) { emblem.src = safeImage(entry.emblem); emblem.alt = entry.emblemAlt || `${entry.name}纹章` }
  else emblem.removeAttribute('src')
  document.querySelector('.faction-seal').classList.toggle('is-empty', emblem.hidden)
  document.querySelector('.faction-seal').classList.toggle('is-banner', entry.emblemLayout === 'banner' && !emblem.hidden)
  bannerGroup.replaceChildren()
  const banners = Array.isArray(entry.banners) ? entry.banners.filter(banner => banner && safeImage(banner.src)) : []
  bannerGroup.hidden = banners.length !== 5
  document.querySelector('.faction-seal').hidden = !bannerGroup.hidden
  if (!bannerGroup.hidden) {
    for (const banner of banners) {
      const image = element('img')
      image.src = safeImage(banner.src)
      image.alt = banner.alt || entry.name
      image.title = image.alt
      image.decoding = 'async'
      image.addEventListener('error', () => { image.hidden = true }, { once: true })
      bannerGroup.append(image)
    }
  }
  renderBlocks(entry.blocks)
  dossier.scrollTop = 0
  requestAnimationFrame(updateReadingEdges)
  if (changed && updateUrl && !reducedMotion.matches) {
    for (const node of [bannerGroup.hidden ? emblem : bannerGroup, dossier]) {
      node.getAnimations().forEach(animation => animation.cancel())
      node.animate([{ opacity: .15 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' })
    }
  }
  for (const [buttonId, step] of [['faction-prev', -1], ['faction-next', 1]]) {
    const button = document.getElementById(buttonId)
    const neighbor = entries[(entries.indexOf(entry) + step + entries.length) % entries.length]
    button.title = (step < 0 ? '上一个势力：' : '下一个势力：') + neighbor.name
    button.disabled = entries.length < 2
  }
  manager.setPage('/faction-profile.html')
  manager.select(musicLibrary[entry.music] ? entry.music : 'encyclopedia')
  renderList()
  if (updateUrl) {
    const url = new URL(location.href); url.searchParams.set('id', entry.id)
    history.replaceState(history.state, '', url)
    if (window.parent !== window) window.parent.postMessage({ type: 'profile:selection', id: entry.id }, location.origin)
  }
}
async function load() {
  loadController?.abort(); loadController = new AbortController()
  const controller = loadController
  const timer = setTimeout(() => controller.abort(), 10000)
  content.hidden = true
  notice.hidden = false; notice.textContent = '正在打开势力档案…'
  try {
    const response = await fetch('/faction-profile/factions.json', { signal: controller.signal })
    if (!response.ok) throw new Error('Archive unavailable')
    const data = await response.json()
    if (!Array.isArray(data)) throw new Error('Invalid archive')
    const ids = new Set()
    entries = data.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string' && !ids.has(item.id) && ids.add(item.id))
    if (!entries.length) throw new Error('Empty archive')
    select(new URLSearchParams(location.search).get('id') || document.body.dataset.faction || entries[0].id)
  } catch {
    if (signal.aborted) return
    notice.textContent = '档案暂时无法载入。'
    const retry = element('button', '重新加载'); retry.type = 'button'; retry.addEventListener('click', load, { once: true })
    notice.append(retry)
  } finally { clearTimeout(timer) }
}
emblem.addEventListener('error', () => { emblem.hidden = true; document.querySelector('.faction-seal').classList.add('is-empty') }, { signal })
search.addEventListener('input', renderList, { signal })
dossier.addEventListener('scroll', updateReadingEdges, { signal, passive: true })
window.addEventListener('resize', updateReadingEdges, { signal })
document.fonts.ready.then(updateReadingEdges)
document.querySelector('#directory-open').addEventListener('click', openDirectory, { signal })
document.querySelector('#directory-close').addEventListener('click', () => directory.close(), { signal })
directory.addEventListener('click', event => {
  if (event.target !== directory) return
  const bounds = directory.getBoundingClientRect()
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) directory.close()
}, { signal })
window.addEventListener('popstate', () => select(new URLSearchParams(location.search).get('id') || document.body.dataset.faction || entries[0]?.id), { signal })
for (const [id, step] of [['faction-prev', -1], ['faction-next', 1]]) {
  document.getElementById(id).addEventListener('click', () => {
    if (selected) select(entries[(entries.indexOf(selected) + step + entries.length) % entries.length].id, true)
  }, { signal })
}
load()
if (import.meta.hot) import.meta.hot.dispose(() => { lifecycle.abort(); loadController?.abort(); destroySky() })
