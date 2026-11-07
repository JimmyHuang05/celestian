import { InstancedMesh, CylinderGeometry, MeshPhysicalMaterial, DynamicDrawUsage, Vector3, Quaternion, Matrix4, Color } from 'three';
import { HemFringeSimulation } from './imperial-tassel-physics.js';

/** All short hem threads on one flag share a single draw call. */
export function createHemFringe(scene, anchors, seed = 0) {
  const simulation = new HemFringeSimulation(anchors, seed);
  const geometry = new CylinderGeometry(1, 1, 1, 5, 1, true);
  const material = new MeshPhysicalMaterial({ color: 0xffffff, roughness: .62, metalness: .25, sheen: .5, sheenColor: 0xe3cca0, sheenRoughness: .7 });
  const mesh = new InstancedMesh(geometry, material, simulation.strands.length * 3);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.frustumCulled = false;
  const palette = [0xc9ad76, 0xe0c58e, 0xb79a63, 0xd5ba83];
  for (let i = 0; i < mesh.count; i++) mesh.setColorAt(i, new Color(palette[Math.floor(i / 3) % palette.length]));
  scene.add(mesh);
  const from = new Vector3(), to = new Vector3(), direction = new Vector3(), middle = new Vector3();
  const up = new Vector3(0, 1, 0), scale = new Vector3(), rotation = new Quaternion(), matrix = new Matrix4();

  function updateGeometry() {
    let instance = 0;
    for (const strand of simulation.strands) {
      for (let n = 0; n < 3; n++) {
        from.fromArray(strand.positions, n * 3);
        to.fromArray(strand.positions, (n + 1) * 3);
        direction.subVectors(to, from);
        const length = direction.length();
        rotation.setFromUnitVectors(up, direction.multiplyScalar(1 / (length || 1)));
        middle.addVectors(from, to).multiplyScalar(.5);
        const radius = strand.radius * (1 - n * .07);
        scale.set(radius, length + .04, radius);
        matrix.compose(middle, rotation, scale);
        mesh.setMatrixAt(instance++, matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  updateGeometry();
  return {
    advance(delta) { simulation.advance(delta); updateGeometry(); },
    dispose() { scene.remove(mesh); mesh.dispose(); geometry.dispose(); material.dispose(); },
  };
}
