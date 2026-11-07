import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TasselSimulation, HemFringeSimulation } from '../src/imperial-tassel-physics.js';
import { createClothAnchor } from '../src/imperial-cloth-motion.js';
import { BANNER, clothCoordinates, fringeRoots } from '../src/imperial-banner-shape.js';
import { cordGeometry } from '../src/imperial-gold-trim.js';

const movingAnchor = seed => createClothAnchor({ width: BANNER.width, height: BANNER.height, ...clothCoordinates([BANNER.right - 1, BANNER.bottom]), phase: seed, speed: 1.1 });

test('cloth stays pinned beneath the fixed rod despite the taller suspension area', () => {
  for (const x of [BANNER.left, BANNER.center, BANNER.right]) {
    const local = clothCoordinates([x, BANNER.top]);
    const anchor = createClothAnchor({ height: BANNER.height, ...local, phase: 2.5, speed: 1.4 });
    for (const time of [0, 5, 20, 100]) {
      const result = anchor(time, new Float64Array(3));
      assert.ok(result[0] === local.x && result[1] === local.y && result[2] === 0);
    }
  }
});

test('gold cord has finite outward-facing normals and actual raised geometry', () => {
  const geometry = cordGeometry([['M', 30, 200], ['L', 90, 200]], .8, 1, false);
  const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
  let frontVertices = 0;
  for (let i = 0; i < positions.count; i++) {
    assert.ok(Number.isFinite(normals.getX(i)) && Number.isFinite(normals.getY(i)) && Number.isFinite(normals.getZ(i)));
    if (positions.getZ(i) > 1.45) {
      assert.ok(normals.getZ(i) > .6, 'front-facing bullion remains lit from the front');
      frontVertices++;
    }
  }
  assert.ok(frontVertices > 10);
  geometry.dispose();
});

test('fixed time steps give the same motion at 30 and 60 fps', () => {
  const a = new TasselSimulation(movingAnchor(1.8), 1.8);
  const b = new TasselSimulation(movingAnchor(1.8), 1.8);
  for (let i = 0; i < 600; i++) a.advance(1 / 60);
  for (let i = 0; i < 300; i++) b.advance(1 / 30);
  assert.equal(a.time, b.time);
  a.strands.forEach((strand, i) => assert.deepEqual(strand.positions, b.strands[i].positions));
});

test('the moving cloth anchor stays pinned and thread lengths remain stable', () => {
  const simulation = new TasselSimulation(movingAnchor(2.3), 2.3);
  const anchor = new Float64Array(3);
  for (let frame = 0; frame < 1800; frame++) {
    simulation.advance(1 / 30);
    simulation.sampleAnchor(simulation.time, anchor);
    assert.deepEqual(simulation.spine.positions.subarray(0, 3), anchor);
    for (const body of [simulation.spine, ...simulation.strands]) {
      const p = body.positions;
      assert.ok(p.every(Number.isFinite));
      for (let n = 1; n < p.length / 3; n++) {
        const length = Math.hypot(p[n * 3] - p[n * 3 - 3], p[n * 3 + 1] - p[n * 3 - 2], p[n * 3 + 2] - p[n * 3 - 1]);
        assert.ok(Math.abs(length / body.lengths[n - 1] - 1) < .02, 'constraint stretch stays below 2%');
      }
    }
  }
});

test('loose ends lag behind a moved anchor and settle after it stops', () => {
  const simulation = new TasselSimulation((time, p) => {
    p[0] = time < 1 ? 3 * Math.sin(time * Math.PI) : 0;
    p[1] = p[2] = 0;
  });
  for (let i = 0; i < 61; i++) simulation.advance(1 / 60, 0);
  const strand = simulation.strands[0];
  assert.ok(Math.abs(strand.positions.at(-3) - strand.offset[0]) > .2, 'the tip retains inertia');
  for (let i = 61; i < 1200; i++) simulation.advance(1 / 60, 0);
  assert.ok(Math.abs(strand.positions.at(-3) - strand.offset[0]) < .1, 'damping brings the strand back to rest');
  const frozen = strand.positions.slice();
  simulation.advance(0);
  assert.deepEqual(strand.positions, frozen);
});

test('short fringe stays sewn to the moving diagonal hems without stretching', () => {
  const samples = fringeRoots.map(point => createClothAnchor({ width: BANNER.width, height: BANNER.height, ...clothCoordinates(point), phase: 2.4, speed: 1.2 }));
  const fringe = new HemFringeSimulation(samples, 2.4);
  const expected = new Float64Array(3);
  for (let frame = 0; frame < 900; frame++) {
    fringe.advance(1 / 30);
    for (const strand of fringe.strands) {
      const p = strand.positions;
      strand.sample(fringe.time, expected);
      assert.deepEqual(p.subarray(0, 3), expected);
      assert.ok(p.every(Number.isFinite));
      for (let n = 1; n <= 3; n++) {
        const length = Math.hypot(p[n * 3] - p[n * 3 - 3], p[n * 3 + 1] - p[n * 3 - 2], p[n * 3 + 2] - p[n * 3 - 1]);
        assert.ok(Math.abs(length / strand.lengths[n - 1] - 1) < .02);
      }
    }
  }
  const frozen = fringe.strands.map(strand => strand.positions.slice());
  fringe.advance(0);
  fringe.strands.forEach((strand, i) => assert.deepEqual(strand.positions, frozen[i]));
});
