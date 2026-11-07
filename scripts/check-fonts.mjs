import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { entries, productionSources, root } from './font-usage.mjs'

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/fonts/font-sources.json'), 'utf8'))
const css = fs.readFileSync(path.join(root, 'src/fonts/faces.css'), 'utf8')
const errors = []
const families = new Map()
const points = ranges => new Set(ranges.split(',').filter(Boolean).flatMap(range => {
  const [start, end = start] = range.split('-').map(part => parseInt(part, 16))
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}))
for (const face of manifest.faces) {
  const file = path.join(root, 'public', face.file)
  if (!fs.existsSync(file)) { errors.push(`Missing font: ${face.file}`); continue }
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  if (hash !== face.sha256) errors.push(`Font checksum mismatch: ${face.file}`)
  if (!css.includes(face.file)) errors.push(`Unregistered font: ${face.file}`)
  const coverage = families.get(face.family) || new Set()
  for (const range of face.coverage.split(',')) {
    if (!range) continue
    const [start, end = start] = range.split('-').map(part => parseInt(part, 16))
    for (let p = start; p <= end; p++) coverage.add(p)
  }
  families.set(face.family, coverage)
}

const song = families.get('Noto Serif SC')
const critical = manifest.faces.find(face => face.file === manifest.priority?.critical)
if (!critical || critical.priority !== 'critical') errors.push('Missing shared first-screen font pack')
else {
  if (critical.bytes > 160 * 1024) errors.push('First-screen font exceeds its 160 KiB budget')
  const priorityPoints = new Set(manifest.faces.filter(face => face.priority).flatMap(face => [...points(face.coverage)]))
  for (const face of manifest.faces.filter(face => face.family === 'Noto Serif SC' && !face.priority)) {
    if ([...points(face.coverage)].some(point => priorityPoints.has(point))) errors.push(`Duplicate priority glyph range: ${face.file}`)
  }
}
if (song?.size !== manifest.fullSong.characters) errors.push('Optimized font packs lost source glyph coverage')
if (/font-display:block/.test(css)) errors.push('Text must remain readable while fonts load')
const sources = productionSources()
sources.set(path.join(root, 'public/character-profile/characters.json'), fs.readFileSync(path.join(root, 'public/character-profile/characters.json'), 'utf8'))
sources.set(path.join(root, 'public/faction-profile/factions.json'), fs.readFileSync(path.join(root, 'public/faction-profile/factions.json'), 'utf8'))
let chinese = new Set()
for (const [file, source] of sources) {
  if (file.includes(path.sep + 'fonts' + path.sep)) continue
  const relative = path.relative(root, file)
  if (/@font-face/.test(source)) errors.push(`Page-specific @font-face in ${relative}`)
  if (/https?:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|fontsapi\.zeoseven\.com)/.test(source)) errors.push(`External font request in ${relative}`)
  if (/Noto Serif CJK|Celestian Faction Song|Astrology Page Song|Faction Navigation Song|Imperial Inscription|Archive Serif/.test(source)) errors.push(`Retired font family in ${relative}`)
  const han = [...source.matchAll(/\p{Script=Han}/gu)].map(match => match[0])
  const missing = [...new Set(han.filter(char => !song.has(char.codePointAt(0))))]
  if (missing.length) errors.push(`Missing Chinese glyphs in ${relative}: ${missing.join(' ')}`)
  han.forEach(char => chinese.add(char))
}
for (const entry of entries) {
  const html = fs.readFileSync(path.join(root, entry), 'utf8')
  if (!html.includes('/src/fonts/index.css')) errors.push(`Missing shared font entry: ${entry}`)
  const preload = html.match(/<link[^>]+rel="preload"[^>]+as="font"[^>]*>/g) || []
  if (preload.length !== 1 || !preload[0].includes(manifest.priority?.critical) || !preload[0].includes('crossorigin')) {
    errors.push(`Missing or stale shared font preload: ${entry}`)
  }
}

// The shared Chinese face supports every weight used by headings and running text.
for (const weight of [200, 300, 400, 500, 600, 700, 800, 900]) {
  if (!manifest.faces.some(face => {
    const [min, max = min] = face.weight.split(' ').map(Number)
    return face.family === 'Noto Serif SC' && min <= weight && max >= weight
  })) errors.push(`Missing Chinese font weight: ${weight}`)
}
if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Fonts OK: ${entries.length} page entries, ${manifest.faces.length} verified local shards, ${chinese.size} known Chinese characters covered.`)
  console.log([...families].map(([family, glyphs]) => `${family}: ${glyphs.size} characters`).join('\n'))
}
