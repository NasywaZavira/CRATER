import { describe, it, expect } from 'vitest';
import { CARD_LIBRARY, CARD_CATEGORIES, RESOURCE_KEYS, validateCards } from '../data/cards';
import { GROUPED_CARDS_BY_METER, getCardsByMeterAndCategory } from '../logic/cardGrouping';
import { drawHand } from '../logic/draw';

const METERS = ['lifeSupport', 'shielding', 'power', 'food'] as const;

describe('GDD card meter -> activity taxonomy', () => {
  it('classifies 80 unique cards into exactly one primary meter and one GDD category', () => {
    expect(() => validateCards(CARD_LIBRARY)).not.toThrow();
    expect(CARD_LIBRARY).toHaveLength(80);
    expect(new Set(CARD_LIBRARY.map(c => c.id)).size).toBe(80);
    expect(CARD_LIBRARY.map(c => c.primaryMeter).filter(m => m === 'shielding')).toHaveLength(15);
    expect(CARD_LIBRARY.map(c => c.primaryMeter).filter(m => m === 'lifeSupport')).toHaveLength(32);
    expect(CARD_LIBRARY.map(c => c.primaryMeter).filter(m => m === 'power')).toHaveLength(17);
    expect(CARD_LIBRARY.map(c => c.primaryMeter).filter(m => m === 'food')).toHaveLength(16);
    expect(CARD_LIBRARY.every(c => RESOURCE_KEYS.includes(c.primaryMeter))).toBe(true);
  });
  it('groups cards by meter and category, with no duplicates or omissions', () => {
    const grouped = METERS.flatMap(meter => CARD_CATEGORIES.flatMap(category => {
      const expected = getCardsByMeterAndCategory(meter, category);
      expect(GROUPED_CARDS_BY_METER[meter][category]).toEqual(expected);
      return expected;
    }));
    expect(new Set(grouped.map(card => card.id)).size).toBe(80);
    expect(grouped).toHaveLength(80);
  });
  it('uses semantic groups, not simply the largest numeric increase', () => {
    expect(getCardsByMeterAndCategory('shielding', 'upgrade').some(c => c.gddId === 'UP-06')).toBe(true);
    expect(getCardsByMeterAndCategory('shielding', 'research').some(c => c.gddId === 'RS-03')).toBe(true);
    expect(getCardsByMeterAndCategory('lifeSupport', 'operations').some(c => c.gddId === 'DR-01')).toBe(true);
  });
  it('allows exploration during afternoon and upgrade during evening across seeds', () => {
    const afternoon = new Set<string>(); const evening = new Set<string>();
    for (let seed = 1; seed < 50; seed++) {
      for (const card of drawHand({cards:CARD_LIBRARY, cycle:'afternoon',handSize:3,rngState:seed}).hand) afternoon.add(card.category);
      for (const card of drawHand({cards:CARD_LIBRARY, cycle:'evening',handSize:3,rngState:seed}).hand) evening.add(card.category);
    }
    expect(afternoon).toEqual(new Set(['research','exploration']));
    expect(evening).toEqual(new Set(['construction','upgrade']));
  });
});
