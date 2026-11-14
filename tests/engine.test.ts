import { describe, expect, it } from 'vitest';
import type { GameAction, GameState } from '../types';
import {
  applyEffects,
  createInitialState,
  CYCLE_CATEGORIES,
  DEFAULT_CONTENT,
  drawHand,
  DrawError,
  evaluateCharacterEffects,
  transition,
  validateBalance,
  type GameContent,
} from '../logic';

function start(
  seed = 1234,
  content: GameContent = DEFAULT_CONTENT,
): GameState {
  return transition(
    createInitialState(content),
    { type: 'START', seed },
    content,
  );
}

function expectUniqueHand(state: GameState): void {
  const ids = state.hand.map(card => card.id);
  expect(new Set(ids).size).toBe(ids.length);
}

function expectHandForCycle(
  state: GameState,
  content: GameContent = DEFAULT_CONTENT,
): void {
  expect(state.hand).toHaveLength(content.balance.handSize[state.cycle]);
  expectUniqueHand(state);

  const allowedCategories = CYCLE_CATEGORIES[state.cycle];

  expect(
    state.hand.every(card => allowedCategories.includes(card.category)),
  ).toBe(true);
  expect(state.hand.every(card => card.cycles.includes(state.cycle))).toBe(
    true,
  );
}

function playOneSol(
  seed: number,
  content: GameContent = DEFAULT_CONTENT,
): GameState {
  let state = start(seed, content);

  expect(state.cycle).toBe('morning');
  expectHandForCycle(state, content);

  // Pagi: pilih 1 kartu, assign minimal 1 cosmonaut, konfirmasi.
  const morningCard = state.hand[0];
  state = transition(
    state,
    { type: 'SELECT_CARD', cardId: morningCard.id },
    content,
  );

  const morningCrew = state.cosmonauts.find(
    cosmonaut => cosmonaut.available && cosmonaut.cooldown === 0,
  );
  if (!morningCrew) {
    throw new Error('Expected an available cosmonaut for morning.');
  }

  state = transition(
    state,
    { type: 'ASSIGN', cosmonautId: morningCrew.id },
    content,
  );
  state = transition(state, { type: 'ADVANCE_CYCLE' }, content);

  expect(state.cycle).toBe('afternoon');
  expectHandForCycle(state, content);
  expect(state.shuffleUsed).toBe(false);

  // Siang: pilih 1 kartu, assign minimal 1 cosmonaut, konfirmasi.
  const afternoonCard = state.hand[0];
  state = transition(
    state,
    { type: 'SELECT_CARD', cardId: afternoonCard.id },
    content,
  );

  const afternoonCrew = state.cosmonauts.find(
    cosmonaut => cosmonaut.available && cosmonaut.cooldown === 0,
  );
  if (!afternoonCrew) {
    throw new Error('Expected an available cosmonaut for afternoon.');
  }

  state = transition(
    state,
    { type: 'ASSIGN', cosmonautId: afternoonCrew.id },
    content,
  );
  state = transition(state, { type: 'ADVANCE_CYCLE' }, content);

  expect(state.cycle).toBe('night');
  expectHandForCycle(state, content);

  // Malam: pilih tepat 1 kartu daily.
  const nightCard = state.hand[0];
  expect(nightCard.category).toBe('daily');
  state = transition(
    state,
    { type: 'SELECT_CARD', cardId: nightCard.id },
    content,
  );

  expect(state.selectedCardIds).toEqual([nightCard.id]);

  state = transition(state, { type: 'END_SOL' }, content);
  return state;
}

function reachNight(
  seed: number,
  content: GameContent = DEFAULT_CONTENT,
): GameState {
  let state = start(seed, content);

  state = transition(
    state,
    { type: 'SELECT_CARD', cardId: state.hand[0].id },
    content,
  );

  const morningCrew = state.cosmonauts.find(
    cosmonaut => cosmonaut.available && cosmonaut.cooldown === 0,
  );
  if (!morningCrew) {
    throw new Error('Expected an available cosmonaut for morning.');
  }

  state = transition(
    state,
    { type: 'ASSIGN', cosmonautId: morningCrew.id },
    content,
  );
  state = transition(state, { type: 'ADVANCE_CYCLE' }, content);

  state = transition(
    state,
    { type: 'SELECT_CARD', cardId: state.hand[0].id },
    content,
  );

  const afternoonCrew = state.cosmonauts.find(
    cosmonaut => cosmonaut.available && cosmonaut.cooldown === 0,
  );
  if (!afternoonCrew) {
    throw new Error('Expected an available cosmonaut for afternoon.');
  }

  state = transition(
    state,
    { type: 'ASSIGN', cosmonautId: afternoonCrew.id },
    content,
  );
  state = transition(state, { type: 'ADVANCE_CYCLE' }, content);

  return state;
}

describe('ENAM engine Day 1', () => {
  it('plays one full sol end-to-end and logs the state', () => {
    const state = playOneSol(20251114);

    expect(state.sol).toBe(2);
    expect(state.cycle).toBe('morning');
    expect(state.phase).toBe('playing');
    expectHandForCycle(state);

    for (const meter of Object.values(state.meters)) {
      expect(meter.value).toBeGreaterThanOrEqual(meter.min);
      expect(meter.value).toBeLessThanOrEqual(meter.max);
    }

    console.log('[ENAM] end of sol 1:', JSON.stringify(state, null, 2));
  });

  it('draws 3 unique cards from the correct categories in every cycle', () => {
    let state = start(21);
    expectHandForCycle(state);

    state = transition(state, {
      type: 'SELECT_CARD',
      cardId: state.hand[0].id,
    });
    state = transition(state, {
      type: 'ASSIGN',
      cosmonautId: state.cosmonauts[0].id,
    });
    state = transition(state, { type: 'ADVANCE_CYCLE' });
    expectHandForCycle(state);

    state = transition(state, {
      type: 'SELECT_CARD',
      cardId: state.hand[0].id,
    });
    state = transition(state, {
      type: 'ASSIGN',
      cosmonautId: state.cosmonauts[1].id,
    });
    state = transition(state, { type: 'ADVANCE_CYCLE' });
    expectHandForCycle(state);
  });

  it('requires exactly one pick in every cycle', () => {
    const fresh = start(31);

    expect(transition(fresh, { type: 'ADVANCE_CYCLE' })).toBe(fresh);

    const morningSelected = transition(fresh, {
      type: 'SELECT_CARD',
      cardId: fresh.hand[0].id,
    });
    const morningOver = {
      ...morningSelected,
      selectedCardIds: [fresh.hand[0].id, fresh.hand[1].id],
    };
    expect(transition(morningOver, { type: 'ADVANCE_CYCLE' })).toBe(
      morningOver,
    );

    let state = transition(morningSelected, {
      type: 'ASSIGN',
      cosmonautId: fresh.cosmonauts[0].id,
    });
    state = transition(state, { type: 'ADVANCE_CYCLE' });

    expect(transition(state, { type: 'ADVANCE_CYCLE' })).toBe(state);

    const afternoonSelected = transition(state, {
      type: 'SELECT_CARD',
      cardId: state.hand[0].id,
    });
    const afternoonOver = {
      ...afternoonSelected,
      selectedCardIds: [state.hand[0].id, state.hand[1].id],
    };
    expect(transition(afternoonOver, { type: 'ADVANCE_CYCLE' })).toBe(
      afternoonOver,
    );

    state = transition(afternoonSelected, {
      type: 'ASSIGN',
      cosmonautId: state.cosmonauts[1].id,
    });
    state = transition(state, { type: 'ADVANCE_CYCLE' });
    expect(state.cycle).toBe('night');

    expect(transition(state, { type: 'END_SOL' })).toBe(state);

    const nightSelected = transition(state, {
      type: 'SELECT_CARD',
      cardId: state.hand[0].id,
    });
    const nightOver = {
      ...nightSelected,
      selectedCardIds: [state.hand[0].id, state.hand[1].id],
    };
    expect(transition(nightOver, { type: 'END_SOL' })).toBe(nightOver);

    const ended = transition(nightSelected, { type: 'END_SOL' });
    expect(ended.sol).toBe(2);
  });

  it('replaces the night pick when selecting a second card', () => {
    const night = reachNight(41);
    expect(night.cycle).toBe('night');
    expect(night.selectedCardIds).toEqual([]);

    const first = night.hand[0];
    const second = night.hand[1];

    const selectedFirst = transition(night, {
      type: 'SELECT_CARD',
      cardId: first.id,
    });
    expect(selectedFirst.selectedCardIds).toEqual([first.id]);

    const selectedSecond = transition(selectedFirst, {
      type: 'SELECT_CARD',
      cardId: second.id,
    });
    expect(selectedSecond.selectedCardIds).toEqual([second.id]);

    expect(
      transition(selectedSecond, {
        type: 'SELECT_CARD',
        cardId: second.id,
      }),
    ).toBe(selectedSecond);
  });

  it('allows a played card to appear again on the next sol', () => {
    const morningCards = DEFAULT_CONTENT.cards
      .filter(
        card =>
          card.category === 'research' || card.category === 'exploration',
      )
      .slice(0, 3);
    const afternoonCards = DEFAULT_CONTENT.cards
      .filter(
        card => card.category === 'build' || card.category === 'upgrade',
      )
      .slice(0, 3);
    const nightCards = DEFAULT_CONTENT.cards
      .filter(card => card.category === 'daily')
      .slice(0, 3);

    const content: GameContent = {
      ...DEFAULT_CONTENT,
      cards: [...morningCards, ...afternoonCards, ...nightCards],
    };

    let state = start(51, content);
    const playedMorningCard = state.hand[0];

    state = transition(
      state,
      { type: 'SELECT_CARD', cardId: playedMorningCard.id },
      content,
    );
    state = transition(
      state,
      { type: 'ASSIGN', cosmonautId: state.cosmonauts[0].id },
      content,
    );
    state = transition(state, { type: 'ADVANCE_CYCLE' }, content);

    state = transition(
      state,
      { type: 'SELECT_CARD', cardId: state.hand[0].id },
      content,
    );
    state = transition(
      state,
      { type: 'ASSIGN', cosmonautId: state.cosmonauts[1].id },
      content,
    );
    state = transition(state, { type: 'ADVANCE_CYCLE' }, content);

    state = transition(
      state,
      { type: 'SELECT_CARD', cardId: state.hand[0].id },
      content,
    );
    state = transition(state, { type: 'END_SOL' }, content);

    expect(state.sol).toBe(2);
    expect(state.cycle).toBe('morning');
    expect(state.cardCooldowns).toEqual({});
    expect(state.hand.map(card => card.id)).toContain(
      playedMorningCard.id,
    );
  });

  it('rejects a balance where requiredPicks exceeds handSize', () => {
    const invalidBalance = {
      ...DEFAULT_CONTENT.balance,
      requiredPicks: {
        ...DEFAULT_CONTENT.balance.requiredPicks,
        night: 4,
      },
    };

    expect(() => validateBalance(invalidBalance)).toThrow(
      'Invalid balance for "night": requiredPicks (4) exceeds handSize (3).',
    );

    const invalidContent: GameContent = {
      ...DEFAULT_CONTENT,
      balance: invalidBalance,
    };

    expect(() => start(1, invalidContent)).toThrow(
      'Invalid balance for "night": requiredPicks (4) exceeds handSize (3).',
    );
  });

  it('rejects a card that is not in hand and actions in the wrong phase', () => {
    const state = start(14);

    expect(
      transition(state, { type: 'SELECT_CARD', cardId: 'not-in-hand' }),
    ).toBe(state);

    expect(transition(state, { type: 'END_SOL' })).toBe(state);

    expect(
      transition(state, {
        type: 'RESOLVE_EVENT',
        eventId: 'event-1',
        optionId: 'option-1',
      }),
    ).toBe(state);

    expect(
      transition(state, {
        type: 'EVENT_TIMEOUT',
        eventId: 'event-1',
      }),
    ).toBe(state);

    expect(transition(state, { type: 'START', seed: 999 })).toBe(state);
  });

  it('requires selection and at least one cosmonaut before advancing', () => {
    const fresh = start(12);

    expect(transition(fresh, { type: 'ADVANCE_CYCLE' })).toBe(fresh);

    const selected = transition(fresh, {
      type: 'SELECT_CARD',
      cardId: fresh.hand[0].id,
    });

    expect(transition(selected, { type: 'ADVANCE_CYCLE' })).toBe(selected);
  });

  it('rejects assigning a cosmonaut that is cooling down', () => {
    let state = start(11);

    state = transition(state, {
      type: 'SELECT_CARD',
      cardId: state.hand[0].id,
    });

    const crew = state.cosmonauts[0];

    state = transition(state, {
      type: 'ASSIGN',
      cosmonautId: crew.id,
    });
    state = transition(state, { type: 'ADVANCE_CYCLE' });

    const afterCooldown = state.cosmonauts.find(
      cosmonaut => cosmonaut.id === crew.id,
    );

    expect(afterCooldown?.available).toBe(false);
    expect(afterCooldown?.cooldown).toBeGreaterThan(0);

    const selected = transition(state, {
      type: 'SELECT_CARD',
      cardId: state.hand[0].id,
    });

    expect(
      transition(selected, {
        type: 'ASSIGN',
        cosmonautId: crew.id,
      }),
    ).toBe(selected);
  });

  it('allows exactly one shuffle per cycle and resets it on advance', () => {
    const fresh = start(15);
    const shuffled = transition(fresh, { type: 'SHUFFLE' });

    expect(shuffled).not.toBe(fresh);
    expect(shuffled.shuffleUsed).toBe(true);
    expectUniqueHand(shuffled);

    expect(transition(shuffled, { type: 'SHUFFLE' })).toBe(shuffled);

    const selected = transition(shuffled, {
      type: 'SELECT_CARD',
      cardId: shuffled.hand[0].id,
    });

    const assigned = transition(selected, {
      type: 'ASSIGN',
      cosmonautId: shuffled.cosmonauts[0].id,
    });

    const advanced = transition(assigned, {
      type: 'ADVANCE_CYCLE',
    });

    expect(advanced.cycle).toBe('afternoon');
    expect(advanced.shuffleUsed).toBe(false);
  });

  it('clamps meters to their min and max', () => {
    const meters = createInitialState().meters;

    const high = applyEffects(meters, [{ meter: 'power', delta: 999 }]);
    const low = applyEffects(meters, [{ meter: 'food', delta: -999 }]);

    expect(high.power.value).toBe(100);
    expect(low.food.value).toBe(0);
  });

  it('applies ration at end of sol and ends the game on depletion', () => {
    const content: GameContent = {
      ...DEFAULT_CONTENT,
      balance: {
        ...DEFAULT_CONTENT.balance,
        rationConsumption: [{ meter: 'food', delta: -999 }],
      },
    };

    const state = playOneSol(16, content);

    expect(state.meters.food.value).toBe(0);
    expect(state.phase).toBe('ended');
    expect(state.outcome).toEqual({
      status: 'lost',
      reason: 'meter-depleted',
      sol: 2,
      meters: ['food'],
    });
  });

  it('draws unique cards deterministically and throws on a short pool', () => {
    const first = drawHand({
      cards: DEFAULT_CONTENT.cards,
      cycle: 'morning',
      handSize: 3,
      rngState: 99,
    });
    const second = drawHand({
      cards: DEFAULT_CONTENT.cards,
      cycle: 'morning',
      handSize: 3,
      rngState: 99,
    });

    expect(second).toEqual(first);
    expect(first.hand).toHaveLength(3);
    expect(new Set(first.hand.map(card => card.id)).size).toBe(3);
    expect(
      first.hand.every(
        card =>
          card.category === 'research' ||
          card.category === 'exploration',
      ),
    ).toBe(true);

    const afternoon = drawHand({
      cards: DEFAULT_CONTENT.cards,
      cycle: 'afternoon',
      handSize: 3,
      rngState: 99,
    });

    expect(
      afternoon.hand.every(
        card => card.category === 'build' || card.category === 'upgrade',
      ),
    ).toBe(true);

    const shortPool = DEFAULT_CONTENT.cards
      .filter(card => card.category === 'daily')
      .slice(0, 2);

    expect(() =>
      drawHand({
        cards: shortPool,
        cycle: 'night',
        handSize: 3,
        rngState: 1,
      }),
    ).toThrow(DrawError);

    expect(() =>
      drawHand({
        cards: shortPool,
        cycle: 'night',
        handSize: 3,
        rngState: 1,
      }),
    ).toThrow(/Cannot draw 3 card/);
  });

  function recordSol(seed: number): {
    actions: GameAction[];
    state: GameState;
  } {
    const actions: GameAction[] = [];
    let state = createInitialState();

    const run = (action: GameAction): void => {
      actions.push(action);
      state = transition(state, action);
    };

    run({ type: 'START', seed });
    run({ type: 'SHUFFLE' });

    run({ type: 'SELECT_CARD', cardId: state.hand[0].id });
    run({ type: 'ASSIGN', cosmonautId: 'toria' });
    run({ type: 'ASSIGN', cosmonautId: 'cirra' });
    run({ type: 'ADVANCE_CYCLE' });

    run({ type: 'SELECT_CARD', cardId: state.hand[0].id });
    run({ type: 'ASSIGN', cosmonautId: 'vega' });
    run({ type: 'ADVANCE_CYCLE' });

    run({ type: 'SELECT_CARD', cardId: state.hand[0].id });
    run({ type: 'END_SOL' });

    return { actions, state };
  }

  it('replays deterministically from seed + data + action order', () => {
    const first = recordSol(777);
    const second = recordSol(777);

    expect(second.actions).toEqual(first.actions);
    expect(second.state).toEqual(first.state);

    let replayed = createInitialState();
    for (const action of first.actions) {
      replayed = transition(replayed, action);
    }

    expect(replayed).toEqual(first.state);
  });

  it('resolves character effects through a pure, testable function', () => {
    const rules = DEFAULT_CONTENT.balance.characterRules;

    const corin = evaluateCharacterEffects(['corin'], 100, rules);
    expect(corin.events.map(event => event.source)).toContain(
      'corinAnxiety',
    );
    expect(corin.effects).toEqual(rules.corinAnxiety.effects);

    const sylvan = evaluateCharacterEffects(['sylvan'], 100, rules);
    expect(sylvan.events.map(event => event.source)).toContain(
      'sylvanSolo',
    );
    expect(sylvan.effects).toEqual(rules.sylvanSolo.effects);

    const together = evaluateCharacterEffects(
      ['corin', 'sylvan'],
      100,
      rules,
    );
    expect(together.events).toEqual([]);
    expect(together.effects).toEqual([]);
    expect(together.rngState).toBe(100);

    let clashSeed = -1;
    for (let seed = 0; seed < 10000 && clashSeed < 0; seed += 1) {
      const resolution = evaluateCharacterEffects(
        ['toria', 'cirra'],
        seed,
        rules,
      );

      if (resolution.events.some(event => event.source === 'clash')) {
        clashSeed = seed;
      }
    }

    expect(clashSeed).toBeGreaterThanOrEqual(0);

    const first = evaluateCharacterEffects(
      ['toria', 'cirra'],
      clashSeed,
      rules,
    );
    const second = evaluateCharacterEffects(
      ['toria', 'cirra'],
      clashSeed,
      rules,
    );

    expect(second).toEqual(first);
    expect(first.effects).toEqual(rules.clash.effects);
    expect(first.rngState).not.toBe(clashSeed);
  });
});
