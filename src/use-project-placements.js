import { useEffect, useRef, useState } from 'react'
import { readProjectPlacements, saveProjectPlacements } from './map-placement-archive.js'
import { watchProjectData } from './map-painter/shared-draft.js'

export function useProjectPlacements(key, setError) {
  const readLocal = () => {
    try { return JSON.parse(localStorage.getItem(key)) || {} } catch { return {} }
  }
  const [entries, setEntries] = useState(() => import.meta.env.DEV ? {} : readLocal())
  const [status, setStatus] = useState('正在读取定位…')
  const current = useRef(entries), writes = useRef(Promise.resolve()), pending = useRef(0)
  useEffect(() => {
    const controller = new AbortController()
    let latest
    const read = async () => {
      const saved = await readProjectPlacements()
      latest = import.meta.env.DEV ? saved[key] || {} : { ...saved[key], ...current.current }
      return pending.current ? undefined : JSON.stringify(latest)
    }
    const apply = () => {
      if (pending.current) return
      current.current = latest
      setEntries(latest)
      setStatus(import.meta.env.DEV ? '已同步项目定位' : '本机定位')
    }
    if (import.meta.env.DEV) watchProjectData(controller.signal, read, apply)
    else read().then(() => { if (!controller.signal.aborted) apply() }).catch(error => setError(error.message))
    return () => controller.abort()
  }, [key, setError])

  function update(changes, mode = 'patch') {
    current.current = mode === 'replace' ? changes : { ...current.current, ...changes }
    setEntries(current.current)
    if (!import.meta.env.DEV) {
      try { localStorage.setItem(key, JSON.stringify(current.current)) } catch { setError('本机定位保存失败') }
      return
    }
    pending.current++
    setStatus('正在保存到项目…')
    writes.current = writes.current.then(() => saveProjectPlacements(key, changes, mode))
      .then(() => {
        if (pending.current === 1) { setError(''); setStatus('已保存到项目') }
      })
      .catch(error => { setError(error.message); setStatus('项目保存失败') })
      .finally(() => { pending.current-- })
  }
  function importLocal() {
    const saved = readLocal()
    if (!Object.keys(saved).length) { setError('当前浏览器没有旧定位数据'); return }
    update(saved, 'replace')
  }
  return { entries, status, update, importLocal, current }
}
