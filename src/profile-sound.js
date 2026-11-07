import './page-actions.css'
import { getSoundManager } from './sound-manager.js'
import { characterSounds } from './sound-library.js'
import { updateSoundButton } from './page-actions.js'
export function mountProfileSound(currentCharacter) {
  const manager = getSoundManager()
  const controls = document.createElement('div')
  controls.className = 'page-sound-controls'
  const toggle = document.createElement('button')
  toggle.className = 'page-action page-action--sound sound-toggle'
  controls.append(toggle); document.body.append(controls)
  const prepare = id => { if (characterSounds[id]) void manager.prepare(id).catch(() => {}) }
  const preload = () => { prepare(currentCharacter()); Object.keys(characterSounds).forEach(prepare) }
  const unlock = () => { preload(); manager.unlock() }
  const update = () => updateSoundButton(toggle, manager.muted, { enable: '开启音效', disable: '关闭音效' })
  toggle.onclick = () => { manager.setMuted(!manager.muted); if (!manager.muted) unlock() }
  const unsubscribe = manager.subscribe(update)
  update(); preload()
  return { unlock, prepare, cancel: () => manager.cancel('portrait'),
    schedule(id, delay = 140, waitForLoad = false) { manager.cancel('portrait'); manager.play(id, { delay, waitForLoad }) },
    destroy() { manager.cancel('portrait'); unsubscribe(); controls.remove() },
  }
}
