import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { entries, productionSources, root } from './font-usage.mjs'

// A shared first-screen pack, derived from existing catalogs rather than a
// separate copy of page text. Other/new characters retain the complete fallback.
export function fontPriority() {
  const read = file => fs.readFileSync(path.join(root, file), 'utf8')
  const characters = JSON.parse(read('public/character-profile/characters.json'))
  const factions = JSON.parse(read('public/faction-profile/factions.json'))
  const visibleHtml = html => html.replace(/<!--[^]*?-->/g, '')
    .replace(/<(script|style|svg)\b[^]*?<\/\1>/gi, '').replace(/<[^>]*>/g, '')
  const flagNames = [...read('src/imperial-banner-artwork.js').matchAll(/\b(?:name|germanName):\s*'([^']+)'/g)].map(m => m[1])
  const important = [
    ...entries.map(file => visibleHtml(read(file))),
    ...['src/music-library.js', 'src/page-registry.js'].map(read), ...flagNames,
    ...characters.flatMap(item => [item.name, item.title, item.dossierSubtitle]),
    ...factions.flatMap(item => [item.name, item.affiliation, item.subtitle]),
  ].join('\n')
  const han = text => [...text.matchAll(/\p{Script=Han}/gu)].map(m => m[0].codePointAt(0))
  const critical = new Set([
    ...han(important),
    ...Array.from({ length: 95 }, (_, i) => 0x20 + i),
    ...[...flagNames.join('').matchAll(/[^\x00-\x7F]/g)].map(m => m[0].codePointAt(0)),
    ...[...'·—–‘’“”…，。！？、：；（）【】《》「」〈〉〔〕／＋＝％'].map(c => c.codePointAt(0)),
  ])
  const frequency = new Map()
  for (const [file, text] of productionSources()) {
    if (!file.includes(path.sep + 'fonts' + path.sep)) {
      for (const code of han(text)) frequency.set(code, (frequency.get(code) || 0) + 1)
    }
  }
  for (const file of ['public/map/world-240705-base-v2/markers.json', 'public/map/world-240705-base-v2/legacy-region-metadata.json']) {
    for (const code of han(read(file))) frequency.set(code, (frequency.get(code) || 0) + 1)
  }
  for (const code of han(JSON.stringify(characters))) frequency.set(code, (frequency.get(code) || 0) + 1)
  for (const code of han(JSON.stringify(factions))) frequency.set(code, (frequency.get(code) || 0) + 1)
  const content = [...frequency.keys()].filter(code => !critical.has(code))
    .sort((a, b) => frequency.get(b) - frequency.get(a) || a - b)
  return { critical: [...critical].sort((a, b) => a - b), content }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(JSON.stringify(fontPriority()))
}
