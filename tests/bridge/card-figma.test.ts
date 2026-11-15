import { describe, expect, it } from 'vitest';
import { CARD_LIBRARY } from '../../engine/data/cards';
import { drawHand } from '../../engine/logic/draw';
import { cardVisualResource } from '../../src/cards/card-visual';
import type { ResourceKey } from '../../engine/types';

const RESOURCES: readonly ResourceKey[] = ['lifeSupport', 'shielding', 'power', 'food'];

describe('Figma card artwork + random engine JSON', () => {
  it('uses the 80-card GDD catalog (all six categories) as the active deck', () => {
    expect(CARD_LIBRARY).toHaveLength(80);
    for (const [category, total] of Object.entries({operations:20, research:10, exploration:10, construction:10, upgrade:10, repair:20})) {
      expect(CARD_LIBRARY.filter(card => card.category === category)).toHaveLength(total);
    }
  });
  it('chooses a context-aware icon for Shielding -> Upgrade and crew-care cards', () => {
    const shieldUpgrade = CARD_LIBRARY.find(card => card.gddId === 'UP-06');
    const exercise = CARD_LIBRARY.find(card => card.gddId === 'DR-01');
    expect(shieldUpgrade?.primaryMeter).toBe('shielding');
    expect(cardVisualResource(shieldUpgrade!)).toBe('shielding');
    expect(cardVisualResource(exercise!)).toBe('lifeSupport'); // exercise has only Power -3 immediate
  });
  it('always uses one of four icon resources', () => {
    for (const card of CARD_LIBRARY) {
      expect(RESOURCES).toContain(cardVisualResource(card));
    }
  });
  it('draws three different source cards deterministically per seed', () => {
    const a = drawHand({ cards: CARD_LIBRARY, cycle: 'morning', handSize: 3, rngState: 20240511 });
    const b = drawHand({ cards: CARD_LIBRARY, cycle: 'morning', handSize: 3, rngState: 20240511 });
    expect(a.hand.map(card => card.id)).toEqual(b.hand.map(card => card.id));
    expect(new Set(a.hand.map(card => card.id)).size).toBe(3);
  });
});
