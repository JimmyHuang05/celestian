import { useState, useEffect, useRef, useCallback } from 'react'

function useBgm(src, { volume = 0.25, autoplay = true, onStateChange } = {}) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const toggle = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = volume
    audioRef.current = audio

    if (autoplay) {
      audio.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        const startOnInteraction = () => {
          if (audioRef.current) audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
          document.removeEventListener('click', startOnInteraction)
          document.removeEventListener('touchstart', startOnInteraction)
        }
        document.addEventListener('click', startOnInteraction)
        document.addEventListener('touchstart', startOnInteraction)
      })
    }

    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [src, volume, autoplay])

  useEffect(() => {
    if (onStateChange) onStateChange(isPlaying)
  }, [isPlaying, onStateChange])

  return { isPlaying, toggle }
}

export default useBgm
