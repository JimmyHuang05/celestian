// Fixed-step position-based strands. Only the first point of each chain is pinned.
export const TASSEL_STEP = 1 / 90;
const SPINE_LENGTHS = [1.65, 1.65, 1.7, 1.65];

function chain(origin, lengths, spread = [0, 0]) {
  const positions = new Float64Array((lengths.length + 1) * 3);
  let distance = 0;
  for (let i = 0; i <= lengths.length; i++) {
    if (i) distance += lengths[i - 1];
    positions.set([origin[0] + spread[0] * i / lengths.length, origin[1] - distance, origin[2] + spread[1] * i / lengths.length], i * 3);
  }
  return { positions, previous: positions.slice(), lengths };
}

function integrate(body, dt, windX, windZ, damping) {
  const p = body.positions, old = body.previous;
  for (let i = 3; i < p.length; i += 3) {
    const x = p[i], y = p[i + 1], z = p[i + 2];
    p[i] += (x - old[i]) * damping + windX * dt * dt;
    p[i + 1] += (y - old[i + 1]) * damping - 115 * dt * dt;
    p[i + 2] += (z - old[i + 2]) * damping + windZ * dt * dt;
    old[i] = x; old[i + 1] = y; old[i + 2] = z;
  }
}

function constrain(body, stiffness = 1, stride = 1) {
  const p = body.positions;
  for (let node = stride; node < p.length / 3; node++) {
    const a = (node - stride) * 3, b = node * 3;
    let length = 0;
    for (let j = node - stride; j < node; j++) length += body.lengths[j];
    const dx = p[b] - p[a], dy = p[b + 1] - p[a + 1], dz = p[b + 2] - p[a + 2];
    const current = Math.hypot(dx, dy, dz) || 1;
    const correction = (current - length) / current * stiffness;
    const free = a === 0 ? 0 : .5;
    p[a] += dx * correction * free;
    p[a + 1] += dy * correction * free;
    p[a + 2] += dz * correction * free;
    p[b] -= dx * correction * (1 - free);
    p[b + 1] -= dy * correction * (1 - free);
    p[b + 2] -= dz * correction * (1 - free);
  }
}

export class TasselSimulation {
  constructor(sampleAnchor, seed = 0, count = 40) {
    this.sampleAnchor = sampleAnchor;
    this.seed = seed;
    this.time = 0;
    this.accumulator = 0;
    this.anchor = new Float64Array(3);
    sampleAnchor(0, this.anchor);
    this.spine = chain(this.anchor, SPINE_LENGTHS);
    this.axis = [0, -1, 0];
    this.right = [1, 0, 0];
    this.front = [0, 0, 1];
    const neck = this.spine.positions.subarray(12, 15);
    this.strands = Array.from({ length: count }, (_, i) => {
      const angle = i * 2.39996323 + seed;
      const radius = 2.05 * Math.sqrt((i + .5) / count);
      const offset = [Math.cos(angle) * radius, Math.sin(angle) * radius];
      const length = 15.1 + 2.5 * (.5 + .5 * Math.sin(i * 13.17 + seed));
      const origin = [neck[0] + offset[0], neck[1], neck[2] + offset[1]];
      return { ...chain(origin, Array(8).fill(length / 8), offset.map(n => n * .3)), offset, radius: .15 + .05 * (i % 4) / 3 };
    });
  }

  pinStrands() {
    const p = this.spine.positions;
    const dx = p[12] - p[6], dy = p[13] - p[7], dz = p[14] - p[8];
    const length = Math.hypot(dx, dy, dz) || 1;
    this.axis = [dx / length, dy / length, dz / length];
    const flat = Math.hypot(dx, dy) || 1;
    this.right = [-dy / flat, dx / flat, 0];
    const [ax, ay, az] = this.axis, [rx, ry] = this.right;
    this.front = [-az * ry, az * rx, ax * ry - ay * rx];
    for (const strand of this.strands) {
      for (let c = 0; c < 3; c++) strand.positions[c] = p[12 + c] + this.right[c] * strand.offset[0] + this.front[c] * strand.offset[1];
    }
  }

  step(dt, wind = 1) {
    this.time += dt;
    this.sampleAnchor(this.time, this.anchor);
    const breeze = (8 * Math.sin(this.time * 1.35 + this.seed) + 3 * Math.sin(this.time * 2.6 + this.seed * 2)) * wind;
    const depth = 4 * Math.cos(this.time * .91 + this.seed) * wind;
    integrate(this.spine, dt, breeze * .55, depth * .45, .987);
    this.spine.positions.set(this.anchor, 0);
    for (let i = 0; i < 9; i++) constrain(this.spine);
    this.pinStrands();
    this.strands.forEach((strand, i) => {
      integrate(strand, dt, breeze + Math.sin(this.time * 2.1 + i * 1.9) * wind * 2.2, depth, .984);
      for (let j = 0; j < 7; j++) {
        // A soft bend constraint gives textile stiffness without forcing a rigid cone.
        constrain(strand, .16, 2);
        constrain(strand);
      }
    });
  }

  advance(delta, wind = 1) {
    this.accumulator += Math.min(Math.max(delta, 0), .1);
    while (this.accumulator >= TASSEL_STEP) {
      this.step(TASSEL_STEP, wind);
      this.accumulator -= TASSEL_STEP;
    }
  }
}

/** Short independent chains sewn into the two sloping edges of each swallowtail. */
export class HemFringeSimulation {
  constructor(samples, seed = 0) {
    this.time = 0;
    this.accumulator = 0;
    this.seed = seed;
    this.strands = samples.map((sample, i) => {
      const anchor = new Float64Array(3);
      sample(0, anchor);
      const length = 7.2 + .6 * Math.sin(i * 2.7);
      return { ...chain(anchor, Array(3).fill(length / 3)), sample, radius: .18 + .04 * (i % 3) / 2 };
    });
  }

  advance(delta) {
    this.accumulator += Math.min(Math.max(delta, 0), .1);
    while (this.accumulator >= TASSEL_STEP) {
      this.time += TASSEL_STEP;
      this.strands.forEach((strand, i) => {
        const wind = 4 * Math.sin(this.time * 1.35 + this.seed) + 1.5 * Math.sin(this.time * 2.1 + i * .31);
        integrate(strand, TASSEL_STEP, wind, 2 * Math.cos(this.time + i * .17), .98);
        strand.sample(this.time, strand.positions);
        for (let j = 0; j < 5; j++) {
          constrain(strand, .22, 2);
          constrain(strand);
        }
      });
      this.accumulator -= TASSEL_STEP;
    }
  }
}
