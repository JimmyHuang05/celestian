import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { execSync } from 'child_process'
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import oldPreview from './scripts/old-preview.js'
import devNavigation from './scripts/dev-navigation.js'
import retiredEditor from './scripts/retired-editor.js'

function layeredMapPreview() {
  const assets = new Map([
    ['/__local-map/land.svg', new URL('../output/WorldMap_240705_陆地图_护边.svg', import.meta.url)],
    ['/__local-map/mountains.svg', new URL('../output/mountain-svg-audit/WorldMap_240705_山系_复用.svg', import.meta.url)],
    ['/__local-map/text-labels/texture.webp', new URL('../output/map-text-preview/texture.webp', import.meta.url)],
    ['/__local-map/text-labels/labels.svg', new URL('./public/map/world-240705-base-v2/labels.svg', import.meta.url)],
    ['/__local-map/text-labels/labels-index.json', new URL('./public/map/world-240705-base-v2/labels-index.json', import.meta.url)],
  ])
  return {
    name: 'layered-map-preview',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const tile = /^\/__local-map\/composite\/(\d+\/\d+\/\d+\.webp)$/.exec(request.url || '')
        if (tile && ['GET', 'HEAD'].includes(request.method)) {
          let body
          try {
            body = readFileSync(new URL(`./public/map/world-240705-composite-v2/${tile[1]}`, import.meta.url))
          } catch {
            response.statusCode = 404
            response.end()
            return
          }
          response.setHeader('Content-Type', 'image/webp')
          response.setHeader('Content-Length', body.length)
          response.end(request.method === 'HEAD' ? undefined : body)
          return
        }
        const asset = assets.get(request.url)
        if (!asset || !['GET', 'HEAD'].includes(request.method)) return next()
        let body
        try { body = readFileSync(asset) } catch { response.statusCode = 404; response.end(); return }
        response.setHeader('Content-Type', request.url.endsWith('.json') ? 'application/json' : request.url.endsWith('.webp') ? 'image/webp' : 'image/svg+xml')
        response.setHeader('Vary', 'Accept-Encoding')
        if (/\bgzip\b/.test(request.headers['accept-encoding'] || '')) {
          body = gzipSync(body)
          response.setHeader('Content-Encoding', 'gzip')
        }
        response.setHeader('Content-Length', body.length)
        response.end(request.method === 'HEAD' ? undefined : body)
      })
    },
    transformIndexHtml() {
      return [{
        tag: 'script', injectTo: 'head-prepend',
        children: `window.__celestianTextLabelPreview = new URLSearchParams(location.search).get('labelPreview') === 'text'
        if (/^\\/map\\/?$/.test(location.pathname) && [null, 'composite'].includes(new URLSearchParams(location.search).get('basemap'))) {
          window.__celestianCompositePreview = true
        } else if (/^\\/map\\/?$/.test(location.pathname) && new URLSearchParams(location.search).get('basemap') === 'layers') {
          window.__celestianLayeredPreview = true
          for (const name of ['land', 'mountains']) {
            const link = document.createElement('link')
            link.rel = 'preload'
            link.as = 'image'
            link.fetchPriority = name === 'land' ? 'high' : 'auto'
            link.href = '/__local-map/' + name + '.svg'
            document.head.append(link)
          }
        }`,
      }]
    },
  }
}

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

function getBuildDate() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

// The public gallery is served by the same API used in production.
// Restrict the development proxy to this read-only endpoint.
const galleryProxy = {
  '/api/system/logs': {
    target: 'https://celestian.jimmyhuang.cn',
    changeOrigin: true,
    secure: true,
    bypass(req, res) {
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.statusCode = 405
        res.end('Method not allowed')
        return false
      }
    },
  },
  '/api/entries/node/gallery': {
    target: 'https://celestian.jimmyhuang.cn',
    changeOrigin: true,
    secure: true,
    bypass(req, res) {
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.statusCode = 405
        res.end('Method not allowed')
        return false
      }
    },
  },
}

// The atlas can start with system fonts while the shared font rules download.
// Keep the normal blocking stylesheet on the other entry routes.
function optimizeMapEntry() {
  return {
    name: 'optimize-map-entry',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, { path, bundle }) {
        if (path !== '/index.html') return html
        const { width, height, tileSize, minZoom, maxZoom, coordinateSystemSha256 } = JSON.parse(readFileSync(
          new URL('./public/map/world-240705-base-v2/manifest.json', import.meta.url), 'utf8',
        ))
        html = html.replace('/* map-boot-geometry */ null', JSON.stringify({ width, height, tileSize, minZoom, maxZoom, coordinateSystemSha256 }))
        // Map lettering has its own embedded font subset. Let UI fonts load from
        // CSS when needed, instead of competing with tiles at high priority.
        html = html.replace(/<link\b[^>]*rel="preload"[^>]*as="font"[^>]*>/g, link =>
          link.replace('>', ' media="not all">') +
          '<script>if (!/^\\/map\\/?$/.test(location.pathname)) document.currentScript.previousElementSibling.media = "all"</script>')
        return html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="\/([^"]+)"[^>]*>/g, (link, file) => {
          const asset = bundle?.[file]
          if (asset?.type !== 'asset' || !String(asset.source).includes('@font-face')) return link
          return link.replace('>', ' media="print" onload="this.media=\'all\'">') +
            '<script>if (!document.documentElement.dataset.mapBoot) document.currentScript.previousElementSibling.media = "all"</script>'
        })
      },
    },
  }
}

export default defineConfig({
  server: { proxy: galleryProxy },
  preview: { proxy: galleryProxy },
  build: { rollupOptions: { input: {
    main: 'index.html',
    characters: 'character-profile.html',
    astrology: 'faction-profile.html',
    affairs: 'unconventional-affairs.html',
    imperial: 'imperial-knights.html',
  } } },
  define: {
    __BUILD_INFO__: JSON.stringify({
      commit: getGitCommit(),
      branch: getGitBranch(),
      date: getBuildDate(),
      env: 'production',
    }),
  },
  plugins: [
    layeredMapPreview(),
    optimizeMapEntry(),
    retiredEditor(),
    devNavigation(),
    oldPreview(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
