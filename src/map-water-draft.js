export const WATER_BASE = 'c63b65abc41f'
const LEGACY_WATER_BASE = 'b67e7c4b00f4'
// Coordinate system is unchanged; retain existing local drawings.
export const WATER_KEY = 'celestian-water-draft-' + LEGACY_WATER_BASE
export function cleanWaterDraft(value) {
  if (!value || value.version !== 1 || ![WATER_BASE, '739588e7a41a', 'e0efb80cd18a', LEGACY_WATER_BASE].includes(value.baseCheck) || !Array.isArray(value.strokes) || value.strokes.length > 250) throw new Error('草稿版本或底图不匹配')
  const strokes = value.strokes.map(s => {
    if (!['river', 'lake'].includes(s.kind) || !Array.isArray(s.points) || !s.points.length || s.points.length > 4000 || !Number.isFinite(s.radius) || s.radius < 1 || s.radius > 40 || s.points.some(p => !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite) || p[0] < 0 || p[0] > 2048 || p[1] < 0 || p[1] > 1024)) throw new Error('草稿笔画数据无效')
    return { id: String(s.id).slice(0, 80), kind: s.kind, radius: s.radius, points: s.points.map(p => [...p]) }
  })
  return { version: 1, baseCheck: WATER_BASE, updatedAt: Number.isFinite(value.updatedAt) ? value.updatedAt : 0, strokes }
}

// Paths are stored in display coordinates; Civ Atlas uses the unrotated world.
export const WATER_SHIFT = 31.68515625 / 360 * 2048
const number = n => Number(n.toFixed(3))
export function waterResultSvg(result) {
  const lakes = result.lakeLoops.map(p => `<path d="${p.reduce((d, n, i) => d + (i % 2 ? ' ' : i ? 'L' : 'M') + number(n), '')}Z" fill="#a6c6cf" fill-opacity=".9" stroke="#4a7a8a" stroke-width=".6"/>`).join('')
  const rivers = result.riverLines.map(r => {
    let d = '', prev
    for (let i = 0; i < r.points.length; i += 3) {
      const x = r.points[i], y = r.points[i + 1]
      d += (!prev || Math.abs(x - prev[0]) > 1024 ? 'M' : 'L') + number(x) + ' ' + number(y)
      prev = [x, y]
    }
    return `<path d="${d}" fill="none" stroke="${r.drawn ? '#167f9a' : '#4a7a8a'}" stroke-width="${r.drawn ? 1.2 : .6}" stroke-linejoin="round" stroke-linecap="round"/>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 1024" width="4096" height="2048"><title>水系优化预览</title><defs><g id="water">${lakes}${rivers}</g></defs>${[-2048, 0, 2048].map(x => `<use href="#water" transform="translate(${x - WATER_SHIFT} 0)"/>`).join('')}</svg>`
}
