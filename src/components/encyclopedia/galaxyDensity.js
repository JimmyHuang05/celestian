// One shared falloff for both small star dust and animated stars.
// No clouds, dark lanes or changes to the original star colors.
export function galaxyDensity(x, y) {
  const distance = y - (.95 - .9 * x)
  return .18 + .82 * Math.exp(-((distance / .28) ** 2))
}

// Preserve the original fine texture, but distribute it along the same diagonal.
export const galaxyTextureMask = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="d" x1="0" y1="0" x2="1" y2="1"><stop stop-color="white" stop-opacity=".2"/><stop offset=".2" stop-color="white" stop-opacity=".28"/><stop offset=".35" stop-color="white" stop-opacity=".55"/><stop offset=".5" stop-color="white"/><stop offset=".65" stop-color="white" stop-opacity=".55"/><stop offset=".8" stop-color="white" stop-opacity=".28"/><stop offset="1" stop-color="white" stop-opacity=".2"/></linearGradient></defs><rect width="100" height="100" fill="url(#d)"/></svg>')}")`
