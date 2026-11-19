// The same seeded paper is used for the character and deity pages.
export function drawPaperGrain(canvas) {
  canvas.width = 1000
  canvas.height = 850
  const context = canvas.getContext('2d')
  const pixels = context.createImageData(canvas.width, canvas.height)
  let seed = 170031
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let i = 0; i < pixels.data.length; i += 4) {
    const value = random() < .53 ? 0 : 255
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value
    pixels.data[i + 3] = random() ** 2 * 37
  }
  context.putImageData(pixels, 0, 0)
}
