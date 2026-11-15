import { describe, expect, it } from 'vitest';
import { BALANCE, DEFAULT_CONTENT, createInitialState, transition, resolveOutcome } from '../logic';
import { METER_FAILURE_THRESHOLD } from '../data/balance';
import type { ResourceKey } from '../types';

const controlled = {
  ...DEFAULT_CONTENT, useDonkiArchive: false,
  balance: { ...BALANCE, disasterChances: { morning: 0, afternoon: 0, evening: 0, night: 0 } },
};
const start = () => transition(createInitialState(controlled), { type: 'START', seed: 24 }, controlled);
const keys: ResourceKey[] = ['lifeSupport', 'shielding', 'power', 'food'];

function withValue(key: ResourceKey, value: number) {
  const state = start();
  return { ...state, meters: { ...state.meters, [key]: { ...state.meters[key], value } } };
}

describe('critical outpost meter thresholds', () => {
  it('uses the same inclusive failure boundary for all four meters', () => {
    for (const key of keys) {
      expect(resolveOutcome(withValue(key, METER_FAILURE_THRESHOLD + 1))).toBeNull();
      const outcome = resolveOutcome(withValue(key, METER_FAILURE_THRESHOLD));
      expect(outcome?.status).toBe('lost');
      if (outcome?.status === 'lost') expect(outcome.meters).toContain(key);
    }
  });
  it('ends the game immediately when a skipped choice crosses the boundary', () => {
    const before = withValue('power', METER_FAILURE_THRESHOLD + 5);
    const after = transition(before, { type: 'REJECT_CARD' }, controlled);
    expect(after.phase).toBe('ended');
    expect(after.meters.power.value).toBe(METER_FAILURE_THRESHOLD + 5 + BALANCE.skipPenalty.power);
    if (after.outcome?.status === 'lost') expect(after.outcome.meters).toContain('power');
    expect(transition(after, { type: 'ADVANCE_CYCLE' }, controlled)).toEqual(after);
  });
  it('uses the same successful ending for all meters above the failure limit', () => {
    const game = start();
    const withScore = (value: number) => ({
      ...game, sol: BALANCE.maxSols,
      meters: Object.fromEntries(keys.map(k => [k, { ...game.meters[k], value }])) as typeof game.meters,
    });
    for (const value of [41, 55, 70]) {
      expect(resolveOutcome(withScore(value), true)).toEqual({
        status: 'won', sol: BALANCE.maxSols,
        meters: Object.fromEntries(keys.map(k => [k, value])),
      });
    }
  });
  it('applies higher penalties to both normal skip and repair skip', () => {
    expect(keys.every(k => BALANCE.skipPenalty[k] <= -8)).toBe(true);
    expect(keys.every(k => BALANCE.skipRepairPenalty[k] <= -10)).toBe(true);
  });
  it('ends immediately after overnight resource decay reaches 40', () => {
    const game = start();
    const night = {
      ...game, cycle: 'night' as const, phaseState: 'night' as const,
      meters: { ...game.meters, lifeSupport: { ...game.meters.lifeSupport, value: 44 } },
    };
    const ended = transition(night, { type: 'END_SOL' }, controlled);
    expect(ended.phase).toBe('ended');
    if (ended.outcome?.status === 'lost') expect(ended.outcome.meters).toContain('lifeSupport');
  });
  it('ends immediately when delayed effects push a meter through 40', () => {
    const game = start();
    const night = {
      ...game, cycle: 'night' as const, phaseState: 'night' as const,
      meters: { ...game.meters, shielding: { ...game.meters.shielding, value: 50 } },
      pendingEffects: [{
        cardId: game.hand[0].id, playedSol: 1, dueSol: 2,
        effects: { lifeSupport: 0, shielding: -11, power: 0, food: 0 },
      }],
    };
    const ended = transition(night, { type: 'END_SOL' }, controlled);
    expect(ended.phase).toBe('ended');
    if (ended.outcome?.status === 'lost') expect(ended.outcome.meters).toContain('shielding');
  });
  it('ends immediately on the historical solar event when shielding falls to 40 or below', () => {
    const game = start();
    const archived = {
      ...game, sol: 3, cycle: 'morning' as const, phaseState: 'resolved' as const,
      meters: { ...game.meters, shielding: { ...game.meters.shielding, value: 50 } },
    };
    const ended = transition(archived, { type: 'ADVANCE_CYCLE' }, {
      ...controlled, useDonkiArchive: true,
    });
    expect(ended.phase).toBe('ended');
    if (ended.outcome?.status === 'lost') expect(ended.outcome.meters).toContain('shielding');
  });
  it('immediately ends loaded games with already-critical meters', () => {
    const oldSave = withValue('shielding', 39);
    const after = transition(start(), { type: 'LOAD_STATE', state: oldSave }, controlled);
    expect(after.outcome?.status).toBe('lost');
    if (after.outcome?.status === 'lost') expect(after.outcome.meters).toContain('shielding');
  });
});
