const cameras = new WeakMap()
const origin = [0, 0]
const zoomTiming = { duration: 250, easing: 'cubic-bezier(0,0,.25,1)' }

function translate(x, y) {
  return `translate3d(${x}px, ${y}px, 0)`
}

// Move each world pane as a single surface. Fixed-size markers use the same
// projection and animation clock, with translation only.
function worldCamera(map) {
  const existing = cameras.get(map)
  if (existing) return existing

  let zoom = map.getZoom()
  let projectedOrigin = map.project(origin, zoom)
  const surfaces = new Map()
  const layouts = new Map()
  let frame, flight

  function coordinates(point, targetZoom) {
    return { x: point.x, y: point.y, scale: map.getZoomScale(targetZoom, zoom) }
  }

  function sync(surface) {
    surface.element.style.transform = surface.transform(frame)
  }

  function fly(surface) {
    surface.animation?.cancel()
    sync(surface)
    if (!flight || surface.element.style.display === 'none') return
    surface.animation = surface.element.animate(
      [{ transform: surface.transform(flight.start) }, { transform: surface.transform(frame) }],
      zoomTiming,
    )
    surface.animation.startTime = flight.time
  }

  function reset() {
    const currentZoom = map.getZoom()
    frame = coordinates(map.project(origin, currentZoom).subtract(map.getPixelOrigin()), currentZoom)
    flight = null
    for (const surface of surfaces.values()) {
      surface.animation?.cancel()
      sync(surface)
    }
  }

  function animate(event) {
    flight = { start: frame, time: document.timeline.currentTime }
    frame = coordinates(map._latLngToNewLayerPoint(origin, event.zoom, event.center), event.zoom)
    for (const surface of surfaces.values()) fly(surface)
  }

  function rebase() {
    // A transformed SVG can otherwise keep the raster resolution of whichever
    // zoom happened to be active when its asynchronous load first completed.
    // Re-layout at the settled zoom so the compositor ends at scale(1).
    zoom = map.getZoom()
    projectedOrigin = map.project(origin, zoom)
    for (const layout of layouts.values()) layout()
    reset()
  }

  const camera = {
    get zoom() { return zoom },
    get projectedOrigin() { return projectedOrigin },
    layout(element, callback) {
      layouts.set(element, callback)
      callback()
    },
    removeLayout(element) { layouts.delete(element) },
    bind(element, transform) {
      const surface = { element, transform }
      surfaces.set(element, surface)
      fly(surface)
      return {
        sync: () => sync(surface),
        remove() {
          surface.animation?.cancel()
          surfaces.delete(element)
        },
      }
    },
    bindPane(pane) {
      if (surfaces.has(pane)) return
      pane.style.transformOrigin = '0 0'
      pane.style.transition = 'none'
      pane.style.willChange = 'transform'
      this.bind(pane, ({ x, y, scale }) => `${translate(x, y)} scale(${scale})`)
    },
  }

  reset()
  map.on('zoom viewreset', reset)
  map.on('zoomanim', animate)
  map.on('zoomend', rebase)
  map.once('unload', () => {
    for (const surface of surfaces.values()) surface.animation?.cancel()
    surfaces.clear()
    layouts.clear()
    map.off('zoom viewreset', reset)
    map.off('zoomanim', animate)
    map.off('zoomend', rebase)
    cameras.delete(map)
  })
  cameras.set(map, camera)
  return camera
}

function stableWorldOverlay(overlay, element) {
  element.classList.add('mapplus-world-overlay')
  overlay.getEvents = () => ({})
  overlay._reset = function () {
    const map = this._map
    const camera = worldCamera(map)
    camera.bindPane(this.getPane())
    camera.layout(element, () => {
      const northwest = map.project(this._bounds.getNorthWest(), camera.zoom)
      const size = map.project(this._bounds.getSouthEast(), camera.zoom).subtract(northwest)
      const point = northwest.subtract(camera.projectedOrigin)
      element.style.left = `${point.x}px`
      element.style.top = `${point.y}px`
      element.style.width = `${size.x}px`
      element.style.height = `${size.y}px`
    })
  }
  overlay.on('remove', () => cameras.get(overlay._map)?.removeLayout(element))
  return overlay
}

export function anchorWorldMarker(map, marker, worldSize) {
  let binding
  let sizedElement
  const update = marker.update
  marker.update = function () {
    update.call(this)
    binding?.sync()
    return this
  }
  marker._animateZoom = () => {}
  marker.on('add move', () => {
    const element = marker.getElement()
    if (!element) return
    const camera = worldCamera(map)
    element.classList.add('mapplus-world-overlay', 'mapplus-world-marker')
    binding?.remove()
    if(sizedElement)camera.removeLayout(sizedElement)
    if(worldSize){
      sizedElement=element
      element.style.transformOrigin='0 0'
      camera.layout(element,()=>{
        const size=worldSize(camera.zoom)
        element.style.width=`${size}px`;element.style.height=`${size}px`
        element.style.marginLeft='0';element.style.marginTop='0'
      })
    }
    binding = camera.bind(element, ({ x, y, scale }) => {
      const point = map.project(marker.getLatLng(), camera.zoom).subtract(camera.projectedOrigin)
      return translate(x + point.x * scale, y + point.y * scale)+(worldSize?` scale(${scale})`:'')
    })
  })
  marker.on('remove', () => {
    binding?.remove()
    if(sizedElement)cameras.get(map)?.removeLayout(sizedElement)
    binding = null
  })
  return marker
}

export function stableSvgOverlay(L, svg, bounds, options) {
  return stableWorldOverlay(L.svgOverlay(svg, bounds, options), svg)
}

export function stableImageOverlay(L, image, bounds, options) {
  return stableWorldOverlay(L.imageOverlay(image, bounds, options), image)
}

// Tile levels and vector panes must use one animation clock. Leaflet's CSS
// tile transitions otherwise start separately from the shared SVG camera.
export function anchorWorldTileLayer(layer) {
  const bindings=new Map()
  layer._setZoomTransform=function(level){
    if(bindings.has(level.el))return
    const map=this._map,camera=worldCamera(map)
    level.el.style.transition='none'
    level.el.style.transformOrigin='0 0'
    bindings.set(level.el,camera.bind(level.el,({x,y,scale})=>{
      const factor=map.getZoomScale(camera.zoom,level.zoom)*scale
      const base=map.project(origin,level.zoom)
      return `${translate(x+(level.origin.x-base.x)*factor,y+(level.origin.y-base.y)*factor)} scale(${factor})`
    }))
  }
  const removeLevel=layer._onRemoveLevel
  layer._onRemoveLevel=function(z){
    const el=this._levels[z]?.el
    bindings.get(el)?.remove();bindings.delete(el)
    removeLevel.call(this,z)
  }
  layer.on('remove',()=>{for(const binding of bindings.values())binding.remove();bindings.clear()})
  return layer
}
