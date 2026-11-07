// Keep retired admin URLs unavailable in both local development and preview.
export default function retiredEditor() {
  const install = server => { server.middlewares.use((req, res, next) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replaceAll('\\', '/')
    if (pathname !== '/editor' && !pathname.startsWith('/editor/') && !pathname.includes('/archive/')) return next()
    res.statusCode = 410
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(req.method === 'HEAD' ? undefined : '旧创作中心已停用，等待重构。')
  }) }
  return {
    name: 'retired-editor',
    configResolved(config) { config.server.fs.deny.push('**/archive/**') },
    configureServer: install,
    configurePreviewServer: install,
  }
}
