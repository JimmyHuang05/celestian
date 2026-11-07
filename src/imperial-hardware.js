import { CylinderGeometry, SphereGeometry, LatheGeometry, TorusGeometry, Vector2, Vector3, Quaternion, Matrix4, Mesh, MeshStandardMaterial } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clothCoordinates } from './imperial-banner-shape.js';

/** Fixed suspension: blackened rod, turned finials, gold-bound fabric loops and a cord. */
export function createBannerHardware(scene) {
  const parts = { gold: [], iron: [], cord: [], linen: [] };
  const materials = {
    gold: new MeshStandardMaterial({ color: 0xbc944d, metalness: .78, roughness: .4 }),
    iron: new MeshStandardMaterial({ color: 0x292a23, metalness: .65, roughness: .48 }),
    cord: new MeshStandardMaterial({ color: 0x514636, metalness: .04, roughness: .94 }),
    linen: new MeshStandardMaterial({ color: 0xd1c5a3, metalness: .1, roughness: .8 }),
  };
  const up = new Vector3(0, 1, 0);
  const point = (x, y, z = 1) => { const p = clothCoordinates([x, y]); return new Vector3(p.x, p.y, z); };
  const place = (geometry, category, position, rotation = new Quaternion()) => {
    geometry.applyMatrix4(new Matrix4().compose(position, rotation, new Vector3(1, 1, 1)));
    parts[category].push(geometry);
  };
  const segment = (a, b, radius, category) => {
    const direction = b.clone().sub(a);
    place(new CylinderGeometry(radius, radius, direction.length(), 12), category, a.clone().add(b).multiplyScalar(.5), new Quaternion().setFromUnitVectors(up, direction.normalize()));
  };
  segment(point(12, 69), point(208, 69), 2.25, 'iron');
  segment(point(26, 67, -1), point(110, 23, -1), .85, 'cord');
  segment(point(110, 23, -1), point(194, 67, -1), .85, 'cord');
  place(new SphereGeometry(3.1, 12, 10), 'gold', point(110, 23));
  const alongX = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
  for (const x of [8, 212]) {
    const profile = [[0,-6],[1.8,-4],[3.3,-2],[4.1,0],[3.3,2],[1.8,4],[0,6]].map(([r,y])=>new Vector2(r,y));
    place(new LatheGeometry(profile, 16), 'gold', point(x,69), alongX);
  }
  for (const x of [28, 69, 110, 151, 192]) {
    // The loop descends to the pinned cloth edge; its front is visible over the rod.
    const loop = new CylinderGeometry(2.8, 2.8, 6, 16);
    place(loop, 'linen', point(x, 70), alongX);
    segment(point(x - 2, 69, 3), point(x - 2, 79, 1.2), .65, 'gold');
    segment(point(x + 2, 69, 3), point(x + 2, 79, 1.2), .65, 'gold');
    for (const dx of [-2.6, 2.6]) {
      place(new TorusGeometry(2.85, .36, 6, 18), 'gold', point(x + dx, 70), new Quaternion().setFromAxisAngle(new Vector3(0,1,0),Math.PI/2));
    }
  }
  const meshes = Object.entries(parts).map(([category, geometries]) => {
    const geometry = mergeGeometries(geometries);
    geometries.forEach(piece => piece.dispose());
    const mesh = new Mesh(geometry, materials[category]);
    scene.add(mesh);
    return mesh;
  });
  return { dispose() { meshes.forEach(mesh => { scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }); } };
}
