// Unit square -> four ordered image points: top-left, top-right,
// bottom-right, bottom-left. Shared by the study and approved live flags.
export function homography(quad) {
  const [p0, p1, p2, p3] = quad;
  const dx1 = p1[0] - p2[0], dx2 = p3[0] - p2[0];
  const dy1 = p1[1] - p2[1], dy2 = p3[1] - p2[1];
  const dx3 = p0[0] - p1[0] + p2[0] - p3[0];
  const dy3 = p0[1] - p1[1] + p2[1] - p3[1];
  const det = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(det) < 1e-8) throw new Error('Degenerate wall plane');
  const g = (dx3 * dy2 - dx2 * dy3) / det;
  const h = (dx1 * dy3 - dx3 * dy1) / det;
  return [p1[0] - p0[0] + g * p1[0], p3[0] - p0[0] + h * p3[0], p0[0],
    p1[1] - p0[1] + g * p1[1], p3[1] - p0[1] + h * p3[1], p0[1], g, h, 1];
}
export function project(matrix, u, v) {
  const [a,b,c,d,e,f,g,h] = matrix;
  const w = g * u + h * v + 1;
  return [(a * u + b * v + c) / w, (d * u + e * v + f) / w];
}
export function validQuad(quad) {
  if (!Array.isArray(quad) || quad.length !== 4 || !quad.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))) return false;
  return quad.every((p,i) => {
    const q = quad[(i+1)%4], r = quad[(i+2)%4];
    return (q[0]-p[0])*(r[1]-q[1])-(q[1]-p[1])*(r[0]-q[0]) > 100;
  });
}
export function panelGeometry(arch) {
  const matrix = homography(arch.wall);
  const {center, top, size} = arch.panel;
  // The local metric rectangle has aspect=width/height. Its height is held
  // fixed during tracing; moving a corner changes projection, not the square.
  const left = center-size/2, height = size*arch.wallAspect;
  const sample = (u,v) => project(matrix,left+u*size,top+v*height);
  return {matrix, left, right:left+size, sample,
    corners:[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>sample(u,v))};
}
