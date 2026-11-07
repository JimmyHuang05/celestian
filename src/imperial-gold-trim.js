import { Path, BufferGeometry, Float32BufferAttribute, Mesh, MeshPhysicalMaterial } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BANNER, crossCommands, shieldCommands, clothCoordinates } from './imperial-banner-shape.js';
import { bindClothMaterial } from './imperial-cloth-motion.js';

export function cordGeometry(commands, radius, elevation, closed = true) {
  const path = new Path();
  for (const [command, ...values] of commands) {
    const points = [];
    for (let i = 0; i < values.length; i += 2) {
      const point = clothCoordinates([values[i], values[i + 1]]);
      points.push(point.x, point.y);
    }
    if (command === 'M') path.moveTo(...points);
    else if (command === 'L') path.lineTo(...points);
    else if (command === 'Q') path.quadraticCurveTo(...points);
    else if (command === 'Z') path.closePath();
  }
  const length = path.getLength(), segments = Math.max(12, Math.ceil(length / .65));
  const points = path.getSpacedPoints(segments), radial = 8;
  const positions = [], uv = [], indices = [];
  for (let i = 0; i <= segments; i++) {
    const prev = points[i ? i - 1 : closed ? segments - 1 : 0];
    const next = points[i < segments ? i + 1 : closed ? 1 : segments];
    const dx = next.x - prev.x, dy = next.y - prev.y, distance = Math.hypot(dx, dy) || 1;
    for (let j = 0; j <= radial; j++) {
      const angle = j / radial * Math.PI * 2;
      // Two shallow helices give bullion cord a twisted profile rather than a smooth metal tube.
      const twist = .94 + .06 * Math.sin(angle * 2 - i / segments * length * 5.2);
      const r = radius * twist;
      positions.push(points[i].x - dy / distance * Math.cos(angle) * r, points[i].y + dx / distance * Math.cos(angle) * r, elevation + Math.sin(angle) * r * .7);
      uv.push(i / segments, j / radial);
      if (i < segments && j < radial) {
        const a = i * (radial + 1) + j, b = a + radial + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createRaisedTrim(scene, motion) {
  const perimeter = [['M', BANNER.left, BANNER.top], ['L', BANNER.left, BANNER.bottom], ['L', 98, BANNER.notch], ['L', 110, BANNER.notch + BANNER.tongue], ['L', 122, BANNER.notch], ['L', BANNER.right, BANNER.bottom], ['L', BANNER.right, BANNER.top]];
  const pieces = [cordGeometry(crossCommands, .88, .95), cordGeometry(shieldCommands, 1.35, 2.55), cordGeometry(perimeter, .58, .55, false)];
  const geometry = mergeGeometries(pieces);
  pieces.forEach(piece => piece.dispose());
  const material = new MeshPhysicalMaterial({ color: 0xc5a05b, metalness: .65, roughness: .47, sheen: .24, sheenColor: 0xe5c780, sheenRoughness: .7 });
  bindClothMaterial(material, motion, true);
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);
  return { dispose() { scene.remove(mesh); geometry.dispose(); material.dispose(); } };
}
