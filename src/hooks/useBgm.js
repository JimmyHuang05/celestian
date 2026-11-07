import { useEffect } from 'react'
import { useBackgroundMusic } from '../music-context.js'

// Page music selection and mixing belong to the global manager.
export default function useBgm({ onStateChange } = {}) {
  const { enabled: isPlaying, toggleMusic: toggle } = useBackgroundMusic()
  useEffect(() => { onStateChange?.(isPlaying) }, [isPlaying, onStateChange])
  return { isPlaying, toggle }
}
