import {createRoot} from 'react-dom/client'
import Starfield from './components/encyclopedia/Starfield.jsx'
import GalaxyVeil from './components/encyclopedia/GalaxyVeil.jsx'
import {galaxyTextureMask} from './components/encyclopedia/galaxyDensity.js'
import './profile-galaxy.css'

// The character preview shares the actual encyclopedia sky, including its
// density falloff and star colors. It does not own an audio player.
export function mountProfileGalaxy(host){
  const root=createRoot(host)
  root.render(<>
    <div className="profile-galaxy-texture" style={{maskImage:galaxyTextureMask}}/>
    <Starfield mouseX={0} mouseY={0}/>
    <GalaxyVeil/>
  </>)
  return ()=>root.unmount()
}
