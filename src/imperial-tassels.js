import {
  InstancedMesh, CylinderGeometry, LatheGeometry, TorusGeometry,
  MeshPhysicalMaterial, DynamicDrawUsage, Vector2, Vector3, Quaternion, Matrix4, Color,
} from 'three';
import { TasselSimulation } from './imperial-tassel-physics.js';

const UP = new Vector3(0, 1, 0);
const DOWN = new Vector3(0, -1, 0);
const ROPE_SEGMENTS = 10;
// A gathered head with a wide binding collar conceals the roots of the loose fibres.
const KNOT_PROFILE = [[0, -2], [.96, -2], [1, -1.65], [.98, -1.35], [.76, -1.2], [.91, -.8], [1, -.2], [.95, .5], [.75, 1.1], [.42, 1.5], [.19, 1.8], [0, 1.9]];
const WRAP_HEIGHTS = [-1.88, -1.64, -1.4, -1, -.7, -.4, -.1, .2, .5, .8, 1.1, 1.4];
const WRAPS = WRAP_HEIGHTS.length;
function knotRadius(y) {
  const upper = KNOT_PROFILE.findIndex(point => point[1] > y);
  const a = KNOT_PROFILE[upper - 1], b = KNOT_PROFILE[upper];
  return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
}

/** Two fibre tassels, batched into three instanced draws per flag. */
export function createFlagTassels(scene, anchors, seed = 0) {
  const simulations = anchors.map((sample, i) => new TasselSimulation(sample, seed + i * 1.73));
  const threadGeometry = new CylinderGeometry(1, 1, 1, 5, 1, true);
  const knotGeometry = new LatheGeometry(KNOT_PROFILE.map(([radius, y]) => new Vector2(radius, y)), 24);
  const wrapGeometry = new TorusGeometry(1, .045, 4, 24);
  const threadMaterial = new MeshPhysicalMaterial({ color: 0xffffff, roughness: .69, metalness: .16, sheen: .5, sheenColor: 0xe3cca0, sheenRoughness: .7 });
  const knotMaterial = new MeshPhysicalMaterial({ color: 0xbca16e, roughness: .67, metalness: .18, sheen: .5, sheenColor: 0xddc492 });
  const instancesPerTassel = simulations[0].strands.length * 8 + ROPE_SEGMENTS * 2;
  const threads = new InstancedMesh(threadGeometry, threadMaterial, instancesPerTassel * 2);
  const knots = new InstancedMesh(knotGeometry, knotMaterial, 2);
  const wraps = new InstancedMesh(wrapGeometry, threadMaterial, WRAPS * 2);
  const palette = [0xe1cca1, 0xc8b180, 0xb19a6d, 0xd4bf91, 0xa48c61];
  for (const mesh of [threads, knots, wraps]) {
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    scene.add(mesh);
  }
  for (let i = 0; i < threads.count; i++) threads.setColorAt(i, new Color(palette[Math.floor(i / 8) % palette.length]));
  for (let i = 0; i < wraps.count; i++) wraps.setColorAt(i, new Color(palette[i % palette.length]));

  const a = new Vector3(), b = new Vector3(), direction = new Vector3(), middle = new Vector3();
  const scale = new Vector3(), rotation = new Quaternion(), bodyRotation = new Quaternion();
  const ringRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
  const matrix = new Matrix4(), offset = new Vector3();

  function segment(index, from, to, radius) {
    a.fromArray(from); b.fromArray(to);
    direction.subVectors(b, a);
    const length = direction.length();
    rotation.setFromUnitVectors(UP, direction.multiplyScalar(1 / (length || 1)));
    middle.addVectors(a, b).multiplyScalar(.5);
    scale.set(radius, length + .06, radius);
    matrix.compose(middle, rotation, scale);
    threads.setMatrixAt(index, matrix);
  }

  function updateGeometry() {
    let instance = 0;
    simulations.forEach((simulation, tassel) => {
      for (const strand of simulation.strands) {
        for (let n = 0; n < 8; n++) segment(instance++, strand.positions.subarray(n * 3, n * 3 + 3), strand.positions.subarray(n * 3 + 3, n * 3 + 6), strand.radius * (1 - n * .035));
      }
      const p = simulation.spine.positions;
      for (let braid = 0; braid < 2; braid++) {
        const ropePoint = t => {
          const phi = t * Math.PI * 5 + braid * Math.PI;
          return [p[0] + (p[6] - p[0]) * t + .24 * Math.cos(phi), p[1] + (p[7] - p[1]) * t, p[2] + (p[8] - p[2]) * t + .24 * Math.sin(phi)];
        };
        for (let n = 0; n < ROPE_SEGMENTS; n++) segment(instance++, ropePoint(n / ROPE_SEGMENTS), ropePoint((n + 1) / ROPE_SEGMENTS), .18);
      }
      direction.fromArray(simulation.axis);
      bodyRotation.setFromUnitVectors(DOWN, direction);
      middle.fromArray(p, 9);
      scale.set(2.2, 1, 2.2);
      matrix.compose(middle, bodyRotation, scale);
      knots.setMatrixAt(tassel, matrix);
      for (let n = 0; n < WRAPS; n++) {
        const y = WRAP_HEIGHTS[n];
        const radius = knotRadius(y);
        offset.set(0, y, 0).applyQuaternion(bodyRotation).add(middle);
        rotation.copy(bodyRotation).multiply(ringRotation);
        scale.set(radius * 2.22, radius * 2.22, 1);
        matrix.compose(offset, rotation, scale);
        wraps.setMatrixAt(tassel * WRAPS + n, matrix);
      }
    });
    for (const mesh of [threads, knots, wraps]) mesh.instanceMatrix.needsUpdate = true;
  }
  updateGeometry();
  return {
    advance(delta) { simulations.forEach(simulation => simulation.advance(delta)); updateGeometry(); },
    dispose() {
      for (const mesh of [threads, knots, wraps]) { scene.remove(mesh); mesh.dispose(); }
      for (const resource of [threadGeometry, knotGeometry, wrapGeometry, threadMaterial, knotMaterial]) resource.dispose();
    },
  };
}
