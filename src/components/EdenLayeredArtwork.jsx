import { EDEN_ART_LAYERS, EDEN_ART_SIZE } from './eden-artwork-layers'
import './eden-layered-artwork.css'

/** Experimental artwork component, independent of the production opening. */
export default function EdenLayeredArtwork({ settings = {}, solo = null, title = false, onError }) {
  return (
    <div className="eden-layered-artwork" role="img" aria-label="可独立移动的开屏美术图层">
      {EDEN_ART_LAYERS.map(layer => {
        const state = { ...layer.initial, ...settings[layer.id] }
        return (
          <div key={layer.id} className="eden-art-layer" data-layer={layer.id}
            style={{
              visibility: (solo ? solo === layer.id : state.visible) ? 'visible' : 'hidden',
              opacity: state.opacity,
              '--layer-x': `${state.x}%`, '--layer-y': `${state.y}%`,
              '--layer-scale': state.scale, '--layer-stretch-y': state.stretchY, '--layer-depth': layer.depth,
            }}>
            <img src={layer.src} width={EDEN_ART_SIZE.width} height={EDEN_ART_SIZE.height}
              alt="" draggable="false" onError={() => onError?.(layer.id)} />
          </div>
        )
      })}
      {title && !solo && <div className="eden-layered-title" aria-hidden="true">
        <img src="/images/eden/celestian-requiem-prayer-v3.png" alt="" draggable="false" />
        <span>无光的伊甸园</span>
      </div>}
    </div>
  )
}
