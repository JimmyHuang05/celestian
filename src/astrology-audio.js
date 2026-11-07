// Legacy entry point delegates to the shared player and controls.
import { mountFactionSound } from './faction-sound.js'
export function mountAstrologyAudio(root) {
  return mountFactionSound(root, 'eternal-astrology')
}
