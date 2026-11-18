export async function rasterizeMapSVG(svg, width, height) {
  const sourceSVG = svg.cloneNode(true)
  sourceSVG.setAttribute('width', width)
  sourceSVG.setAttribute('height', height)
  const image = new Image()
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(sourceSVG)], { type: 'image/svg+xml' }))
  try {
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(image, 0, 0, width, height)
    canvas.setAttribute('aria-hidden', 'true')
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}
