import { describe, expect, it } from 'vitest';
import { BALANCE, CARD_LIBRARY, DEFAULT_CONTENT, createInitialState, transition, validateBalance } from '../logic';

const withoutRandom = {
  ...DEFAULT_CONTENT,
  balance: { ...BALANCE, skipPenalty: { lifeSupport: -1, shielding: -1, power: -1, food: -1 },
    skipRepairPenalty: { lifeSupport: -1, shielding: -1, power: -1, food: -1 },
    disasterChances: { morning: 0, afternoon: 0, evening: 0, night: 0 } },
};

describe('Addendum priority fixes', () => {
  it('rejects bad new-schema balance fields and accepts the default config', () => {
    expect(() => validateBalance(BALANCE)).not.toThrow();
    expect(() => validateBalance({ ...BALANCE, phaseCardCount: 0 })).toThrow(/phaseCardCount/);
    expect(() => validateBalance({ ...BALANCE, skipPenalty: { ...BALANCE.skipPenalty, power: 10 } })).toThrow(/skipPenalty/);
  });
  it('has 80 GDD source URLs with no placeholders', () => {
    expect(CARD_LIBRARY).toHaveLength(80);
    expect(CARD_LIBRARY.every(card => /^https:\/\//.test(card.fact.sourceUrl ?? ''))).toBe(true);
  });
  it('replays a historical DONKI SEP event at Sol 3 afternoon', () => {
    let game = transition(createInitialState(withoutRandom), { type: 'START', seed: 20240511 }, withoutRandom);
    for (let i = 0; i < 40 && !(game.sol === 3 && game.cycle === 'afternoon'); i++) {
      if (game.phaseState === 'selecting') game = transition(game, { type: 'REJECT_CARD' }, withoutRandom);
      else if (game.phaseState === 'resolved') game = transition(game, { type: 'ADVANCE_CYCLE' }, withoutRandom);
      else if (game.phaseState === 'repair') game = transition(game, { type: 'SKIP_REPAIR' }, withoutRandom);
      else if (game.phaseState === 'night') game = transition(game, { type: 'END_SOL' }, withoutRandom);
    }
    expect(game.sol).toBe(3);
    expect(game.cycle).toBe('afternoon');
    expect(game.phaseState).toBe('repair');
    expect(game.activeDisaster?.id).toBe('solarParticle');
  });
});
