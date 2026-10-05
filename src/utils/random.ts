export type Rng = () => number;

/**
 * Creates a fast 32-bit pseudo-random number generator (Mulberry32).
 * Returns floating-point values in [0, 1).
 */
export function createRng(seed: number): Rng {
  let s = Math.floor(seed) >>> 0;
  return function rng(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded Fisher-Yates shuffle that returns a new array.
 */
export function seededShuffle<T>(array: readonly T[], rng: Rng): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}
