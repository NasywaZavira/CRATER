import { describe, expect, it } from 'vitest';
import type { CardDefinition, GameState, MeterEffects } from '../types';
import {
  BALANCE, CARD_LIBRARY, CATEGORY_LABEL, DEFAULT_CONTENT, applyMeterEffects,
  createInitialState, drawHand, formatCardEffect, meterValues, parseSave,
  serializeSave, transition, validateCards, type GameContent,
} from '../logic';

const noDisasters: GameContent = {
  ...DEFAULT_CONTENT, useDonkiArchive: false,
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

describe('80 GDD cards classified by meter and activity', () => {
  it('loads 80 original GDD cards and preserves all six action groups', () => {
    expect(CARD_LIBRARY).toHaveLength(80);
    for (const [category, total] of Object.entries({operations:20, research:10, exploration:10, construction:10, upgrade:10, repair:20})) {
      expect(CARD_LIBRARY.filter(card => card.category === category)).toHaveLength(total);
    }
    expect(CARD_LIBRARY.filter(card => card.delayed)).toHaveLength(2);
    expect(CATEGORY_LABEL).toEqual({operations:'DAILY ROUTINE', research:'RESEARCH', exploration:'EXPLORATION', construction:'BUILDING', upgrade:'UPGRADE', repair:'FIX'});
  });

  it('validates complete four-meter data and prevents old-schema cards', () => {
    const data = JSON.parse(JSON.stringify(CARD_LIBRARY)) as CardDefinition[];
    expect(() => validateCards(data)).not.toThrow();
    (data[0].effects as Record<string, number>).water = 1;
    expect(() => validateCards(data)).toThrow(/exactly 4 meter keys/);
  });

  it('preserves cost-bearing GDD cards but still enforces strict rules on addendum-format cards', () => {
    const data = JSON.parse(JSON.stringify(CARD_LIBRARY)) as CardDefinition[];
    // Original GDD cards can have no negative delta: their separate costs / crew effects were preserved.
    expect(() => validateCards(data)).not.toThrow();
    delete data[0].gddId; // addendum-style card uses stricter validations
    data[0].effects = { lifeSupport: 1, shielding: 1, power: 1, food: 1 };
    expect(() => validateCards(data)).toThrow(/max 3 non-zero/);
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

  it('draws three unique cards from ALL eligible action types in each phase', () => {
    let state = start();
    expect(state.hand).toHaveLength(3);
    expect(state.hand.every(card => card.category === 'operations')).toBe(true);
    expect(new Set(state.hand.map(card => card.id)).size).toBe(3);
    state = next(pass(state));
    expect(state.cycle).toBe('afternoon');
    expect(state.hand.every(card => ['research', 'exploration'].includes(card.category))).toBe(true);
    state = next(pass(state));
    expect(state.cycle).toBe('evening');
    expect(state.hand.every(card => ['construction', 'upgrade'].includes(card.category))).toBe(true);
    state = next(pass(state));
    expect(state.cycle).toBe('night');
    expect(state.hand).toHaveLength(0);
  });

  it('uses meter deltas from JSON without silently applying unrelated GDD metadata', () => {
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
    // Synthetic delayed effect isolates schedule behavior without modifying any GDD card value.
    const solar: CardDefinition = {
      ...CARD_LIBRARY.find(c => c.gddId === 'BL-07')!,
      id: 'test-solar-delayed',
      delayed: { afterSols: 1, effects: {lifeSupport:0, shielding:0, power:20, food:0} },
    };
    state = { ...state, hand: [solar] }; // deterministic focused test
    state = transition(state, { type: 'SELECT_CARD', cardId: solar.id }, noDisasters);
    state = transition(state, { type: 'EXECUTE_CARD' }, noDisasters);
    expect(state.pendingEffects).toMatchObject([{ cardId: solar.id, playedSol: 1, dueSol: 2 }]);
    state = next(state);
    const p = state.meters.power.value;
    state = transition(state, { type: 'END_SOL' }, noDisasters);
    expect(state.sol).toBe(2);
    expect(state.meters.power.value).toBe(Math.max(0, Math.min(100, p + BALANCE.solarRecovery[0] - BALANCE.irrigation.power - BALANCE.passiveDecay.power + 20))); // night adjustment before delayed effect
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

  it('does not reward repeatedly skipping cards and ends by Sol 8', () => {
    let state = start();
    for (let step = 0; step < 40 && state.phase === 'playing'; step++) {
      if (state.phaseState === 'selecting') state = pass(state);
      else if (state.phaseState === 'resolved') state = next(state);
      else if (state.phaseState === 'night') state = transition(state, { type: 'END_SOL' }, noDisasters);
    }
    expect(state.phase).toBe('ended');
    expect(state.outcome?.status).toBe('lost');
    expect(state.sol).toBeLessThanOrEqual(8);
    expect(state.solReports.length).toBeLessThanOrEqual(8);
  });
});
