import { describe, expect, it } from 'vitest';
import type {
  Card,
  CardCategory,
  GameAction,
  GameState,
  Meters,
  MorningPlay,
} from '../types';
import {
  areMetersDepleted,
  CARD_LIBRARY,
  canConfirmMorning,
  createCosmonauts,
  createInitialMeters,
  createInitialState,
  DEFAULT_CONTENT,
  drawMorningGroups,
  effectiveCosts,
  evaluateMissionCharacters,
  resolveOutcome,
  transition,
  type GameContent,
} from '../logic';

function simpleCard(
  deck: Exclude<CardCategory, 'repair'>,
  id: string,
  overrides: Partial<Card> = {},
): Card {
  const cycles: Record<Exclude<CardCategory, 'repair'>, Card['cycles']> = {
    daily: ['morning'],
    research: ['afternoon'],
    exploration: ['afternoon'],
    build: ['evening'],
    upgrade: ['evening'],
  };

  return {
    id,
    name: id,
    description: id,
    deck,
    category: deck,
    cycles: cycles[deck],
    costs: deck === 'daily' ? [] : [{ meter: 'power', delta: -1 }],
    effects: deck === 'daily' ? [] : [{ meter: 'lifeSupport', delta: 1 }],
    rejectionPenalty: [],
    durationCycles: deck === 'daily' ? 0 : 1,
    requiresCrew: deck !== 'daily',
    recommendedCrewIds: [],
    validitySol: deck === 'daily' ? 1 : undefined,
    fact: 'Test fact.',
    source: 'Test source.',
    limit: 'Test limit.',
    ...overrides,
  };
}

function makeTestContent(
  overrides: Partial<GameContent['balance']> = {},
): GameContent {
  const cards: Card[] = [
    simpleCard('daily', 'T-DR-1'),
    simpleCard('daily', 'T-DR-2'),
    simpleCard('daily', 'T-DR-3'),
    simpleCard('daily', 'T-DR-4'),
    simpleCard('daily', 'T-DR-5'),
    simpleCard('daily', 'T-DR-6'),
    simpleCard('daily', 'T-DR-7'),
    simpleCard('daily', 'T-DR-8'),
    simpleCard('daily', 'T-DR-9'),
    simpleCard('research', 'T-RS-1', { durationCycles: 4 }),
    simpleCard('research', 'T-RS-2'),
    simpleCard('research', 'T-RS-3'),
    simpleCard('exploration', 'T-EX-1'),
    simpleCard('exploration', 'T-EX-2'),
    simpleCard('exploration', 'T-EX-3'),
    simpleCard('build', 'T-BL-1'),
    simpleCard('build', 'T-BL-2'),
    simpleCard('build', 'T-BL-3'),
    simpleCard('upgrade', 'T-UP-1'),
    simpleCard('upgrade', 'T-UP-2'),
    simpleCard('upgrade', 'T-UP-3'),
  ];

  return {
    ...DEFAULT_CONTENT,
    cards,
    roster: DEFAULT_CONTENT.roster,
    balance: {
      ...DEFAULT_CONTENT.balance,
      disasterChances: {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0,
      },
      ...overrides,
    },
  };
}

function start(
  seed = 1234,
  content: GameContent = makeTestContent(),
): GameState {
  return transition(
    createInitialState(content),
    { type: 'START', seed },
    content,
  );
}

function confirmMorning(
  state: GameState,
  content: GameContent,
  playNow: MorningPlay[] = [],
): GameState {
  let next = state;
  for (let group = 0; group < content.balance.dailyGroups; group += 1) {
    const card = next.morningGroups[group][0];
    next = transition(
      next,
      { type: 'SELECT_DAILY', groupIndex: group, cardId: card.id },
      content,
    );
  }
  return transition(next, { type: 'CONFIRM_MORNING', playNow }, content);
}

function pickMorningCard(
  state: GameState,
  content: GameContent,
  targetId: string,
): GameState {
  let next = state;
  for (let group = 0; group < content.balance.dailyGroups; group += 1) {
    const card =
      next.morningGroups[group].find(candidate => candidate.id === targetId) ??
      next.morningGroups[group][0];
    next = transition(
      next,
      { type: 'SELECT_DAILY', groupIndex: group, cardId: card.id },
      content,
    );
  }
  return next;
}

function rejectCurrentCard(
  state: GameState,
  content: GameContent,
): GameState {
  const card = state.hand[0];
  let next = transition(state, { type: 'SELECT_CARD', cardId: card.id }, content);
  next = transition(next, { type: 'REJECT_CARD' }, content);
  return transition(next, { type: 'ADVANCE_CYCLE' }, content);
}

describe('CRATER GDD engine', () => {
  it('starts with four meters at 80, 10/10 rations, and four crew', () => {
    const state = start();

    expect(state.sol).toBe(1);
    expect(state.cycle).toBe('morning');
    expect(state.phase).toBe('playing');
    expect(state.cosmonauts.map(crew => crew.id)).toEqual([
      'toria',
      'cirra',
      'corin',
      'sylvan',
    ]);
    expect(state.cosmonauts.every(crew => crew.condition === 'ready')).toBe(true);
    expect(state.rations).toEqual({ food: 10, water: 10 });
    expect(Object.values(state.meters).map(meter => meter.value)).toEqual([
      80, 80, 80, 80,
    ]);
  });

  it('deals 9 Daily Routine cards in 3 groups of 3 on the morning', () => {
    const state = start();

    expect(state.morningGroups).toHaveLength(3);
    expect(state.morningGroups.every(group => group.length === 3)).toBe(true);
    expect(state.morningGroups.flat().every(card => card.category === 'daily')).toBe(
      true,
    );

    const ids = state.morningGroups.flat().map(card => card.id);
    expect(new Set(ids).size).toBe(9);
  });

  it('plays selected morning cards immediately and forfeits unplayed cards', () => {
    const base = makeTestContent();
    const content: GameContent = {
      ...base,
      cards: base.cards.map(card => {
        if (card.id === 'T-DR-1') {
          return {
            ...card,
            costs: [{ meter: 'power', delta: -1 }],
            effects: [{ meter: 'lifeSupport', delta: 4 }],
            durationCycles: 1,
            requiresCrew: true,
          };
        }
        if (card.deck === 'daily') {
          return {
            ...card,
            effects: [{ meter: 'lifeSupport', delta: 100 }],
          };
        }
        return card;
      }),
    };

    let state = start(1234, content);
    state = pickMorningCard(state, content, 'T-DR-1');

    const crew = state.cosmonauts[0];
    const playNow: MorningPlay[] = [
      { cardId: 'T-DR-1', cosmonautIds: [crew.id] },
    ];

    expect(canConfirmMorning(state, playNow, content)).toEqual({
      ok: true,
      reasons: [],
    });

    const beforeLifeSupport = state.meters.lifeSupport.value;
    state = transition(
      state,
      { type: 'CONFIRM_MORNING', playNow },
      content,
    );

    expect(state.cycle).toBe('afternoon');
    expect(state.meters.lifeSupport.value).toBe(beforeLifeSupport + 4);
    expect(state.meters.power.value).toBe(79);
    expect(state.morningPicks).toEqual([]);
    expect(state.hand).toHaveLength(3);
  });

  it('reports crew-required for a selected card without crew', () => {
    const base = makeTestContent();
    const content: GameContent = {
      ...base,
      cards: base.cards.map(card =>
        card.id === 'T-DR-1'
          ? { ...card, requiresCrew: true, durationCycles: 1 }
          : card,
      ),
    };

    let state = start(1234, content);
    state = pickMorningCard(state, content, 'T-DR-1');

    expect(
      canConfirmMorning(state, [{ cardId: 'T-DR-1' }], content).reasons,
    ).toContain('crew-required');
  });

  it('reports morning rejection reasons through canConfirmMorning', () => {
    const content = makeTestContent();
    const fresh = start(1234, content);

    expect(canConfirmMorning(fresh, [], content).reasons).toContain(
      'morning-incomplete',
    );

    const picked = pickMorningCard(fresh, content, 'T-DR-1');
    expect(
      canConfirmMorning(
        picked,
        [{ cardId: 'tidak-ada' }],
        content,
      ).reasons,
    ).toContain('unknown-card');
  });

  it('draws the correct categories for afternoon and evening', () => {
    const content = makeTestContent();
    let state = start(1234, content);
    state = confirmMorning(state, content);

    expect(state.cycle).toBe('afternoon');
    expect(
      state.hand.every(card =>
        ['research', 'exploration'].includes(card.category),
      ),
    ).toBe(true);

    state = rejectCurrentCard(state, content);
    expect(state.cycle).toBe('evening');
    expect(
      state.hand.every(card => ['build', 'upgrade'].includes(card.category)),
    ).toBe(true);
  });

  it('executes a mission, applies effects, and releases crew after the duration', () => {
    const content = makeTestContent();
    let state = start(1234, content);
    state = confirmMorning(state, content);

    const card = state.hand.find(candidate => candidate.durationCycles === 1)!;
    state = transition(state, { type: 'SELECT_CARD', cardId: card.id }, content);

    const crew = state.cosmonauts.find(candidate => candidate.available)!;
    state = transition(state, { type: 'ASSIGN', cosmonautId: crew.id }, content);

    const before = state.meters.lifeSupport.value;
    state = transition(state, { type: 'EXECUTE_CARD' }, content);

    expect(state.phaseState).toBe('executed');
    expect(state.meters.lifeSupport.value).toBe(before + 1);
    expect(state.cosmonauts.find(item => item.id === crew.id)?.cooldown).toBe(1);

    state = transition(state, { type: 'ADVANCE_CYCLE' }, content);
    expect(state.cycle).toBe('evening');
    expect(state.cosmonauts.find(item => item.id === crew.id)?.available).toBe(
      true,
    );
  });

  it('keeps a four-cycle mission crew locked across phases', () => {
    const content = makeTestContent();
    let state = start(1234, content);
    state = confirmMorning(state, content);

    const card = state.hand.find(candidate => candidate.durationCycles === 4);
    if (!card) return;

    state = transition(state, { type: 'SELECT_CARD', cardId: card.id }, content);
    const crew = state.cosmonauts.find(candidate => candidate.available)!;
    state = transition(state, { type: 'ASSIGN', cosmonautId: crew.id }, content);
    state = transition(state, { type: 'EXECUTE_CARD' }, content);

    state = transition(state, { type: 'ADVANCE_CYCLE' }, content);
    expect(state.cycle).toBe('evening');
    expect(state.cosmonauts.find(item => item.id === crew.id)?.available).toBe(
      false,
    );
    expect(state.cosmonauts.find(item => item.id === crew.id)?.cooldown).toBe(3);
  });

  it('consumes one Food and one Water per crew, then produces, irrigates, and decays', () => {
    const content = makeTestContent();
    let state = start(1234, content);
    state = confirmMorning(state, content);
    state = rejectCurrentCard(state, content);
    state = rejectCurrentCard(state, content);

    expect(state.cycle).toBe('night');
    state = transition(state, { type: 'END_SOL' }, content);

    expect(state.sol).toBe(2);
    expect(state.cycle).toBe('morning');
    expect(state.rations.food).toBe(9);
    expect(state.rations.water).toBe(8);
    expect(state.meters.lifeSupport.value).toBe(77);
    expect(state.meters.shielding.value).toBe(78);
    expect(state.meters.power.value).toBe(80);
    expect(state.meters.food.value).toBe(78);
  });

  it('applies delayed Water Ration effects from a morning card at night', () => {
    const base = makeTestContent();
    const card = simpleCard('daily', 'T-DR-DELAYED', {
      delayedEffects: [{ ration: 'water', rationDelta: 1 }],
      durationCycles: 0,
      requiresCrew: false,
    });
    const content: GameContent = {
      ...base,
      cards: base.cards.map(item =>
        item.id === 'T-DR-1' ? card : item,
      ),
    };

    let state = start(999, content);
    state = pickMorningCard(state, content, 'T-DR-DELAYED');
    state = transition(
      state,
      { type: 'CONFIRM_MORNING', playNow: ['T-DR-DELAYED'] },
      content,
    );

    state = rejectCurrentCard(state, content);
    state = rejectCurrentCard(state, content);
    state = transition(state, { type: 'END_SOL' }, content);

    // 10 - 4 konsumsi + 3 produksi - 1 irigasi = 8, +1 efek tertunda.
    expect(state.rations.water).toBe(9);
  });

  it('keeps DR-08 as a next-Exploration modifier, not a permanent upgrade', () => {
    const base = makeTestContent();
    const dr08 = CARD_LIBRARY.find(card => card.id === 'DR-08')!;
    const content: GameContent = {
      ...base,
      cards: base.cards.map(card => {
        if (card.id === 'T-DR-1') return dr08;
        if (card.deck === 'research') {
          return { ...card, deck: 'exploration', category: 'exploration' };
        }
        return card;
      }),
    };

    let state = start(1234, content);
    state = pickMorningCard(state, content, dr08.id);

    const crew = state.cosmonauts.find(candidate => candidate.available)!;
    state = transition(
      state,
      {
        type: 'CONFIRM_MORNING',
        playNow: [{ cardId: dr08.id, cosmonautIds: [crew.id] }],
      },
      content,
    );

    expect(state.nextExplorationRiskReduction).toBe(0.2);
    expect(
      state.permanentModifiers.explorationUnwellReduction,
    ).toBeUndefined();

    const exploration = state.hand.find(card => card.category === 'exploration')!;
    state = transition(
      state,
      { type: 'SELECT_CARD', cardId: exploration.id },
      content,
    );
    const explorer = state.cosmonauts.find(candidate => candidate.available)!;
    state = transition(
      state,
      { type: 'ASSIGN', cosmonautId: explorer.id },
      content,
    );
    state = transition(state, { type: 'EXECUTE_CARD' }, content);

    expect(state.nextExplorationRiskReduction).toBe(0);
  });

  it('applies DR-09 Power cost as 0 when Cirra is assigned', () => {
    const dr09 = CARD_LIBRARY.find(card => card.id === 'DR-09')!;

    expect(effectiveCosts(dr09, [], {})[0].delta).toBe(-2);
    expect(effectiveCosts(dr09, ['cirra'], {})[0].delta).toBe(0);
  });

  it('applies SEP damage reduction and SEP Unwell immunity', () => {
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

    const findSolarDisaster = (
      modifiers: GameState['permanentModifiers'],
      shielding: number,
    ): GameState | undefined => {
      for (let seed = 0; seed < 300; seed += 1) {
        let state = start(seed, content);
        state = {
          ...state,
          permanentModifiers: modifiers,
          meters: {
            ...state.meters,
            shielding: { ...state.meters.shielding, value: shielding },
          },
        };
        state = confirmMorning(state, content);
        if (state.activeDisaster?.id === 'solarParticle') return state;
      }
      return undefined;
    };

    const reduced = findSolarDisaster({ sepDamageReduction: 8 }, 80);
    expect(reduced).toBeDefined();
    expect(reduced!.meters.shielding.value).toBe(66);

    const permanentImmune = findSolarDisaster({ sepUnwellImmunity: true }, 40);
    expect(permanentImmune).toBeDefined();
    expect(
      permanentImmune!.cosmonauts.every(crew => crew.condition === 'stressed'),
    ).toBe(true);

    const firstImmune = findSolarDisaster(
      { sepUnwellImmunityFirst: true },
      40,
    );
    expect(firstImmune).toBeDefined();
    expect(
      firstImmune!.cosmonauts.every(crew => crew.condition === 'stressed'),
    ).toBe(true);
    expect(
      firstImmune!.permanentModifiers.sepUnwellImmunityFirst,
    ).toBeUndefined();
  });

  it('applies the GDD meter-threshold effects at night', () => {
    const content = makeTestContent();
    let state = start(1234, content);
    state = confirmMorning(state, content);
    state = rejectCurrentCard(state, content);
    state = rejectCurrentCard(state, content);

    // Power < 30 mengurangi Life Support sebesar 5.
    const lowPower: GameState = {
      ...state,
      meters: {
        ...state.meters,
        power: { ...state.meters.power, value: 29 },
        lifeSupport: { ...state.meters.lifeSupport, value: 40 },
      },
    };

    const afterLowPower = transition(
      lowPower,
      { type: 'END_SOL' },
      content,
    );
    expect(afterLowPower.meters.lifeSupport.value).toBe(32);

    // Life Support < 30 membuat seluruh kru Lelah.
    const lowLifeSupport: GameState = {
      ...state,
      meters: {
        ...state.meters,
        lifeSupport: { ...state.meters.lifeSupport, value: 25 },
      },
    };

    const afterLowLifeSupport = transition(
      lowLifeSupport,
      { type: 'END_SOL' },
      content,
    );
    expect(
      afterLowLifeSupport.cosmonauts.every(crew => crew.condition === 'tired'),
    ).toBe(true);
  });

  it('provides the full 80-card catalog with facts, sources, and deck sizes', () => {
    expect(CARD_LIBRARY).toHaveLength(80);
    expect(new Set(CARD_LIBRARY.map(card => card.id)).size).toBe(80);

    const count = (deck: CardCategory) =>
      CARD_LIBRARY.filter(card => card.deck === deck).length;

    expect(count('daily')).toBe(20);
    expect(count('research')).toBe(10);
    expect(count('exploration')).toBe(10);
    expect(count('build')).toBe(10);
    expect(count('upgrade')).toBe(10);
    expect(count('repair')).toBe(20);

    expect(
      CARD_LIBRARY.every(
        card => card.fact.length > 0 && card.source.length > 0,
      ),
    ).toBe(true);

    const missionDecks: CardCategory[] = [
      'research',
      'exploration',
      'build',
      'upgrade',
    ];
    expect(
      CARD_LIBRARY.filter(card => missionDecks.includes(card.deck)).every(
        card => card.rejectionPenalty.length > 0,
      ),
    ).toBe(true);

    for (const disaster of [
      'dustStorm',
      'solarParticle',
      'airlockLeak',
      'waterPlantFailure',
    ] as const) {
      expect(
        CARD_LIBRARY.filter(
          card => card.deck === 'repair' && card.disasterId === disaster,
        ),
      ).toHaveLength(5);
    }
  });

  it('triggers a disaster, offers repair cards, and resolves the phase', () => {
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
    let state = start(42, content);
    state = confirmMorning(state, content);

    expect(state.activeDisaster).not.toBeNull();
    expect(state.phaseState).toBe('repair');
    expect(state.activeDisaster?.repairChoices).toHaveLength(3);

    const repair = state.activeDisaster!.repairChoices[0];
    const crewIds = repair.requiresCrew
      ? state.cosmonauts
          .filter(crew => crew.available && crew.condition !== 'unwell')
          .map(crew => crew.id)
      : [];

    state = transition(
      state,
      { type: 'SELECT_REPAIR', cardId: repair.id, cosmonautIds: crewIds },
      content,
    );

    expect(state.phaseState).toBe('executed');
    expect(state.activeDisaster?.resolved).toBe(true);

    state = transition(state, { type: 'ADVANCE_CYCLE' }, content);
    expect(state.cycle).toBe('evening');
  });

  it('applies Toria, Cirra, Corin, and Sylvan traits to missions', () => {
    const rules = DEFAULT_CONTENT.balance.characterRules;
    const crew = createCosmonauts();

    const toriaBuild = evaluateMissionCharacters(
      DEFAULT_CONTENT.cards.find(card => card.id === 'BL-01')!,
      ['toria'],
      crew,
      7,
      rules,
    );
    expect(toriaBuild.durationDelta).toBe(-1);
    expect(toriaBuild.effects.some(effect => (effect.delta ?? 0) === 5)).toBe(
      true,
    );

    const cirraPower = evaluateMissionCharacters(
      DEFAULT_CONTENT.cards.find(card => card.id === 'UP-01')!,
      ['cirra'],
      crew,
      7,
      rules,
    );
    expect(
      cirraPower.effects.some(
        effect => effect.meter === 'power' && effect.delta === 4,
      ),
    ).toBe(true);

    const corinResearch = evaluateMissionCharacters(
      DEFAULT_CONTENT.cards.find(card => card.id === 'RS-02')!,
      ['corin'],
      crew,
      7,
      rules,
    );
    expect(corinResearch.positiveMultiplier).toBeCloseTo(1.5);

    const sylvanSolo = evaluateMissionCharacters(
      DEFAULT_CONTENT.cards.find(card => card.id === 'EX-01')!,
      ['sylvan'],
      crew,
      7,
      rules,
    );
    expect(sylvanSolo.evaFatigueImmune).toBe(true);
    expect(sylvanSolo.events.some(event => event.source === 'sylvanSolo')).toBe(
      true,
    );

    let clashFound = false;
    let anxietyFound = false;
    let overdriveFound = false;

    for (let seed = 0; seed < 200; seed += 1) {
      const clash = evaluateMissionCharacters(
        DEFAULT_CONTENT.cards.find(card => card.id === 'BL-01')!,
        ['toria', 'cirra'],
        crew,
        seed,
        rules,
      );
      if (clash.events.some(event => event.source === 'clash')) {
        clashFound = true;
      }

      const anxiety = evaluateMissionCharacters(
        DEFAULT_CONTENT.cards.find(card => card.id === 'EX-01')!,
        ['corin'],
        crew,
        seed,
        rules,
      );
      if (anxiety.anxiety) anxietyFound = true;

      const overdrive = evaluateMissionCharacters(
        DEFAULT_CONTENT.cards.find(card => card.id === 'EX-01')!,
        ['sylvan', 'toria'],
        crew,
        seed,
        rules,
      );
      if (overdrive.events.some(event => event.source === 'sylvanOverdrive')) {
        overdriveFound = true;
      }
    }

    expect(clashFound).toBe(true);
    expect(anxietyFound).toBe(true);
    expect(overdriveFound).toBe(true);
  });

  it('uses diminishing returns for multiple crew', () => {
    const rules = DEFAULT_CONTENT.balance.characterRules;
    const crew = createCosmonauts();
    const card = DEFAULT_CONTENT.cards.find(item => item.id === 'EX-01')!;

    const one = evaluateMissionCharacters(card, ['toria'], crew, 1, rules);
    const two = evaluateMissionCharacters(
      card,
      ['toria', 'cirra'],
      crew,
      1,
      rules,
    );

    expect(two.positiveMultiplier).toBeGreaterThan(one.positiveMultiplier);
    expect(two.positiveMultiplier).toBeCloseTo(1.5);
  });

  it('resolves Gold, Silver, Bronze, and lost outcomes', () => {
    const meters = createInitialMeters();
    const crew = createCosmonauts();

    const gold = resolveOutcome(
      { meters, rations: { food: 10, water: 10 }, cosmonauts: crew, sol: 8 },
      8,
    );
    expect(gold?.status).toBe('won');
    expect(gold?.status === 'won' && gold.medal).toBe('gold');

    const silverMeters: Meters = {
      ...meters,
      food: { ...meters.food, value: 60 },
    };
    const silver = resolveOutcome(
      {
        meters: silverMeters,
        rations: { food: 5, water: 5 },
        cosmonauts: crew,
        sol: 8,
      },
      8,
    );
    expect(silver?.status === 'won' && silver.medal).toBe('silver');

    const bronzeMeters: Meters = {
      ...meters,
      food: { ...meters.food, value: 30 },
    };
    const bronze = resolveOutcome(
      {
        meters: bronzeMeters,
        rations: { food: 2, water: 2 },
        cosmonauts: crew,
        sol: 8,
      },
      8,
    );
    expect(bronze?.status === 'won' && bronze.medal).toBe('bronze');

    const depleted: Meters = {
      ...meters,
      power: { ...meters.power, value: 0 },
    };
    const lost = resolveOutcome(
      {
        meters: depleted,
        rations: { food: 2, water: 2 },
        cosmonauts: crew,
        sol: 3,
      },
      8,
    );
    expect(lost?.status).toBe('lost');
    expect(areMetersDepleted(depleted)).toEqual(['power']);

    const unwellCrew = crew.map(crewMember => ({
      ...crewMember,
      condition: 'unwell' as const,
    }));
    const unwellLost = resolveOutcome(
      {
        meters,
        rations: { food: 2, water: 2 },
        cosmonauts: unwellCrew,
        sol: 3,
      },
      8,
    );
    expect(unwellLost?.status).toBe('lost');
    expect(unwellLost?.status === 'lost' && unwellLost.reason).toBe(
      'crew-unwell',
    );
  });

  it('ends the run immediately when a meter reaches zero during the day', () => {
    const base = makeTestContent();
    const content: GameContent = {
      ...base,
      cards: base.cards.map(card =>
        card.deck === 'daily'
          ? card
          : {
              ...card,
              costs: [],
              effects: [{ meter: 'power', delta: -999 }],
            },
      ),
    };

    let state = start(77, content);
    state = confirmMorning(state, content);

    const card = state.hand[0];
    state = transition(state, { type: 'SELECT_CARD', cardId: card.id }, content);
    const crew = state.cosmonauts.find(candidate => candidate.available)!;
    state = transition(state, { type: 'ASSIGN', cosmonautId: crew.id }, content);
    state = transition(state, { type: 'EXECUTE_CARD' }, content);

    expect(state.phase).toBe('ended');
    expect(state.outcome?.status).toBe('lost');
    expect(state.outcome?.status === 'lost' && state.outcome.meters).toEqual([
      'power',
    ]);
  });

  it('finishes an eight-Sol campaign with a final outcome', () => {
    const content = makeTestContent();
    let state = start(2026, content);
    let guard = 0;

    while (state.phase === 'playing' && guard < 500) {
      guard += 1;

      if (state.cycle === 'morning') {
        state = confirmMorning(state, content);
        continue;
      }

      if (state.cycle === 'night') {
        state = transition(state, { type: 'END_SOL' }, content);
        continue;
      }

      const card = state.hand[0];
      state = transition(
        state,
        { type: 'SELECT_CARD', cardId: card.id },
        content,
      );

      const crew = state.cosmonauts.find(candidate => candidate.available);
      if (card.requiresCrew && crew) {
        state = transition(
          state,
          { type: 'ASSIGN', cosmonautId: crew.id },
          content,
        );
        state = transition(state, { type: 'EXECUTE_CARD' }, content);
      }

      if (state.phaseState === 'selecting') {
        state = transition(state, { type: 'REJECT_CARD' }, content);
      }

      state = transition(state, { type: 'ADVANCE_CYCLE' }, content);
    }

    expect(guard).toBeLessThan(500);
    expect(state.phase).toBe('ended');
    expect(state.outcome).not.toBeNull();
    expect(state.sol).toBeLessThanOrEqual(8);
  });

  it('replays deterministically from seed and action order', () => {
    const content = makeTestContent();
    const actions: GameAction[] = [];

    let first = start(20251114, content);
    for (let group = 0; group < 3; group += 1) {
      const cardId = first.morningGroups[group][0].id;
      const action = { type: 'SELECT_DAILY' as const, groupIndex: group, cardId };
      actions.push(action);
      first = transition(first, action, content);
    }
    actions.push({ type: 'CONFIRM_MORNING' });
    first = transition(first, { type: 'CONFIRM_MORNING' }, content);

    let replayed = start(20251114, content);
    for (const action of actions) {
      replayed = transition(replayed, action, content);
    }

    expect(replayed).toEqual(first);
  });

  it('draws morning groups deterministically', () => {
    const content = makeTestContent();
    const a = drawMorningGroups(content.cards, 3, 3, 1234);
    const b = drawMorningGroups(content.cards, 3, 3, 1234);
    const c = drawMorningGroups(content.cards, 3, 3, 4321);

    expect(a.groups).toEqual(b.groups);
    expect(a.groups).not.toEqual(c.groups);
  });
});
