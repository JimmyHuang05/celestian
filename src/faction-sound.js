import { getMusicManager } from './music-manager.js'
import { musicLibrary } from './music-library.js'
import { installMusicNavigation } from './music-navigation.js'

export function mountFactionSound(root, theme) {
  const manager = getMusicManager()
  installMusicNavigation()
  manager.select(musicLibrary[theme] ? theme : null)
  // The persistent vinyl view provides the controls; a faction only selects its track.
  return () => {}
}
