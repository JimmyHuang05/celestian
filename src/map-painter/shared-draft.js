const url = '/__mapplus/paint-draft'

export async function readSharedPaint(signal, revisionOnly = false) {
  const response = await fetch(revisionOnly ? `${url}?revision=1` : url, { signal, cache: 'no-store' })
  if (!response.ok) throw Error('无法读取项目草稿')
  return response.json()
}

export async function writeSharedPaint(session, draft) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Paint-Token': session.token },
    body: JSON.stringify({ revision: session.revision, draft }),
  })
  const result = await response.json()
  if (!response.ok) throw Error(result.error || '项目草稿保存失败')
  session.revision = result.revision
}

export function watchProjectData(signal, read, refresh) {
  let running = false, previous
  async function check() {
    if (running || signal.aborted) return
    running = true
    try {
      const next = await read()
      if (!signal.aborted && next !== previous) {
        previous = next
        refresh(next)
      }
    } catch { /* Retry on the next poll. */ }
    finally { running = false }
  }
  const timer = setInterval(check, 1800)
  signal.addEventListener('abort', () => clearInterval(timer), { once: true })
  window.addEventListener('focus', check, { signal })
  check()
}
