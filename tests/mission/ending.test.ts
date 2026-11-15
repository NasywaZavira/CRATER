import { describe, expect, it } from 'vitest';
import { resolveMissionEnding } from '../../src/mission/ending';
import { FAILURE_LINES, OPENING_LINES, successLines } from '../../src/mission/dialogues';
import { METER_FAILURE_THRESHOLD } from '../../engine/data/balance';

const ok = { lifeSupport: 70, shielding: 65, power: 80, food: 45 };

describe('mission cinematics', () => {
  it('contains the opening and 4 failure / 1 success dialogues', () => {
    expect(OPENING_LINES).toHaveLength(7);
    expect(Object.keys(FAILURE_LINES)).toEqual(['lifeSupport', 'shielding', 'power', 'food']);
    expect(successLines(35)).toHaveLength(7);
    expect(successLines(35)[2]).toContain('35%');
  });

  it('does not invent a success while the game is not finished', () => {
    expect(resolveMissionEnding({ sol: 8, ended: false, meters: ok })).toBeNull();
    expect(resolveMissionEnding({ sol: 7, ended: true, meters: ok })).toBeNull();
  });

  it('chooses the correct failure at exactly 40 or below for each meter', () => {
    expect(resolveMissionEnding({ sol: 2, ended: false, meters: { ...ok, lifeSupport: 0 } })).toBe('lifeSupport');
    expect(resolveMissionEnding({ sol: 5, ended: false, meters: { ...ok, shielding: -1 } })).toBe('shielding');
    expect(resolveMissionEnding({ sol: 3, ended: true, meters: { ...ok, power: 0 } })).toBe('power');
    expect(resolveMissionEnding({ sol: 8, ended: true, meters: { ...ok, food: 0 } })).toBe('food');
    for (const meter of ['lifeSupport', 'shielding', 'power', 'food'] as const) {
      expect(resolveMissionEnding({ sol: 2, ended: false, meters: { ...ok, [meter]: METER_FAILURE_THRESHOLD } })).toBe(meter);
      expect(resolveMissionEnding({ sol: 2, ended: false, meters: { ...ok, [meter]: METER_FAILURE_THRESHOLD + 1 } })).toBeNull();
    }
  });

  it('chooses success only when sol 8 ends and all meters are above 40', () => {
    expect(resolveMissionEnding({ sol: 8, ended: true, meters: ok })).toBe('success');
  });
});
