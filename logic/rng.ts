export interface RandomStep {
  rngState: number;
  value: number;
}

export function normalizeSeed(seed: number): number {
  if (typeof seed !== 'number' || !Number.isFinite(seed)) {
    throw new TypeError('Seed must be a finite number.');
  }
  return Math.trunc(seed) >>> 0;
}

/**
 * Mulberry32. State disimpan sebagai uint32 agar JSON-serializable.
 */
export function nextRandom(rngState: number): RandomStep {
  const nextState = (rngState + 0x6d2b79f5) >>> 0;

  let t = nextState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;

  return { rngState: nextState, value };
}
