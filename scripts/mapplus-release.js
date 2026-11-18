import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compilePoliticalStudy } from '../src/map-political-study.js'
import { flattenCoast, setPoliticalCoast } from '../src/political-coast.js'
import { buildCountryProfiles } from '../src/political-country-profiles.js'
import { pollutionGeometry, pollutionPath, pollutionWashLayers, pollutionWashOpacity, pollutionWashColor } from '../src/map-pollution.js'
import { initialPollution } from '../src/pollution-1818.js'

const publicFile = path => new URL(`../public/${path.replace(/^\//, '').split('?')[0]}`, import.meta.url)
const readJSON = path => JSON.parse(readFileSync(publicFile(path), 'utf8'))
const fingerprint = source => createHash('sha256').update(source).digest('hex').slice(0, 16)
const releaseModule = new URL('../src/mapplus-release-data.js', import.meta.url)
const python = (script, args = [], input) => execFileSync(
  process.env.MAPPLUS_PYTHON || 'python',
  [fileURLToPath(new URL(script, import.meta.url)), ...args],
  { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, input },
)

export default function mapPlusRelease() {
  let release = null
  let building = false
  return {
    name: 'mapplus-release',
    configResolved(config) {
      building = config.command === 'build'
    },
    transform(_source, id) {
      if (release && id.replaceAll('\\', '/') === fileURLToPath(releaseModule).replaceAll('\\', '/')) {
        return `export default ${JSON.stringify(release)}`
      }
    },
    async buildStart() {
      if (!building) return
      // Standalone page builds can run in checkouts without the MapPlus artwork.
      if (!existsSync(publicFile('mapplus/manifest.json'))) return
      const manifest = readJSON('mapplus/manifest.json')
      const coast = readFileSync(publicFile(manifest.coastalGeometryUrl), 'utf8')
      const shape = coast.match(/<path id="mapplus-land-shape" d="([^"]+)"/)?.[1]
      const mask = coast.match(/<mask id="mapplus-land-clip"[^>]*>([\s\S]*?)<\/mask>/)?.[1]
      const offsets = [...(mask || '').matchAll(/translate\(([-\d.]+) 0\)/g)].map(([, x]) => Number(x))
      if (!shape || !offsets.length) throw Error('Unable to read MapPlus release coastline')
      setPoliticalCoast(shape, offsets)
      const countries = readJSON('mapplus/political-study-v2/countries.json')
      const draft = readJSON('mapplus/political-study-v2/vector-draft.json')
      const legacy = readJSON('map/world-240705-base-v2/legacy-region-metadata.json')
      const demography = readJSON('mapplus/country-demography.json')
      const [svg, records] = await compilePoliticalStudy(
        manifest, draft, countries, buildCountryProfiles(countries.data, legacy.data), demography, true,
      )
      const paths = new Map([...svg.matchAll(/data-region-id="([^"]+)"[^>]*\sd="([^"]*)"/g)].map(([, id, path]) => [id, path]))
      const geometry = pollutionGeometry(paths, initialPollution)
      const pollutionBorder = pollutionPath(geometry, true)
      let pollutionImage
      try {
        pollutionImage = Buffer.from(python('./build-mapplus-pollution.py', [], JSON.stringify({
          geometry, shore: flattenCoast(shape), offsets, layers: pollutionWashLayers,
          opacity: pollutionWashOpacity, color: pollutionWashColor,
        })).trim(), 'base64')
      } catch (error) {
        throw new Error('MapPlus release requires Python with Pillow installed to generate the pollution wash.', { cause: error })
      }
      const pollutionFile = `assets/mapplus-pollution-${fingerprint(pollutionImage)}.webp`
      this.emitFile({ type: 'asset', fileName: pollutionFile, source: pollutionImage })
      const politics = JSON.stringify({ coordinateSystemSha256: manifest.coordinateSystemSha256, svg, records, pollutionBorder })
      const politicalFile = `assets/mapplus-politics-${fingerprint(politics)}.json`
      this.emitFile({ type: 'asset', fileName: politicalFile, source: politics })

      const encoder = new URL('./build-mapplus-water-pyramid.py', import.meta.url)
      const source = publicFile(manifest.waterwaysImageUrl)
      const waterHash = createHash('sha256').update(readFileSync(source)).update(readFileSync(encoder)).digest('hex').slice(0, 16)
      const waterDir = `assets/mapplus-water-${waterHash}`
      let encoded
      try {
        encoded = python('./build-mapplus-water-pyramid.py', [fileURLToPath(source)])
      } catch (error) {
        throw new Error('MapPlus release requires Python with Pillow installed to generate water tiles.', { cause: error })
      }
      for (const line of encoded.trim().split(/\r?\n/)) {
        const [name, data] = JSON.parse(line)
        this.emitFile({ type: 'asset', fileName: `${waterDir}/${name}`, source: Buffer.from(data, 'base64') })
      }
      release = {
        manifest,
        politics: '/' + politicalFile,
        pollution: '/' + pollutionFile,
        water: { source: manifest.waterwaysImageUrl, preview: `/${waterDir}/overview.webp`, tiles: `/${waterDir}/{z}/{x}/{y}.webp` },
      }
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        if (!release) return html
        const detail = Object.keys(bundle || {}).find(name => /^assets\/MapDetail-[^/]+\.js$/.test(name))
        const boot = { ...release, detail: detail ? '/' + detail : undefined }
        return html.replace('/* mapplus-boot-release */ null', JSON.stringify(boot).replaceAll('<', '\\u003c'))
      },
    },
  }
}
