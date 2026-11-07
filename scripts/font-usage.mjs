import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const entries = ['index.html', 'character-profile.html', 'faction-profile.html', 'unconventional-affairs.html', 'imperial-knights.html']

export function productionSources() {
  const found = new Map()
  const visit = relative => {
    const file = path.resolve(root, relative)
    if (!file.startsWith(root + path.sep) || found.has(file) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return
    if (!/\.(?:html|jsx?|css)$/.test(file)) return
    const source = fs.readFileSync(file, 'utf8')
    found.set(file, source)
    const refs = [
      ...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g),
      ...source.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g),
      ...(file.endsWith('.html') ? source.matchAll(/(?:src|href)=["']([^"']+\.(?:js|jsx|css))(?:\?[^"']*)?["']/g) : []),
    ]
    for (const [, ref] of refs) {
      if (!ref.startsWith('.') && !ref.startsWith('/')) continue
      const dependency = ref.startsWith('/') ? path.join(root, ref.slice(1)) : path.resolve(path.dirname(file), ref)
      for (const candidate of [dependency, dependency + '.js', dependency + '.jsx', path.join(dependency, 'index.js')]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { visit(path.relative(root, candidate)); break }
      }
    }
  }
  entries.forEach(visit)
  return found
}
