import { pageForPath } from './page-registry.js'
import ASSETS_BASE from './constants.js'

// Add tracks here, not transition pairs. Volumes preserve each page's mix.
export const MUSIC_FADE_MS = 2500
export const musicLibrary = {
  home: { title: '谁曾梦见伊甸', titleEn: 'Who Once Dreamed of Eden', subtitle: '无光的伊甸园 · 主题曲', cover: '/audio/covers/v1/home.webp', sources: [[`${ASSETS_BASE}/audio/bgm/home.mp3`, 'audio/mpeg']], volume: .25, autoplay: true, elementId: 'bg-music' },
  encyclopedia: { title: '星海拾遗', titleEn: 'Gleanings from the Sea of Stars', subtitle: '百科全书 · 印象曲', cover: '/audio/covers/v1/encyclopedia.webp', sources: [['/audio/bgm/encyclopedia.mp3', 'audio/mpeg']], volume: .25, autoplay: true, elementId: 'encyclopedia-bgm' },
  functions: { title: '高塔犹有回声', titleEn: 'An Echo Yet Within the Tower', subtitle: '巴别塔工业 · 印象曲', cover: '/audio/covers/v1/functions.webp', sources: [[`${ASSETS_BASE}/audio/bgm/functions.mp3`, 'audio/mpeg']], volume: .25, autoplay: true },
  'eternal-astrology': {
    title: '群星缄默以后', titleEn: 'After the Stars Fell Silent', subtitle: '永恒不灭的占星会 · 印象曲',
    cover: '/audio/covers/v1/eternal-astrology.webp',
    sources: [['/assets/astrology-audio-v1/stone-hall.opus', 'audio/ogg; codecs=opus'], ['/assets/astrology-audio-v1/stone-hall.m4a', 'audio/mp4']],
    volume: .25, autoplay: true,
  },
  'unconventional-affairs': { title: '一切皆如常', titleEn: 'All Is as It Should Be', subtitle: '非常规事务署 · 印象曲', cover: '/audio/covers/v1/unconventional-affairs.webp', sources: [['/audio/bgm/the-portrait-smiles.mp3', 'audio/mpeg']], volume: .25, autoplay: true },
  'imperial-knights': { title: '旌旗之下，誓言犹存', titleEn: 'Beneath the Banners, Our Vows Endure', subtitle: '五军同盟 · 印象曲', cover: '/audio/covers/v1/imperial-knights.webp', sources: [['/audio/bgm/stille-majestaet.mp3', 'audio/mpeg']], volume: .25, autoplay: true },
}

export function musicForPath(pathname, currentTrack = null) {
  const music = pageForPath(pathname)?.music
  return music === 'inherit' ? currentTrack || 'encyclopedia' : music || null
}
