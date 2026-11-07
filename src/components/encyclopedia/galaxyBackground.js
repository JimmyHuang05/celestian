// Generated once per mount. The static cloud and distant stars are cached,
// leaving only nearby stars and transient effects to animate each frame.
export function createGalaxyBackground() {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 750
  const ctx = canvas.getContext('2d')
  const pixels = ctx.createImageData(canvas.width, canvas.height)
  let seed = 13871
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646 }
  const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n) }
  const noise = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
    return (hash(ix, iy) * (1 - u) + hash(ix + 1, iy) * u) * (1 - v)
      + (hash(ix, iy + 1) * (1 - u) + hash(ix + 1, iy + 1) * u) * v
  }
  const fbm = (x, y) => {
    let result = 0, weight = .52
    for (let i = 0; i < 6; i++) {
      result += noise(x, y) * weight
      x = x * 2.03 + 11; y = y * 2.03 + 17; weight *= .49
    }
    return result
  }
  const center = x => .94 - .88 * x + .025 * Math.sin(x * 7)
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const nx = x / canvas.width, ny = y / canvas.height
      const n = fbm(nx * 4.8, ny * 4.8)
      const offset = ny - center(nx) + (noise(nx * 8 + 22, ny * 8) - .5) * .07
      const band = Math.exp(-((offset / .23) ** 2))
      const darkLane = Math.exp(-(((offset + .013 + (n - .5) * .09) / .044) ** 2))
      const light = Math.max(0, n - .26) * band * (1 - darkLane * .8) * (.6 + noise(nx * 3, ny * 3) * .7)
      const grain = (random() - .5) * 1.3, index = (y * canvas.width + x) * 4
      pixels.data[index] = 9 + n * 3 + light * 57 + grain
      pixels.data[index + 1] = 15 + n * 4 + light * 61 + grain
      pixels.data[index + 2] = 26 + n * 6 + light * 76 + grain
      pixels.data[index + 3] = 255
    }
  }
  ctx.putImageData(pixels, 0, 0)
  for (let i = 0; i < 19000; i++) {
    const x = random(), y = random()
    const band = Math.exp(-(((y - center(x)) / .2) ** 2))
    if (random() > .025 + .975 * band) continue
    const alpha = .12 + random() * .34, radius = .12 + random() * .34
    const rgb = random() > .72 ? '212,181,142' : '197,207,224'
    ctx.fillStyle = `rgba(${rgb},${alpha})`
    ctx.beginPath(); ctx.arc(x * canvas.width, y * canvas.height, radius, 0, Math.PI * 2); ctx.fill()
  }
  return canvas
}
