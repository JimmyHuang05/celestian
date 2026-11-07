import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'
import { MusicContext } from '../music-context.js'
import { getMusicManager } from '../music-manager.js'
import { installMusicNavigation } from '../music-navigation.js'

export default function BackgroundMusic({ children }) {
  const [manager] = useState(getMusicManager)
  const subscribe = useCallback(listener => manager.subscribe(listener, window), [manager])
  const enabled = useSyncExternalStore(subscribe, () => manager.enabled)
  const encyclopediaAudioRef = useRef(null)
  const { pathname, search, hash } = useLocation()
  useLayoutEffect(() => {
    encyclopediaAudioRef.current = manager.getAudio('encyclopedia')
    installMusicNavigation()
  }, [manager])
  useEffect(() => {
    manager.setPage(pathname)
    if (window.parent !== window) installMusicNavigation().syncFrameUrl(pathname + search + hash, window)
  }, [manager, pathname, search, hash])
  return <MusicContext.Provider value={{ enabled, toggleMusic: manager.toggle, encyclopediaAudioRef }}>
    {children}
  </MusicContext.Provider>
}
