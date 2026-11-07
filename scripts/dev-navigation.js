import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

export default function devNavigation() {
  let root
  const primary = [
    { title: '百科全书', url: '/encyclopedia/', group: '正式页面' },
    { title: '海陆图志', url: '/map/', group: '正式页面' },
    { title: '地图涂色工作台', url: '/map-painter/', group: '设计预览' },
    { title: '众生录 · 角色档案', url: '/character-profile.html', group: '正式页面' },
    { title: '势力档案 · 通用模板', url: '/faction-profile.html', group: '正式页面' },
  ]
  async function catalog() {
    const entries = [...primary]
    const seen = new Set(entries.map(p => p.url))
    async function scan(directory, prefix, recursive) {
      for (const file of await readdir(directory, { withFileTypes: true })) {
        if (file.isSymbolicLink()) continue
        const full = path.join(directory, file.name)
        if (file.isDirectory() && recursive && !['assets', 'images', 'audio', 'old', 'editor'].includes(file.name)) {
          await scan(full, `${prefix}${file.name}/`, true)
        } else if (file.isFile() && file.name.endsWith('.html')) {
          const url = `${prefix}${file.name}`
          if (seen.has(url) || url === '/index.html') continue
          const html = await readFile(full, 'utf8')
          const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || file.name
          entries.push({ title, url, group: '设计预览' })
          seen.add(url)
        }
      }
    }
    await scan(root, '/', false)
    await scan(path.join(root, 'public'), '/', true)
    return entries
  }
  return {
    name: 'local-development-navigation',
    apply: 'serve',
    configResolved(config) { root = config.root },
    transformIndexHtml() {
      return [{ tag: 'script', attrs: { type: 'module', src: '/src/devtools/navigation.js' }, injectTo: 'body' }]
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!['GET', 'HEAD'].includes(req.method)) return next()
        try {
          const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
          if (pathname === '/__dev-navigation/pages.json') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end(req.method === 'HEAD' ? undefined : JSON.stringify(await catalog()))
            return
          }
          // Vite serves public HTML verbatim; inject the same tool there as well.
          if (!pathname.endsWith('.html') && !pathname.endsWith('/')) return next()
          const publicRoot = path.resolve(root, 'public')
          const candidate = path.resolve(publicRoot, `.${pathname}${pathname.endsWith('/') ? 'index.html' : ''}`)
          if (!candidate.startsWith(publicRoot + path.sep)) return next()
          if (!(await stat(candidate).catch(() => null))?.isFile()) return next()
          const html = await server.transformIndexHtml(pathname, await readFile(candidate, 'utf8'))
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(req.method === 'HEAD' ? undefined : html)
        } catch (error) { next(error) }
      })
    },
  }
}
