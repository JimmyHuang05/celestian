import { installPageNavigation, openPage } from './page-navigation.js'
export const installProfileNavigation = installPageNavigation
export function openCharacterProfile(target = '/character-profile.html') { return openPage(target) }
export function connectProfileNavigation() {
  installPageNavigation()
  if (window.parent === window || !new URLSearchParams(location.search).has('embedded')) return
  document.querySelector('.page-action--close')?.addEventListener('click', event => {
    event.preventDefault()
    window.parent.postMessage({ type: 'profile:close' }, location.origin)
  })
}
