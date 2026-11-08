import { mkdir, writeFile } from 'node:fs/promises'
import emblems from '../src/components/encyclopedia/node-emblems.js'

// Keep every path, ID and animation group in its original order. Only remove
// inter-element whitespace; the approved artwork remains the source of truth.
const directory = new URL('../src/assets/encyclopedia-icons/', import.meta.url)
await mkdir(directory, { recursive: true })
for (const [id, source] of Object.entries(emblems)) {
  const svg = source.replace(/>\s+</g, '><').trim()
  await writeFile(new URL(`node-emblem-${id}.svg`, directory), svg)
  console.log(`${id}: ${Buffer.byteLength(svg)} bytes`)
}
