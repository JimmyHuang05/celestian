// Feather the land mask only. Political borders and ownership remain crisp.
export function softenCoast(svg, map) {
  const ns = 'http://www.w3.org/2000/svg'
  const defs = svg.querySelector('defs'), clip = svg.querySelector('#legacy-land-clip')
  if (!defs || !clip) return () => {}
  const create = (name, attrs) => {
    const element = document.createElementNS(ns, name)
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value)
    return element
  }
  const filter = create('filter', { id: 'atlas-coast-soften', x: '-1%', y: '-1%', width: '102%', height: '102%', 'color-interpolation-filters': 'sRGB' })
  const blur = create('feGaussianBlur', { stdDeviation: '1' })
  filter.append(blur); defs.append(filter)
  const mask = create('mask', { id: 'atlas-coast-coverage', maskUnits: 'userSpaceOnUse', x: '0', y: '0', width: '21600', height: '10400', 'mask-type': 'alpha' })
  const shape = create('g', { filter: 'url(#atlas-coast-soften)' })
  for (const original of clip.children) {
    const copy = original.cloneNode(true)
    copy.removeAttribute('id'); copy.setAttribute('fill', 'white'); copy.setAttribute('stroke', 'none')
    shape.append(copy)
  }
  mask.append(shape); defs.append(mask)
  const display = create('g', { mask: 'url(#atlas-coast-coverage)', 'clip-path': 'url(#legacy-land-clip)' })
  for (const child of [...svg.children]) if (child !== defs) display.append(child)
  svg.append(display)
  svg.style.shapeRendering = 'geometricPrecision'
  const update = () => blur.setAttribute('stdDeviation', String(.4 * 64 / 2 ** map.getZoom()))
  update(); map.on('zoomend', update)
  return () => map.off('zoomend', update)
}
