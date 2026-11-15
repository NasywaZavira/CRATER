import { describe, expect, it } from 'vitest';
import { shouldShowCrew } from '../../src/phaser/crew-visibility';
import { deriveSceneSnapshot } from '../../src/bridge/scene-snapshot';

it('menampilkan astronaut yang tersedia dan menghilangkan yang sedang bekerja', () => {
  expect(shouldShowCrew({ available: true })).toBe(true);
  expect(shouldShowCrew({ available: false })).toBe(false);
});

describe('snapshot untuk scene yang dihubungkan ke engine', () => {
  it('meneruskan status kerja dari engine tanpa mengubah sumber', () => {
    const state = {
      sol: 1,
      cycle: 'morning' as const,
      cosmonauts: [
        { id: 'toria', name: 'Toria', role: 'engineer' as const, available: false },
        { id: 'cirra', name: 'Cirra', role: 'engineer' as const, available: true },
      ],
    };
    const result = deriveSceneSnapshot(state);
    expect(result.crew[0].available).toBe(false);
    expect(result.crew[1].available).toBe(true);
    expect(state.cosmonauts[0].available).toBe(false);
  });
});
