import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'
import { MusicContext } from '../music-context.js'
import { getMusicManager } from '../music-manager.js'

export default function BackgroundMusic({ children }) {
  const [manager] = useState(getMusicManager)
  const subscribe = useCallback(listener => manager.subscribe(listener, window), [manager])
  const enabled = useSyncExternalStore(subscribe, () => manager.enabled)
  const encyclopediaAudioRef = useRef(null)
  const { pathname, search, hash } = useLocation()
  useLayoutEffect(() => {
    encyclopediaAudioRef.current = manager.getAudio('encyclopedia')
  }, [manager])
  useEffect(() => {
    manager.setPage(pathname)
    let active = true
    // Starting the interactive page does not require the persistent player UI.
    import('../music-navigation.js').then(({ installMusicNavigation }) => {
      if (!active) return
      const navigation = installMusicNavigation()
      if (window.parent !== window) navigation.syncFrameUrl(pathname + search + hash, window)
    }).catch(error => console.error('Page navigation failed to load', error))
    return () => { active = false }
  }, [manager, pathname, search, hash])
  return <MusicContext.Provider value={{ enabled, toggleMusic: manager.toggle, encyclopediaAudioRef }}>
    {children}
  </MusicContext.Provider>
}
