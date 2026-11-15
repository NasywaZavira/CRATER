import { describe, expect, it } from 'vitest';
import type { CardDefinition, GameState, MeterEffects } from '../types';
import {
  BALANCE, CARD_LIBRARY, CATEGORY_LABEL, DEFAULT_CONTENT, applyMeterEffects,
  createInitialState, drawHand, formatCardEffect, meterValues, parseSave,
  serializeSave, transition, validateCards, type GameContent,
} from '../logic';

const noDisasters: GameContent = {
  ...DEFAULT_CONTENT,
  balance: { ...BALANCE, disasterChances: { morning: 0, afternoon: 0, evening: 0, night: 0 } },
};
function start(seed = 42, content = noDisasters): GameState {
  return transition(createInitialState(content), { type: 'START', seed }, content);
}
function pass(state: GameState, content = noDisasters): GameState {
  if (state.phaseState === 'repair') return transition(state, { type: 'SKIP_REPAIR' }, content);
  return transition(state, { type: 'REJECT_CARD' }, content);
}
function next(state: GameState, content = noDisasters): GameState {
  return transition(state, { type: 'ADVANCE_CYCLE' }, content);
}

describe('JSON card addendum v4', () => {
  it('uses exactly the supplied 20 cards across the four new categories', () => {
    expect(CARD_LIBRARY).toHaveLength(20);
    for (const category of ['operations', 'construction', 'repair', 'research']) {
      expect(CARD_LIBRARY.filter(card => card.category === category)).toHaveLength(5);
    }
    expect(CARD_LIBRARY.filter(card => card.delayed)).toHaveLength(4);
    expect(CATEGORY_LABEL).toEqual({ operations: 'DAILY ROUTINE', construction: 'UPGRADE', repair: 'FIX', research: 'RESEARCH' });
  });

  it('validates complete four-meter data and prevents old-schema cards', () => {
    const data = JSON.parse(JSON.stringify(CARD_LIBRARY)) as CardDefinition[];
    expect(() => validateCards(data)).not.toThrow();
    (data[0].effects as Record<string, number>).water = 1;
    expect(() => validateCards(data)).toThrow(/exactly 4 meter keys/);
  });

  it('requires a negative trade-off and max three nonzero instant effects', () => {
    const data = JSON.parse(JSON.stringify(CARD_LIBRARY)) as CardDefinition[];
    data[0].effects = { lifeSupport: 1, shielding: 1, power: 1, food: 1 };
    expect(() => validateCards(data)).toThrow();
    data[0].effects = { lifeSupport: 1, shielding: 0, power: 0, food: 0 };
    expect(() => validateCards(data)).toThrow(/at least one negative/);
  });

  it('represents zero as a dash, while applying zero as no-op', () => {
    expect(formatCardEffect(0)).toBe('—');
    expect(formatCardEffect(10)).toBe('+10');
    expect(formatCardEffect(-5)).toBe('-5');
    const initial = createInitialState(noDisasters).meters;
    const delta: MeterEffects = { lifeSupport: 25, shielding: 0, power: -90, food: 0 };
    const result = applyMeterEffects(initial, delta);
    expect(result.lifeSupport.value).toBe(100);
    expect(result.shielding.value).toBe(80);
    expect(result.power.value).toBe(0);
    expect(initial.power.value).toBe(80); // immutable
  });

  it('draws three unique operations/research/construction in matching phases', () => {
    let state = start();
    expect(state.hand).toHaveLength(3);
    expect(state.hand.every(card => card.category === 'operations')).toBe(true);
    expect(new Set(state.hand.map(card => card.id)).size).toBe(3);
    state = next(pass(state));
    expect(state.cycle).toBe('afternoon');
    expect(state.hand.every(card => card.category === 'research')).toBe(true);
    state = next(pass(state));
    expect(state.cycle).toBe('evening');
    expect(state.hand.every(card => card.category === 'construction')).toBe(true);
    state = next(pass(state));
    expect(state.cycle).toBe('night');
    expect(state.hand).toHaveLength(0);
  });

  it('uses the JSON instantaneous effects exactly, without costs or bonuses', () => {
    let state = start(1);
    const card = state.hand[0];
    const initial = meterValues(state.meters);
    state = transition(state, { type: 'SELECT_CARD', cardId: card.id }, noDisasters);
    state = transition(state, { type: 'EXECUTE_CARD' }, noDisasters);
    expect(state.phaseState).toBe('resolved');
    expect(state.playedCards.at(-1)?.cardId).toBe(card.id);
    for (const key of Object.keys(initial) as (keyof MeterEffects)[]) {
      expect(state.meters[key].value).toBe(Math.min(100, Math.max(0, initial[key] + card.effects[key])));
    }
  });

  it('schedules +20 solar power at next Sol when afterSols=1', () => {
    let state = next(pass(next(pass(start())))); // evening
    const solar = CARD_LIBRARY.find(c => c.id === 'con-solar-array')!;
    state = { ...state, hand: [solar] }; // deterministic focused test
    state = transition(state, { type: 'SELECT_CARD', cardId: solar.id }, noDisasters);
    state = transition(state, { type: 'EXECUTE_CARD' }, noDisasters);
    expect(state.pendingEffects).toMatchObject([{ cardId: solar.id, playedSol: 1, dueSol: 2 }]);
    state = next(state);
    const p = state.meters.power.value;
    state = transition(state, { type: 'END_SOL' }, noDisasters);
    expect(state.sol).toBe(2);
    expect(state.meters.power.value).toBe(Math.min(100, p + 20)); // solar+8, irrigation-5, decay-3
    expect(state.pendingEffects).toHaveLength(0);
    expect(state.solReports[0].delayedCardIds).toContain(solar.id);
  });

  it('offers three generic repair cards during a disaster and applies JSON effects', () => {
    const content = { ...noDisasters, balance: { ...noDisasters.balance, disasterChances: { morning: 0, afternoon: 1, evening: 0, night: 0 } } };
    let state = next(pass(start(1, content), content), content);
    expect(state.phaseState).toBe('repair');
    const choices = state.activeDisaster!.repairChoices;
    expect(choices).toHaveLength(3);
    expect(choices.every(card => card.category === 'repair')).toBe(true);
    const card = choices[0];
    const before = meterValues(state.meters);
    state = transition(state, { type: 'SELECT_REPAIR', cardId: card.id }, content);
    expect(state.phaseState).toBe('resolved');
    expect(state.activeDisaster).toBeNull();
    for (const key of Object.keys(before) as (keyof MeterEffects)[]) {
      expect(state.meters[key].value).toBe(Math.max(0, Math.min(100, before[key] + card.effects[key])));
    }
  });

  it('ends after the eighth Sol for a skip-only game', () => {
    let state = start();
    for (let step = 0; step < 40 && state.phase === 'playing'; step++) {
      if (state.phaseState === 'selecting') state = pass(state);
      else if (state.phaseState === 'resolved') state = next(state);
      else if (state.phaseState === 'night') state = transition(state, { type: 'END_SOL' }, noDisasters);
    }
    expect(state.phase).toBe('ended');
    expect(state.sol).toBe(8);
    expect(state.solReports).toHaveLength(8);
  });
});
