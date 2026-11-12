// Public read-only endpoints served by the existing Celestian API.
async function readList(path, signal) {
  const response = await fetch(`/api${path}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`百科数据请求失败 (${response.status})`)
  const payload = await response.json()
  if (!payload || payload.error || !Array.isArray(payload.data)) throw new Error('百科数据格式错误')
  return payload.data
}

export function fetchEntryCounts(signal) {
  return readList('/entries/counts', signal)
}

export function fetchEntriesForNode(nodeId, signal) {
  return readList(`/entries/node/${encodeURIComponent(nodeId)}`, signal)
}
