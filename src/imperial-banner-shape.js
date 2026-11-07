// The artwork, stitched hem and physical fringe share these coordinates.
export const BANNER = {
  viewLeft: 0, viewTop: 14, width: 220, height: 554,
  left: 24, right: 196, center: 110, top: 78,
  bottom: 542, notch: 460, shoulder: 12, tongue: 14,
};

// Shared paths drive both the SVG fallback and the raised Three.js gold cord.
export const crossCommands = [
  ['M', 91, 78], ['L', 129, 78], ['Q', 125, 123, 132, 139],
  ['L', 151, 144], ['Q', 131, 164, 135, 204],
  ['Q', 165, 207, 194, 187], ['L', 194, 269], ['Q', 165, 249, 135, 251],
  ['Q', 125, 319, 130, 385], ['Q', 135, 415, 150, 437],
  ['Q', 127, 444, 110, 474], ['Q', 93, 444, 70, 437],
  ['Q', 85, 415, 90, 385], ['Q', 95, 319, 85, 251],
  ['Q', 55, 249, 26, 269], ['L', 26, 187], ['Q', 55, 207, 85, 204],
  ['Q', 89, 164, 69, 144], ['L', 88, 139], ['Q', 95, 123, 91, 78], ['Z'],
];
export const shieldCommands = [
  ['M', 62, 184], ['Q', 88, 181, 110, 171], ['Q', 132, 181, 158, 184],
  ['L', 156, 254], ['Q', 149, 284, 110, 308], ['Q', 71, 284, 64, 254], ['Z'],
];
export const pathData = commands => commands.map(([command, ...values]) => `${command}${values.join(' ')}`).join('');

export const tailEdges = [
  [[BANNER.left, BANNER.bottom], [BANNER.center - BANNER.shoulder, BANNER.notch]],
  [[BANNER.center + BANNER.shoulder, BANNER.notch], [BANNER.right, BANNER.bottom]],
];

export const bannerSilhouette = `M${BANNER.left} ${BANNER.top}H${BANNER.right}V${BANNER.bottom}L${BANNER.center + BANNER.shoulder} ${BANNER.notch}L${BANNER.center} ${BANNER.notch + BANNER.tongue}L${BANNER.center - BANNER.shoulder} ${BANNER.notch}L${BANNER.left} ${BANNER.bottom}Z`;

export function clothCoordinates([x, y]) {
  return { x: x - BANNER.viewLeft - BANNER.width / 2, y: BANNER.viewTop + BANNER.height / 2 - y };
}

export const fringeRoots = tailEdges.flatMap(([start, end]) => {
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const count = Math.floor((length - 3) / .8);
  return Array.from({ length: count }, (_, i) => {
    const t = (1.5 + i * (length - 3) / (count - 1)) / length;
    return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
  });
});
