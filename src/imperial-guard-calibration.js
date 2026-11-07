// User-approved settings from imperial-guard-study.html, in the hall's 1672 × 941 artboard.
// y is the sole contact point at 95% of the source image height.
export const guardCalibration = [
  { id: 'guard-1', variant: 'B', x: 75.5, y: 809.77, height: 80, brightness: .6 },
  { id: 'guard-2', variant: 'B', x: 323.53, y: 809.77, height: 82, brightness: .9 },
  { id: 'guard-3', variant: 'A', x: 596.06, y: 809.77, height: 90, brightness: 1.1 },
  { id: 'guard-4', variant: 'A', x: 1069.23, y: 809.77, height: 90, brightness: 1.4 },
  { id: 'guard-5', variant: 'B', x: 1348.5, y: 809.77, height: 82, brightness: .85 },
  { id: 'guard-6', variant: 'B', x: 1596.5, y: 809.77, height: 80, brightness: .6 },
];

export function applyGuardCalibration(root) {
  root.querySelectorAll('.hall-guard').forEach((host, index) => {
    const guard = guardCalibration[index];
    if (!guard) return;
    host.dataset.guardId = guard.id;
    Object.assign(host.style, {
      left: `${guard.x / 1672 * 100}%`,
      top: `${(guard.y - guard.height * .95) / 941 * 100}%`,
      bottom: 'auto',
      width: `${guard.height * 2 / 3 / 1672 * 100}%`,
      height: `${guard.height / 941 * 100}%`,
    });
    host.style.setProperty('--guard-light', guard.brightness);
  });
}
