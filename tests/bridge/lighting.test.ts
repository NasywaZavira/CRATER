import { describe, expect, it } from 'vitest';
import { LIGHTING } from '../../src/phaser/lighting';

describe('lighting presets', () => {
  it('morning, afternoon, night tampil berbeda', () => {
    const keys = (['morning', 'afternoon', 'night'] as const).map(
      (t) => `${LIGHTING[t].color}-${LIGHTING[t].alpha}`,
    );
    expect(new Set(keys).size).toBe(3);
  });

  it('night paling gelap', () => {
    expect(LIGHTING.night.alpha).toBeGreaterThan(LIGHTING.morning.alpha);
    expect(LIGHTING.night.alpha).toBeGreaterThan(LIGHTING.afternoon.alpha);
  });
});
