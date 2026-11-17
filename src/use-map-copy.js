import { useEffect, useState } from 'react'
import { copyKeyForRow, sceneCopyKey } from './map-copy-keys.js'
import {culturalCity} from './mapplus-culture.js'

export default function useMapCopy(enabled) {
  const [data, setData] = useState({ entries: {}, aliases: {} })
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    let busy = false, previous = ''
    async function refresh() {
      if (busy) return
      busy = true
      try {
        const response = await fetch(import.meta.env.DEV ? '/__mapplus/copy/values' : '/mapplus/copy-values.json', { cache: 'no-store', signal: controller.signal })
        if (!response.ok) return
        const text = await response.text()
        if (text !== previous && !controller.signal.aborted) { setData(JSON.parse(text)); previous = text }
      } catch { /* Keep the last saved copy visible when the local server reconnects. */ }
      finally { busy = false }
    }
    refresh()
    const timer = import.meta.env.DEV ? setInterval(refresh, 1000) : null
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); controller.abort(); window.removeEventListener('focus', refresh) }
  }, [enabled])
  const apply = (value, key) => {
    if (!enabled) return value
    const entry = data.entries[key] || data.entries[data.aliases[key]]
    return culturalCity(entry ? { ...value, description: entry.description } : value)
  }
  return { row: value => apply(value, copyKeyForRow(value)), scene: value => apply(value, sceneCopyKey(value)) }
}
