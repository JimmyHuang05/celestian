import { createContext, useContext } from 'react'

export const MusicContext = createContext(null)
export const useBackgroundMusic = () => useContext(MusicContext)
