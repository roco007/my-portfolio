/* ═══════════════════════════════════════════════════════════════════════════
   Deterministic PRNG (mulberry32) so star/planet distributions are stable and
   reproducible across frames and resizes — no shimmering "re-roll" artifacts.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Create a seeded pseudo-random number generator returning [0, 1). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random float in [min, max) using the supplied generator. */
export function randRange(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

/** Random integer in [min, max] inclusive using the supplied generator. */
export function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(min + rand() * (max - min + 1));
}

/** Pick a random element from an array. */
export function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length) % arr.length];
}

/** Approximate gaussian (Box–Muller) centered on 0 with stddev 1. */
export function gaussian(rand: () => number): number {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
