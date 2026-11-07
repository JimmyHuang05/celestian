export function openPaintDatabase(project = 'default') {
  return new Promise((resolve, reject) => {
    const names = { legacy: 'celestian-map-painter-legacy-v1', countries: 'celestian-map-painter-countries-v1' }
    const request = indexedDB.open(names[project] || (project.startsWith('current-') ? `celestian-map-painter-${project}` : 'celestian-map-painter-v1'), 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('meta')
      request.result.createObjectStore('chunks')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('请关闭其他编辑器标签页后再试'))
  })
}

export function readPaint(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['meta', 'chunks'], 'readonly')
    const meta = tx.objectStore('meta').get('project')
    const keys = tx.objectStore('chunks').getAllKeys()
    const values = tx.objectStore('chunks').getAll()
    tx.oncomplete = () => resolve({ meta: meta.result, chunks: keys.result.map((key, i) => [key, values.result[i]]) })
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('草稿读取失败'))
  })
}

export function writePaint(db, meta, chunks) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['meta', 'chunks'], 'readwrite')
    tx.objectStore('meta').put(meta, 'project')
    for (const [key, chunk] of chunks) tx.objectStore('chunks').put(chunk.labels, key)
    tx.oncomplete = resolve
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('本机保存失败'))
  })
}
