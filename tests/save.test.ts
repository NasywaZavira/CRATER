import { describe, expect, it } from 'vitest';
import type { GameAction, GameState } from '../types';
import {
  createInitialState,
  createLocalStorageSaveStorage,
  createMemorySaveStorage,
  DEFAULT_CONTENT,
  parseSave,
  resolveOutcome,
  serializeSave,
  transition,
  type GameContent,
} from '../logic';
import v2Save from './fixtures/save.v2.json';

const SAVED_AT = '2026-01-01T00:00:00.000Z';

const SAFE_CONTENT: GameContent = {
  ...DEFAULT_CONTENT,
  balance: {
    ...DEFAULT_CONTENT.balance,
    disasterChances: {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    },
  },
};

function start(seed = 1234, content: GameContent = DEFAULT_CONTENT): GameState {
  return transition(
    createInitialState(content),
    { type: 'START', seed },
    content,
  );
}

function pickMorning(state: GameState, content: GameContent): GameState {
  let next = state;
  for (let group = 0; group < content.balance.dailyGroups; group += 1) {
    next = transition(
      next,
      {
        type: 'SELECT_DAILY',
        groupIndex: group,
        cardId: next.morningGroups[group][0].id,
      },
      content,
    );
  }
  return next;
}

function toAfternoon(
  state: GameState,
  content: GameContent,
): GameState {
  return transition(
    pickMorning(state, content),
    { type: 'CONFIRM_MORNING' },
    content,
  );
}

function toNight(state: GameState, content: GameContent): GameState {
  let next = toAfternoon(state, content);

  for (let phase = 0; phase < 2; phase += 1) {
    const card = next.hand[0];
    next = transition(next, { type: 'SELECT_CARD', cardId: card.id }, content);
    next = transition(next, { type: 'REJECT_CARD' }, content);
    next = transition(next, { type: 'ADVANCE_CYCLE' }, content);
  }

  return next;
}

function roundTrip(state: GameState): GameState {
  const json = serializeSave(state, SAVED_AT);
  const parsed = parseSave(json);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.state;
}

function saveError(json: string): string | undefined {
  const parsed = parseSave(json);
  return parsed.ok ? undefined : parsed.error;
}

describe('save schema v3', () => {
  it('round-trips the initial playing state', () => {
    const state = start(1234, SAFE_CONTENT);
    expect(roundTrip(state)).toEqual(state);
  });

  it('round-trips a mid-morning state', () => {
    const state = transition(
      start(1234, SAFE_CONTENT),
      {
        type: 'SELECT_DAILY',
        groupIndex: 0,
        cardId: start(1234, SAFE_CONTENT).morningGroups[0][0].id,
      },
      SAFE_CONTENT,
    );
    expect(roundTrip(state)).toEqual(state);
  });

  it('round-trips a mid-mission state', () => {
    const state = toAfternoon(start(1234, SAFE_CONTENT), SAFE_CONTENT);
    const card = state.hand[0];
    const crew = state.cosmonauts.find(crewMember => crewMember.available)!;

    let next = transition(
      state,
      { type: 'SELECT_CARD', cardId: card.id },
      SAFE_CONTENT,
    );
    next = transition(
      next,
      { type: 'ASSIGN', cosmonautId: crew.id },
      SAFE_CONTENT,
    );
    next = transition(next, { type: 'EXECUTE_CARD' }, SAFE_CONTENT);

    expect(roundTrip(next)).toEqual(next);
  });

  it('round-trips a mid-repair state', () => {
    const content: GameContent = {
      ...DEFAULT_CONTENT,
      balance: {
        ...DEFAULT_CONTENT.balance,
        disasterChances: {
          morning: 0,
          afternoon: 1,
          evening: 0,
          night: 0,
        },
      },
    };

    const state = toAfternoon(start(42, content), content);
    expect(state.phaseState).toBe('repair');
    expect(roundTrip(state)).toEqual(state);
  });

  it('round-trips a night state', () => {
    const state = toNight(start(1234, SAFE_CONTENT), SAFE_CONTENT);
    expect(state.cycle).toBe('night');
    expect(roundTrip(state)).toEqual(state);
  });

  it('round-trips Command Hand, active buffs, and Sol reports', () => {
    const afternoon = toAfternoon(start(1234, SAFE_CONTENT), SAFE_CONTENT);
    const withNewFields: GameState = {
      ...afternoon,
      commandHand: [{ cardId: 'DR-01', remainingSols: 2 }],
      activeBuffs: [
        {
          id: 'save-buff',
          cardId: 'DR-01',
          kind: 'next-physical-bonus',
          value: 1,
          expiresAfterSol: 2,
        },
      ],
    };
    expect(roundTrip(withNewFields)).toEqual(withNewFields);

    const night = toNight(start(1234, SAFE_CONTENT), SAFE_CONTENT);
    const afterSol = transition(night, { type: 'END_SOL' }, SAFE_CONTENT);
    expect(afterSol.solReports).toHaveLength(1);
    expect(roundTrip(afterSol)).toEqual(afterSol);
  });

  it('round-trips an ended win and an ended loss', () => {
    const base = start(1234, SAFE_CONTENT);
    const wonOutcome = resolveOutcome(
      {
        meters: base.meters,
        rations: { food: 10, water: 10 },
        cosmonauts: base.cosmonauts,
        sol: 8,
      },
      8,
    )!;
    const won: GameState = {
      ...base,
      sol: 8,
      cycle: 'night',
      phaseState: 'night',
      phase: 'ended',
      outcome: wonOutcome,
    };

    expect(roundTrip(won)).toEqual(won);

    const lostOutcome = resolveOutcome(
      {
        meters: {
          ...base.meters,
          power: { ...base.meters.power, value: 0 },
        },
        rations: base.rations,
        cosmonauts: base.cosmonauts,
        sol: 3,
      },
      8,
    )!;
    const lost: GameState = {
      ...base,
      sol: 3,
      cycle: 'night',
      phaseState: 'night',
      phase: 'ended',
      meters: {
        ...base.meters,
        power: { ...base.meters.power, value: 0 },
      },
      outcome: lostOutcome,
    };

    expect(roundTrip(lost)).toEqual(lost);
  });

  it('keeps determinism after save/load', () => {
    const actions: GameAction[] = [];
    let first = start(20251114, SAFE_CONTENT);

    const picked = pickMorning(first, SAFE_CONTENT);
    for (let group = 0; group < SAFE_CONTENT.balance.dailyGroups; group += 1) {
      actions.push({
        type: 'SELECT_DAILY',
        groupIndex: group,
        cardId: picked.morningGroups[group][0].id,
      });
    }
    actions.push({ type: 'CONFIRM_MORNING' });
    actions.push({ type: 'SELECT_CARD', cardId: '' });

    let replayed = roundTrip(first);
    for (const action of actions) {
      if (action.type === 'SELECT_CARD' && action.cardId === '') continue;
      first = transition(first, action, SAFE_CONTENT);
      replayed = transition(replayed, action, SAFE_CONTENT);
    }

    expect(replayed).toEqual(first);
  });

  it('returns structured errors without throwing', () => {
    const state = toAfternoon(start(1234, SAFE_CONTENT), SAFE_CONTENT);
    const good = JSON.parse(serializeSave(state, SAVED_AT)) as Record<
      string,
      unknown
    >;

    expect(saveError('{')).toBe('not-json');
    expect(saveError(JSON.stringify({ format: 'wrong' }))).toBe(
      'wrong-format',
    );
    expect(
      saveError(JSON.stringify({ ...good, schemaVersion: 99 })),
    ).toBe('too-new');

    const unknown = structuredClone(good);
    (unknown.state as Record<string, unknown>).hand = ['NOPE'];
    expect(saveError(JSON.stringify(unknown))).toBe('unknown-card');

    const highMeter = structuredClone(good);
    const highState = highMeter.state as Record<string, unknown>;
    highState.meters = {
      ...(highState.meters as Record<string, unknown>),
      power: { id: 'power', label: 'Power', value: 101, min: 0, max: 100 },
    };
    expect(saveError(JSON.stringify(highMeter))).toBe('invalid-shape');

    const missingCrew = structuredClone(good);
    const missingState = missingCrew.state as Record<string, unknown>;
    const crew = missingState.cosmonauts as unknown[];
    crew.pop();
    expect(saveError(JSON.stringify(missingCrew))).toBe('invalid-shape');
  });

  it('provides memory and local storage adapters', () => {
    const memory = createMemorySaveStorage();
    expect(memory.load()).toBeNull();
    memory.save('{"ok":true}');
    expect(memory.load()).toBe('{"ok":true}');
    memory.clear();
    expect(memory.load()).toBeNull();

    const local = createLocalStorageSaveStorage('test:key');
    expect(() => local.load()).not.toThrow();
    expect(() => local.save('x')).not.toThrow();
    expect(() => local.clear()).not.toThrow();
  });

  it('migrates a v2 save to v3', () => {
    const parsed = parseSave(JSON.stringify(v2Save));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.migratedFrom).toBe(2);
    expect(parsed.state.schemaVersion).toBe(3);
    expect(parsed.state.commandHand).toEqual([]);
    expect(parsed.state.activeBuffs).toEqual([]);
    expect(parsed.state.activeMissions).toEqual([]);
    expect(parsed.state.solReports).toEqual([]);
  });
});
