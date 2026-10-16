import { readFile } from 'node:fs/promises'

// Mirror nginx's /old SPA fallback in local development and preview.
export default function oldPreview() {
  const install = server => { server.middlewares.use(async (req, res, next) => {
    const pathname = new URL(req.url, 'http://localhost').pathname
    if (!['GET', 'HEAD'].includes(req.method) || !/^\/old(?:\/(?:encyclopedia(?:\/[^/.]+)?|map|functions(?:\/badge)?)?)?\/?$/.test(pathname)) return next()
    try {
      const html = await readFile(new URL('../public/old/index.html', import.meta.url))
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.end(req.method === 'HEAD' ? undefined : html)
    } catch { next() }
  }) }
  return { name: 'old-preview', configureServer: install, configurePreviewServer: install }
}
