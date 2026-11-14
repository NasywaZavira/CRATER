import type {
  Card,
  CardEffect,
  Cosmonaut,
  CrewCondition,
  Cycle,
  DisasterId,
  GameAction,
  GameOutcome,
  GameState,
  Meters,
  MorningConfirmationCheck,
  MorningConfirmationReason,
  MorningPlay,
  MorningPlayInput,
  Rations,
} from '../types';
import type { BalanceConfig } from '../data/balance';
import { DISASTER_IDS } from '../data/balance';
import { evaluateMissionCharacters } from './characterEffects';
import { DEFAULT_CONTENT, type GameContent } from './content';
import { cycleIndex, getNextCycle } from './cycle';
import { drawMorningGroups, drawRepairChoices, drawHand } from './draw';
import { startGame } from './initialState';
import {
  applyMeterEffects,
  applyRationEffects,
  areMetersDepleted,
  canAfford,
  isMeterEffect,
  isRationEffect,
  METER_KEYS,
} from './meters';
import { nextRandom } from './rng';

// ---------------------------------------------------------------------------
// Crew helpers
// ---------------------------------------------------------------------------

function withAvailability(crew: Cosmonaut): Cosmonaut {
  return {
    ...crew,
    available: crew.condition !== 'unwell' && crew.cooldown <= 0,
  };
}

function tickCrew(
  cosmonauts: readonly Cosmonaut[],
  cycles = 1,
): Cosmonaut[] {
  return cosmonauts.map(crew =>
    withAvailability({
      ...crew,
      cooldown: Math.max(0, crew.cooldown - Math.max(0, cycles)),
    }),
  );
}

function crewCanWork(
  crew: Cosmonaut,
  card: Card,
): boolean {
  if (crew.condition === 'unwell') return false;
  if (!crew.available || crew.cooldown > 0) return false;
  if (card.durationCycles === 4 && crew.condition === 'tired') return false;
  return true;
}


// ---------------------------------------------------------------------------
// Card costs and effects
// ---------------------------------------------------------------------------

export function effectiveCosts(
  card: Card,
  assignedIds: readonly string[],
  permanent: GameState['permanentModifiers'],
): CardEffect[] {
  return card.costs.map(effect => {
    if (card.id === 'DR-15' && effect.meter === 'lifeSupport' && assignedIds.includes('cirra')) {
      return { ...effect, delta: 0 };
    }

    // DR-09: Cirra mengurangi biaya Power kartu ini menjadi 0.
    if (
      card.id === 'DR-09' &&
      effect.meter === 'power' &&
      (effect.delta ?? 0) < 0 &&
      assignedIds.includes('cirra')
    ) {
      return { ...effect, delta: 0 };
    }

    if (effect.meter === 'power' && (effect.delta ?? 0) < 0) {
      let amount = Math.abs(effect.delta ?? 0);
      if (assignedIds.includes('cirra')) {
        amount = Math.ceil(amount * 0.5);
      }
      amount = Math.max(0, amount - (permanent.powerCostDiscount ?? 0));
      return { ...effect, delta: -amount };
    }

    return effect;
  });
}

function scalePositiveEffects(
  effects: readonly CardEffect[],
  multiplier: number,
): CardEffect[] {
  return effects.map(effect => {
    if (isMeterEffect(effect) && effect.delta > 0) {
      return { ...effect, delta: Math.floor(effect.delta * multiplier) };
    }
    if (isRationEffect(effect) && effect.rationDelta > 0) {
      return {
        ...effect,
        rationDelta: Math.floor(effect.rationDelta * multiplier),
      };
    }
    return { ...effect };
  });
}

function applyConditionEffects(
  cosmonauts: readonly Cosmonaut[],
  effects: readonly CardEffect[],
  assignedIds: readonly string[],
  rngState: number,
): { cosmonauts: Cosmonaut[]; rngState: number } {
  const next = cosmonauts.map(crew => ({ ...crew, ration: { ...crew.ration } }));
  const assigned = new Set(assignedIds);
  let state = rngState;

  const matches = (crew: Cosmonaut, effect: CardEffect): boolean =>
    effect.fromCondition === undefined ||
    effect.fromCondition === 'any' ||
    crew.condition === effect.fromCondition;

  for (const effect of effects) {
    if (effect.condition === undefined) continue;

    let candidates = next
      .map((crew, index) => ({ crew, index }))
      .filter(({ crew }) => matches(crew, effect));

    if (effect.conditionTarget === 'assigned') {
      candidates = candidates.filter(({ crew }) => assigned.has(crew.id));
    }

    if (effect.conditionTarget === 'random') {
      if (candidates.length > 0) {
        const roll = nextRandom(state);
        state = roll.rngState;
        const pick = Math.floor(roll.value * candidates.length);
        const target = candidates[Math.min(pick, candidates.length - 1)];
        next[target.index] = {
          ...next[target.index],
          condition: effect.condition,
          fullRationNights: 0,
        };
      }
      continue;
    }

    const requested =
      effect.conditionTarget === 'all'
        ? (effect.conditionCount ?? candidates.length)
        : effect.conditionTarget === 'assigned'
          ? (effect.conditionCount ?? candidates.length)
          : Math.max(1, effect.conditionCount ?? 1);

    const limit = Math.min(candidates.length, Math.max(1, requested));

    for (const { index } of candidates.slice(0, limit)) {
      next[index] = {
        ...next[index],
        condition: effect.condition,
        fullRationNights: 0,
      };
    }
  }

  return { cosmonauts: next.map(withAvailability), rngState: state };
}

function mergePermanent(
  current: GameState['permanentModifiers'],
  incoming: Card['permanent'],
): GameState['permanentModifiers'] {
  if (!incoming) return current;

  const result = { ...current } as Record<string, unknown>;

  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined) continue;

    if (typeof value === 'boolean') {
      result[key] = Boolean(result[key]) || value;
      continue;
    }

    if (typeof value === 'number') {
      const existing =
        typeof result[key] === 'number' ? (result[key] as number) : undefined;

      if (
        key === 'irrigationPowerCost' ||
        key === 'irrigationWaterCost' ||
        key === 'shieldEvaThreshold' ||
        key === 'foodProductionFloor'
      ) {
        result[key] = existing === undefined ? value : Math.min(existing, value);
      } else {
        result[key] = (existing ?? 0) + value;
      }
    }
  }

  return result as GameState['permanentModifiers'];
}

function clearFollowUps(
  followUps: GameState['disasterFollowUps'],
  id: DisasterId,
): GameState['disasterFollowUps'] {
  return followUps.map(followUp =>
    followUp.id === id ? { ...followUp, cleared: true } : followUp,
  );
}

interface ResolutionResult {
  state: GameState;
}

/**
 * Membayar biaya, menerapkan efek, menjadwalkan efek tertunda,
 * menyimpan upgrade permanen, dan mengunci kru sesuai durasi misi.
 * Mengembalikan null jika biaya tidak mampu dibayar.
 */
function resolveCard(
  state: GameState,
  card: Card,
  assignedIds: readonly string[],
  content: GameContent,
): ResolutionResult | null {
  const costs = effectiveCosts(card, assignedIds, state.permanentModifiers);

  if (!canAfford(state.meters, state.rations, costs)) return null;

  const character = evaluateMissionCharacters(
    card,
    assignedIds,
    state.cosmonauts,
    state.rngState,
    content.balance.characterRules,
    state.permanentModifiers,
  );

  const immediateCardEffects = card.effects.filter(
    effect => effect.timing !== 'delayed',
  );
  const delayedFromCard = card.effects.filter(
    effect => effect.timing === 'delayed',
  );

  const combined = [
    ...costs,
    ...immediateCardEffects,
    ...character.effects,
  ];

  const scaled = [
    ...costs,
    ...scalePositiveEffects(
      [...immediateCardEffects, ...character.effects],
      character.positiveMultiplier,
    ),
  ];

  let meters = applyMeterEffects(state.meters, scaled);
  let rations = applyRationEffects(state.rations, scaled);

  const conditionResult = applyConditionEffects(
    state.cosmonauts,
    combined,
    assignedIds,
    character.rngState,
  );

  let cosmonauts = conditionResult.cosmonauts;
  let rngState = conditionResult.rngState;

  // Durasi misi + percepatan Toria/konflik.
  const baseDuration = Math.max(0, card.durationCycles);
  const duration = card.requiresCrew
    ? Math.max(0, baseDuration + character.durationDelta)
    : 0;

  if (card.requiresCrew && assignedIds.length > 0 && baseDuration > 0) {
    const assigned = new Set(assignedIds);
    cosmonauts = cosmonauts.map(crew => {
      if (!assigned.has(crew.id)) return crew;

      let cooldown = Math.max(1, duration);
      if (crew.condition === 'tired') cooldown += 1;

      return withAvailability({ ...crew, cooldown });
    });
  }

  // Kelelahan akibat EVA atau pekerjaan berat.
  const heavyWork = baseDuration >= 2 || card.category === 'exploration';
  const evaImmune =
    character.evaFatigueImmune ||
    Boolean(state.permanentModifiers.evaTiredImmunity);

  if (heavyWork && !evaImmune && assignedIds.length > 0) {
    const assigned = new Set(assignedIds);
    cosmonauts = cosmonauts.map(crew =>
      assigned.has(crew.id) && crew.condition === 'ready'
        ? withAvailability({ ...crew, condition: 'tired' })
        : crew,
    );
  }

  let nextExplorationRiskReduction = state.nextExplorationRiskReduction;
  if (card.id === 'DR-08') {
    nextExplorationRiskReduction = Math.max(
      nextExplorationRiskReduction,
      0.2,
    );
  }

  // Risiko radiasi EVA (GDD 3) dan dampak lanjutan SEP pada Sol berikutnya.
  if (card.category === 'exploration') {
    const temporaryReduction = nextExplorationRiskReduction;
    nextExplorationRiskReduction = 0;

    const sepImmune = Boolean(
      state.permanentModifiers.sepUnwellImmunity ||
        state.permanentModifiers.sepUnwellImmunityFirst,
    );

    if (
      assignedIds.length > 0 &&
      !state.permanentModifiers.unwellImmunity &&
      !sepImmune
    ) {
      const shieldValue = meters.shielding.value;
      const safeThreshold = state.permanentModifiers.shieldEvaThreshold ?? 50;
      let risk = 0;

      if (shieldValue < 30) risk = 0.5;
      else if (shieldValue < safeThreshold) risk = 0.4;

      if (
        state.evaUnwellRiskUntilSol !== null &&
        state.sol <= state.evaUnwellRiskUntilSol
      ) {
        risk = Math.max(risk, 0.5);
      }

      risk = Math.max(
        0,
        risk -
          (state.permanentModifiers.explorationUnwellReduction ?? 0) -
          temporaryReduction,
      );

      if (risk > 0) {
        const roll = nextRandom(rngState);
        rngState = roll.rngState;
        if (roll.value < risk) {
          const pickup = nextRandom(rngState);
          rngState = pickup.rngState;
          const target =
            assignedIds[
              Math.min(
                assignedIds.length - 1,
                Math.floor(pickup.value * assignedIds.length),
              )
            ];
          cosmonauts = cosmonauts.map(crew =>
            crew.id === target
              ? withAvailability({ ...crew, condition: 'unwell' })
              : crew,
          );
        }
      }
    }
  }

  // Efek tertunda.
  const pendingEffects = state.pendingEffects.slice();
  const delayed = [...delayedFromCard, ...(card.delayedEffects ?? [])];
  for (const effect of delayed) {
    const dueSol = state.sol + (effect.delaySols ?? 0);
    pendingEffects.push({
      dueSol,
      effects: [{ ...effect, timing: 'immediate', delaySols: undefined }],
    });
  }

  let disasterFollowUps = state.disasterFollowUps;
  if (card.clearsFollowUp) {
    const target: DisasterId = card.disasterId ?? 'dustStorm';
    disasterFollowUps = clearFollowUps(disasterFollowUps, target);
  }

  const extra = { ...state.pendingExtraRations };
  if (character.anxiety) {
    extra.food += content.balance.characterRules.corinAnxiety.foodRations;
    extra.water += content.balance.characterRules.corinAnxiety.waterRations;
  }

  return {
    state: {
      ...state,
      meters,
      rations,
      cosmonauts,
      permanentModifiers: mergePermanent(
        state.permanentModifiers,
        card.permanent,
      ),
      nextExplorationRiskReduction,
      pendingEffects,
      disasterFollowUps,
      pendingExtraRations: extra,
      rngState,
    },
  };
}

// ---------------------------------------------------------------------------
// Loss check
// ---------------------------------------------------------------------------

function applyImmediateLoss(state: GameState): GameState {
  if (state.phase !== 'playing') return state;

  const depleted = areMetersDepleted(state.meters);
  if (depleted.length === 0) return state;

  return {
    ...state,
    phase: 'ended',
    outcome: {
      status: 'lost',
      reason: 'meter-depleted',
      sol: state.sol,
      meters: depleted,
    },
    hand: [],
    morningGroups: [],
    morningPicks: [],
    selectedCardIds: [],
    assignments: [],
  };
}

// ---------------------------------------------------------------------------
// Disasters
// ---------------------------------------------------------------------------

function absolutePhase(sol: number, cycle: Cycle): number {
  return (sol - 1) * 4 + cycleIndex(cycle);
}

interface DisasterRoll {
  id?: DisasterId;
  rngState: number;
}

function rollDisaster(
  sol: number,
  cycle: Cycle,
  history: GameState['disasterHistory'],
  lastDisasterPhase: number | null,
  rngState: number,
  balance: BalanceConfig,
): DisasterRoll {
  if (cycle === 'night') return { rngState };
  if (sol === 1 && cycle === 'morning') return { rngState };
  if (history.length >= balance.maxDisasters) return { rngState };

  const currentPhase = absolutePhase(sol, cycle);
  if (
    lastDisasterPhase !== null &&
    currentPhase - lastDisasterPhase < balance.disasterMinPhaseGap
  ) {
    return { rngState };
  }

  const chance = balance.disasterChances[cycle];
  const roll = nextRandom(rngState);
  let state = roll.rngState;
  if (roll.value >= chance) return { rngState: state };

  const used = new Set(history.map(record => record.id));
  const available = DISASTER_IDS.filter(id => !used.has(id));
  if (available.length === 0) return { rngState: state };

  const pick = nextRandom(state);
  state = pick.rngState;
  const id = available[Math.min(
    available.length - 1,
    Math.floor(pick.value * available.length),
  )];

  return { id, rngState: state };
}

function applyDisasterImpact(
  state: GameState,
  id: DisasterId,
  content: GameContent,
): GameState {
  const balance = content.balance;
  let meters = state.meters;
  let rations = state.rations;
  let cosmonauts = state.cosmonauts;
  let rngState = state.rngState;
  let permanentModifiers = state.permanentModifiers;

  if (id === 'dustStorm') {
    meters = applyMeterEffects(meters, [{ meter: 'power', delta: -20 }]);
  } else if (id === 'solarParticle') {
    const wasBelowThreshold = meters.shielding.value < 50;
    const sepDamage = Math.max(
      0,
      22 - (permanentModifiers.sepDamageReduction ?? 0),
    );
    meters = applyMeterEffects(meters, [
      { meter: 'shielding', delta: -sepDamage },
    ]);

    const permanentImmunity = Boolean(
      permanentModifiers.sepUnwellImmunity,
    );
    const firstImmunity = Boolean(
      permanentModifiers.sepUnwellImmunityFirst,
    );
    const immune = permanentImmunity || firstImmunity;

    cosmonauts = cosmonauts.map(crew =>
      withAvailability({
        ...crew,
        condition: wasBelowThreshold && !immune ? 'unwell' : 'stressed',
        fullRationNights: 0,
      }),
    );

    if (firstImmunity && !permanentImmunity) {
      const { sepUnwellImmunityFirst, ...rest } = permanentModifiers;
      permanentModifiers = rest;
    }
  } else if (id === 'airlockLeak') {
    meters = applyMeterEffects(meters, [{ meter: 'lifeSupport', delta: -20 }]);
    const pool = cosmonauts.slice();
    for (let i = 0; i < 2 && pool.length > 0; i += 1) {
      const roll = nextRandom(rngState);
      rngState = roll.rngState;
      const index = Math.floor(roll.value * pool.length);
      const target = pool.splice(index, 1)[0];
      cosmonauts = cosmonauts.map(crew =>
        crew.id === target.id
          ? withAvailability({ ...crew, condition: 'tired' })
          : crew,
      );
    }
  } else {
    meters = applyMeterEffects(meters, [{ meter: 'food', delta: -20 }]);
    rations = applyRationEffects(rations, [{ ration: 'water', rationDelta: -2 }]);
  }

  const followUps = state.disasterFollowUps.slice();
  if (id !== 'solarParticle') {
    followUps.push({ id, dueSol: state.sol, cleared: false });
  }

  const choiceCount =
    balance.repairChoices +
    (permanentModifiers.repairChoicesBonus ?? 0);
  const repairDraw = drawRepairChoices(
    content.cards,
    id,
    choiceCount,
    rngState,
  );

  return {
    ...state,
    meters,
    rations,
    cosmonauts,
    permanentModifiers,
    rngState: repairDraw.rngState,
    disasterHistory: [
      ...state.disasterHistory,
      { id, sol: state.sol, cycle: state.cycle },
    ],
    activeDisaster: {
      id,
      repairChoices: repairDraw.hand,
      resolved: false,
      clearedFollowUp: false,
    },
    disasterFollowUps: followUps,
    lastDisasterPhase: absolutePhase(state.sol, state.cycle),
    explorationBlockedUntilSol:
      id === 'dustStorm' ? state.sol + 1 : state.explorationBlockedUntilSol,
    evaUnwellRiskUntilSol:
      id === 'solarParticle' ? state.sol + 1 : state.evaUnwellRiskUntilSol,
    phaseState: 'repair',
    hand: [],
    morningGroups: [],
    morningPicks: [],
    selectedCardIds: [],
    assignments: [],
  };
}

function enterPhase(
  state: GameState,
  cycle: Cycle,
  content: GameContent,
): GameState {
  const cleared: GameState = {
    ...state,
    cycle,
    phaseState: 'selecting',
    hand: [],
    morningGroups: [],
    morningPicks: [],
    selectedCardIds: [],
    assignments: [],
    activeDisaster: null,
  };

  const disaster = rollDisaster(
    state.sol,
    cycle,
    state.disasterHistory,
    state.lastDisasterPhase,
    state.rngState,
    content.balance,
  );

  const withRng: GameState = { ...cleared, rngState: disaster.rngState };

  if (disaster.id) {
    return applyImmediateLoss(
      applyDisasterImpact(withRng, disaster.id, content),
    );
  }

  if (cycle === 'morning') {
    const draw = drawMorningGroups(
      content.cards,
      content.balance.dailyGroups,
      content.balance.dailyPerGroup,
      withRng.rngState,
    );

    return {
      ...withRng,
      morningGroups: draw.groups,
      morningPicks: draw.groups.map(() => null),
      rngState: draw.rngState,
    };
  }

  if (cycle === 'afternoon' || cycle === 'evening') {
    const draw = drawHand({
      cards: content.cards,
      cycle,
      handSize: content.balance.phaseCardCount,
      rngState: withRng.rngState,
    });

    return {
      ...withRng,
      hand: draw.hand,
      rngState: draw.rngState,
    };
  }

  return { ...withRng, phaseState: 'night' };
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

function selectedCard(state: GameState): Card | undefined {
  const id = state.selectedCardIds[0];
  return id ? state.hand.find(card => card.id === id) : undefined;
}

function selectDaily(
  state: GameState,
  groupIndex: number,
  cardId: string,
): GameState {
  if (
    state.phase !== 'playing' ||
    state.cycle !== 'morning' ||
    state.phaseState !== 'selecting'
  ) {
    return state;
  }

  const group = state.morningGroups[groupIndex];
  if (!group || !group.some(card => card.id === cardId)) return state;

  const morningPicks = state.morningPicks.slice();
  morningPicks[groupIndex] = cardId;

  return {
    ...state,
    morningPicks,
    selectedCardIds: morningPicks.filter(
      (id): id is string => id !== null,
    ),
  };
}

function pickedMorningCards(state: GameState): Card[] | null {
  if (
    state.morningPicks.length !== state.morningGroups.length ||
    state.morningPicks.some(id => id === null)
  ) {
    return null;
  }

  const pool = state.morningGroups.flat();
  const picked = state.morningPicks.map(id =>
    id === null ? undefined : pool.find(card => card.id === id),
  );

  return picked.every((card): card is Card => card !== undefined)
    ? picked
    : null;
}

interface MorningPlaySimulation {
  state: GameState | null;
  reasons: MorningConfirmationReason[];
}

function simulateMorningPlays(
  state: GameState,
  playNow: readonly MorningPlayInput[],
  content: GameContent,
): MorningPlaySimulation {
  if (
    state.phase !== 'playing' ||
    state.cycle !== 'morning' ||
    state.phaseState !== 'selecting'
  ) {
    return { state: null, reasons: ['morning-incomplete'] };
  }

  const picked = pickedMorningCards(state);
  if (!picked) return { state: null, reasons: ['morning-incomplete'] };

  const pickedById = new Map(picked.map(card => [card.id, card]));
  const reasons: MorningConfirmationReason[] = [];
  const usedCardIds = new Set<string>();
  const usedCrewIds = new Set<string>();

  let next = state;

  for (const play of playNow) {
    const playCard: MorningPlay =
      typeof play === 'string' ? { cardId: play } : play;

    if (usedCardIds.has(playCard.cardId)) {
      reasons.push('duplicate-card');
      continue;
    }
    usedCardIds.add(playCard.cardId);

    const card = pickedById.get(playCard.cardId);
    if (!card) {
      reasons.push('unknown-card');
      continue;
    }

    const assignedIds = card.requiresCrew
      ? (playCard.cosmonautIds ?? [])
      : [];

    if (card.requiresCrew && assignedIds.length === 0) {
      reasons.push('crew-required');
      continue;
    }

    let crewAvailable = true;
    for (const id of assignedIds) {
      const crew = next.cosmonauts.find(candidate => candidate.id === id);
      if (!crew || !crewCanWork(crew, card) || usedCrewIds.has(id)) {
        crewAvailable = false;
        break;
      }
    }

    if (!crewAvailable) {
      reasons.push('crew-unavailable');
      continue;
    }

    const result = resolveCard(next, card, assignedIds, content);
    if (!result) {
      reasons.push('unaffordable');
      continue;
    }

    next = applyImmediateLoss(result.state);
    if (next.phase === 'ended') {
      return { state: next, reasons: [] };
    }

    for (const id of assignedIds) usedCrewIds.add(id);
  }

  if (reasons.length > 0) return { state: null, reasons };

  // Semua kartu yang tidak ada di playNow hangus; tidak ada Command Hand.
  return {
    state: enterPhase(
      {
        ...next,
        cosmonauts: tickCrew(next.cosmonauts),
        morningGroups: [],
        morningPicks: [],
        selectedCardIds: [],
        assignments: [],
      },
      'afternoon',
      content,
    ),
    reasons: [],
  };
}

export function canConfirmMorning(
  state: GameState,
  playNow: readonly MorningPlayInput[] = [],
  content: GameContent = DEFAULT_CONTENT,
): MorningConfirmationCheck {
  const simulation = simulateMorningPlays(state, playNow, content);

  return {
    ok: simulation.reasons.length === 0,
    reasons: simulation.reasons,
  };
}

function confirmMorning(
  state: GameState,
  playNow: readonly MorningPlayInput[],
  content: GameContent,
): GameState {
  return simulateMorningPlays(state, playNow, content).state ?? state;
}

function selectCard(state: GameState, cardId: string): GameState {
  if (
    state.phase !== 'playing' ||
    (state.cycle !== 'afternoon' && state.cycle !== 'evening') ||
    state.phaseState !== 'selecting'
  ) {
    return state;
  }

  if (!state.hand.some(card => card.id === cardId)) return state;

  return {
    ...state,
    selectedCardIds: [cardId],
    assignments: [],
  };
}

function assignCosmonaut(state: GameState, cosmonautId: string): GameState {
  if (
    state.phase !== 'playing' ||
    (state.cycle !== 'afternoon' && state.cycle !== 'evening') ||
    state.phaseState !== 'selecting'
  ) {
    return state;
  }

  const card = selectedCard(state);
  if (!card) return state;

  if (!card.requiresCrew) return state;

  const crew = state.cosmonauts.find(candidate => candidate.id === cosmonautId);
  if (!crew || !crewCanWork(crew, card)) return state;

  const existing = state.assignments.find(
    assignment => assignment.cardId === card.id,
  );
  if (existing?.cosmonautIds.includes(cosmonautId)) return state;

  const assignments = existing
    ? state.assignments.map(assignment =>
        assignment.cardId === card.id
          ? {
              ...assignment,
              cosmonautIds: [...assignment.cosmonautIds, cosmonautId],
            }
          : assignment,
      )
    : [...state.assignments, { cardId: card.id, cosmonautIds: [cosmonautId] }];

  return { ...state, assignments };
}

function unassignCosmonaut(state: GameState, cosmonautId: string): GameState {
  const card = selectedCard(state);
  if (!card) return state;

  const assignments = state.assignments
    .map(assignment =>
      assignment.cardId === card.id
        ? {
            ...assignment,
            cosmonautIds: assignment.cosmonautIds.filter(
              id => id !== cosmonautId,
            ),
          }
        : assignment,
    )
    .filter(assignment => assignment.cosmonautIds.length > 0);

  return { ...state, assignments };
}

function executeCard(state: GameState, content: GameContent): GameState {
  if (
    state.phase !== 'playing' ||
    (state.cycle !== 'afternoon' && state.cycle !== 'evening') ||
    state.phaseState !== 'selecting'
  ) {
    return state;
  }

  const card = selectedCard(state);
  if (!card) return state;

  const assignment = state.assignments.find(
    item => item.cardId === card.id,
  );
  const assignedIds = card.requiresCrew
    ? (assignment?.cosmonautIds ?? [])
    : [];

  if (card.requiresCrew && assignedIds.length === 0) return state;

  if (
    card.durationCycles === 4 &&
    assignedIds.some(
      id => state.cosmonauts.find(crew => crew.id === id)?.condition === 'tired',
    )
  ) {
    return state;
  }

  if (
    card.category === 'exploration' &&
    state.explorationBlockedUntilSol !== null &&
    state.sol <= state.explorationBlockedUntilSol
  ) {
    return state;
  }

  const result = resolveCard(state, card, assignedIds, content);
  if (!result) return state;

  return applyImmediateLoss({
    ...result.state,
    phaseState: 'executed',
  });
}

function rejectCard(state: GameState, content: GameContent): GameState {
  if (
    state.phase !== 'playing' ||
    (state.cycle !== 'afternoon' && state.cycle !== 'evening') ||
    state.phaseState !== 'selecting'
  ) {
    return state;
  }

  const card = selectedCard(state);
  if (!card) return state;

  const meters = applyMeterEffects(state.meters, card.rejectionPenalty);
  const rations = applyRationEffects(state.rations, card.rejectionPenalty);
  const conditionResult = applyConditionEffects(
    state.cosmonauts,
    card.rejectionPenalty,
    [],
    state.rngState,
  );

  return applyImmediateLoss({
    ...state,
    meters,
    rations,
    cosmonauts: conditionResult.cosmonauts,
    rngState: conditionResult.rngState,
    phaseState: 'rejected',
  });
}


function selectRepair(
  state: GameState,
  cardId: string,
  cosmonautIds: readonly string[],
  content: GameContent,
): GameState {
  const disaster = state.activeDisaster;
  if (
    state.phase !== 'playing' ||
    !disaster ||
    disaster.resolved ||
    state.phaseState !== 'repair'
  ) {
    return state;
  }

  const card = disaster.repairChoices.find(candidate => candidate.id === cardId);
  if (!card) return state;

  if (card.requiresCrew && cosmonautIds.length === 0) return state;

  const assignedIds = card.requiresCrew ? cosmonautIds : [];

  for (const id of assignedIds) {
    const crew = state.cosmonauts.find(candidate => candidate.id === id);
    if (!crew || !crewCanWork(crew, card)) return state;
  }

  const result = resolveCard(state, card, assignedIds, content);
  if (!result) return state;

  return applyImmediateLoss({
    ...result.state,
    activeDisaster: {
      ...disaster,
      resolved: true,
      clearedFollowUp: Boolean(card.clearsFollowUp),
    },
    phaseState: 'executed',
  });
}

function skipRepair(state: GameState, content: GameContent): GameState {
  if (!state.activeDisaster || state.activeDisaster.resolved) return state;

  return {
    ...state,
    pendingNightPenalty:
      state.pendingNightPenalty + content.balance.repairPenalty,
    activeDisaster: { ...state.activeDisaster, resolved: true },
    phaseState: 'executed',
  };
}

function setRation(
  state: GameState,
  cosmonautId: string,
  food: boolean,
  water: boolean,
): GameState {
  return {
    ...state,
    cosmonauts: state.cosmonauts.map(crew =>
      crew.id === cosmonautId
        ? { ...crew, ration: { food, water } }
        : crew,
    ),
  };
}

function advanceCycle(state: GameState, content: GameContent): GameState {
  if (state.phase !== 'playing') return state;

  if (state.activeDisaster && !state.activeDisaster.resolved) return state;

  if (state.cycle === 'morning') {
    // Pagi normal memakai CONFIRM_MORNING. Jalur ini hanya untuk pemulihan bencana.
    if (state.phaseState !== 'executed') return state;
    return enterPhase(
      {
        ...state,
        cosmonauts: tickCrew(state.cosmonauts),
      },
      'afternoon',
      content,
    );
  }

  if (state.cycle !== 'afternoon' && state.cycle !== 'evening') {
    return state;
  }

  if (state.phaseState !== 'executed' && state.phaseState !== 'rejected') {
    return state;
  }

  const nextCycle = getNextCycle(state.cycle);
  if (!nextCycle) return state;

  return enterPhase(
    {
      ...state,
      cosmonauts: tickCrew(state.cosmonauts),
    },
    nextCycle,
    content,
  );
}

// ---------------------------------------------------------------------------
// Night evaluation
// ---------------------------------------------------------------------------

function productionAmount(
  value: number,
  rule: BalanceConfig['foodProduction'],
): number {
  if (value >= rule.highThreshold) return rule.high;
  if (value >= rule.lowThreshold) return rule.mid;
  return rule.low;
}

export interface OutcomeInput {
  meters: Meters;
  rations: Rations;
  cosmonauts: readonly Cosmonaut[];
  sol: number;
}

/** GDD 9: kegagalan, lalu Gold/Silver/Bronze setelah Sol 8. */
export function resolveOutcome(
  input: OutcomeInput,
  maxSols: number,
): GameOutcome | null {
  const depleted = areMetersDepleted(input.meters);
  if (depleted.length > 0) {
    return {
      status: 'lost',
      reason: 'meter-depleted',
      sol: input.sol,
      meters: depleted,
    };
  }

  const allUnwell =
    input.cosmonauts.length > 0 &&
    input.cosmonauts.every(crew => crew.condition === 'unwell');

  if (allUnwell) {
    return {
      status: 'lost',
      reason: 'crew-unwell',
      sol: input.sol,
      meters: [],
      crewIds: input.cosmonauts.map(crew => crew.id),
    };
  }

  if (input.sol < maxSols) return null;

  const meterValues = METER_KEYS.reduce(
    (result, key) => {
      result[key] = input.meters[key].value;
      return result;
    },
    {} as Record<(typeof METER_KEYS)[number], number>,
  );

  const allReady = input.cosmonauts.every(crew => crew.condition === 'ready');
  const noUnwell = input.cosmonauts.every(crew => crew.condition !== 'unwell');
  const allAtLeast = (value: number) =>
    METER_KEYS.every(key => input.meters[key].value >= value);

  let medal: 'gold' | 'silver' | 'bronze' = 'bronze';
  if (
    allAtLeast(70) &&
    allReady &&
    input.rations.food >= 10 &&
    input.rations.water >= 10
  ) {
    medal = 'gold';
  } else if (allAtLeast(40) && noUnwell) {
    medal = 'silver';
  }

  return {
    status: 'won',
    medal,
    sol: input.sol,
    meters: meterValues,
    rations: { ...input.rations },
    conditions: input.cosmonauts.reduce(
      (result, crew) => {
        result[crew.id] = crew.condition;
        return result;
      },
      {} as Record<string, CrewCondition>,
    ),
  };
}

function consumeRations(
  cosmonauts: readonly Cosmonaut[],
  rations: Rations,
): { cosmonauts: Cosmonaut[]; rations: Rations } {
  const next = cosmonauts.map(crew => ({
    ...crew,
    ration: { ...crew.ration },
  }));
  let food = rations.food;
  let water = rations.water;

  for (const crew of next) {
    const gotFood = crew.ration.food && food > 0;
    if (gotFood) food -= 1;

    const gotWater = crew.ration.water && water > 0;
    if (gotWater) water -= 1;

    if (!gotFood && !gotWater) {
      crew.condition = 'unwell';
      crew.fullRationNights = 0;
    } else if (!gotFood || !gotWater) {
      if (crew.condition !== 'unwell') crew.condition = 'tired';
      crew.fullRationNights = 0;
    } else if (crew.condition === 'unwell') {
      crew.fullRationNights += 1;
      if (crew.fullRationNights >= 2) {
        crew.condition = 'ready';
        crew.fullRationNights = 0;
      }
    } else {
      crew.fullRationNights += 1;
    }
  }

  return {
    cosmonauts: next.map(withAvailability),
    rations: {
      food: Math.max(0, food),
      water: Math.max(0, water),
    },
  };
}

function endSol(state: GameState, content: GameContent): GameState {
  if (state.phase !== 'playing' || state.cycle !== 'night') return state;

  const balance = content.balance;

  // 1. Ration dan kondisi kru.
  const consumed = consumeRations(state.cosmonauts, state.rations);
  let cosmonauts = consumed.cosmonauts;
  let rations = consumed.rations;

  // Anxiety Corin: konsumsi tambahan.
  const extraFood = Math.min(rations.food, state.pendingExtraRations.food);
  const extraWater = Math.min(rations.water, state.pendingExtraRations.water);
  rations = {
    food: rations.food - extraFood,
    water: rations.water - extraWater,
  };

  if (
    extraFood < state.pendingExtraRations.food ||
    extraWater < state.pendingExtraRations.water
  ) {
    cosmonauts = cosmonauts.map(crew =>
      crew.id === balance.characterRules.corinAnxiety.cosmonautId
        ? withAvailability({ ...crew, condition: 'unwell' })
        : crew,
    );
  }

  // Corin memulihkan satu astronaut Unwell.
  const corin = cosmonauts.find(
    crew => crew.id === balance.characterRules.corinAnxiety.cosmonautId,
  );
  if (corin && corin.condition !== 'unwell') {
    const unwell = cosmonauts.find(
      crew => crew.id !== corin.id && crew.condition === 'unwell',
    );
    if (unwell) {
      cosmonauts = cosmonauts.map(crew =>
        crew.id === unwell.id
          ? withAvailability({ ...crew, condition: 'ready', fullRationNights: 0 })
          : crew,
      );
    }
  }

  // Upgrade UP-07: menghapus Lelah dari satu astronaut setiap malam.
  let removeTired = state.permanentModifiers.nightlyRemoveTired ?? 0;
  if (removeTired > 0) {
    cosmonauts = cosmonauts.map(crew => {
      if (removeTired > 0 && crew.condition === 'tired') {
        removeTired -= 1;
        return withAvailability({ ...crew, condition: 'ready' });
      }
      return crew;
    });
  }

  // 2. Produksi malam.
  const foodValue = state.meters.food.value;
  const lifeSupportValue = state.meters.lifeSupport.value;
  const powerValue = state.meters.power.value;

  let foodProduced = productionAmount(foodValue, balance.foodProduction);
  if (powerValue < 50) foodProduced -= 1;
  if (powerValue < 30) foodProduced = 0;
  foodProduced +=
    (state.permanentModifiers.foodProductionBonus ?? 0) +
    (state.permanentModifiers.nightlyFood ?? 0);

  if (
    state.permanentModifiers.foodProductionFloor !== undefined &&
    foodValue >= state.permanentModifiers.foodProductionFloor
  ) {
    foodProduced = Math.max(foodProduced, balance.foodProduction.high);
  }

  let waterProduced = productionAmount(
    lifeSupportValue,
    balance.waterProduction,
  );
  waterProduced +=
    (state.permanentModifiers.waterProductionBonus ?? 0) +
    (state.permanentModifiers.nightlyWater ?? 0);

  const dueFollowUps = state.disasterFollowUps.filter(
    followUp => !followUp.cleared && followUp.dueSol <= state.sol,
  );

  for (const followUp of dueFollowUps) {
    if (followUp.id === 'waterPlantFailure') {
      foodProduced = 0;
    }
    if (followUp.id === 'airlockLeak') {
      waterProduced = Math.max(0, waterProduced - 1);
    }
  }

  rations = {
    food: rations.food + Math.max(0, foodProduced),
    water: rations.water + Math.max(0, waterProduced),
  };

  // 3. Irigasi, pemulihan surya, dan penurunan pasif.
  const irrigationWater =
    state.permanentModifiers.irrigationWaterCost ?? balance.irrigation.water;
  const irrigationPower =
    state.permanentModifiers.irrigationPowerCost ?? balance.irrigation.power;

  rations = { ...rations, water: Math.max(0, rations.water - irrigationWater) };

  let meters = applyMeterEffects(state.meters, [
    { meter: 'power', delta: -irrigationPower },
  ]);

  let solarRecovery =
    balance.solarRecovery[state.sol - 1] ?? balance.solarRecovery.at(-1) ?? 8;
  solarRecovery += state.permanentModifiers.nightlyPower ?? 0;

  const dustPenalty = dueFollowUps.some(
    followUp => followUp.id === 'dustStorm',
  );
  if (dustPenalty && !state.permanentModifiers.dustPenaltyImmunity) {
    solarRecovery -= 5;
  }

  meters = applyMeterEffects(meters, [
    { meter: 'power', delta: solarRecovery },
  ]);

  const decay = balance.passiveDecay;
  meters = applyMeterEffects(meters, [
    {
      meter: 'lifeSupport',
      delta: -Math.max(
        0,
        decay.lifeSupport - (state.permanentModifiers.passiveLifeSupport ?? 0),
      ),
    },
    {
      meter: 'shielding',
      delta: -Math.max(
        0,
        decay.shielding - (state.permanentModifiers.passiveShielding ?? 0),
      ),
    },
    {
      meter: 'power',
      delta: -Math.max(
        0,
        decay.power - (state.permanentModifiers.passivePower ?? 0),
      ),
    },
    {
      meter: 'food',
      delta: -Math.max(
        0,
        decay.food - (state.permanentModifiers.passiveFood ?? 0),
      ),
    },
  ]);

  // 4. Penalti repair yang tidak terbayar.
  if (state.pendingNightPenalty > 0) {
    meters = applyMeterEffects(
      meters,
      METER_KEYS.map(key => ({
        meter: key,
        delta: -state.pendingNightPenalty,
      })),
    );
  }

  // 5. Efek tertunda.
  const dueEffects = state.pendingEffects.filter(
    pending => pending.dueSol <= state.sol,
  );
  const pendingEffects = state.pendingEffects.filter(
    pending => pending.dueSol > state.sol,
  );

  if (dueEffects.length > 0) {
    const flat = dueEffects.flatMap(pending => pending.effects);
    meters = applyMeterEffects(meters, flat);
    rations = applyRationEffects(rations, flat);
    const conditionResult = applyConditionEffects(
      cosmonauts,
      flat,
      [],
      state.rngState,
    );
    cosmonauts = conditionResult.cosmonauts;
    state = { ...state, rngState: conditionResult.rngState };
  }

  // 5b. Ambang meter (GDD 3).
  // Power < 30: Life Support -5 setiap malam.
  if (meters.power.value < 30) {
    meters = applyMeterEffects(meters, [
      { meter: 'lifeSupport', delta: -5 },
    ]);
  }

  // Life Support < 30: seluruh kru menjadi Lelah.
  if (meters.lifeSupport.value < 30) {
    cosmonauts = cosmonauts.map(crew =>
      crew.condition === 'unwell'
        ? crew
        : withAvailability({ ...crew, condition: 'tired' }),
    );
  }

  // Food System < 30: kru berisiko Tertekan.
  if (meters.food.value < 30) {
    const candidates = cosmonauts.filter(crew => crew.condition !== 'unwell');
    if (candidates.length > 0) {
      const roll = nextRandom(state.rngState);
      state = { ...state, rngState: roll.rngState };
      if (roll.value < 0.3) {
        const pick = nextRandom(state.rngState);
        state = { ...state, rngState: pick.rngState };
        const target =
          candidates[
            Math.min(
              candidates.length - 1,
              Math.floor(pick.value * candidates.length),
            )
          ];
        cosmonauts = cosmonauts.map(crew =>
          crew.id === target.id
            ? withAvailability({
                ...crew,
                condition: 'stressed',
                fullRationNights: 0,
              })
            : crew,
        );
      }
    }
  }

  // Radiation Shielding < 30: 50% risiko Tidak Sehat, termasuk di habitat.
  if (
    meters.shielding.value < 30 &&
    !state.permanentModifiers.unwellImmunity
  ) {
    const candidates = cosmonauts.filter(crew => crew.condition !== 'unwell');
    if (candidates.length > 0) {
      const roll = nextRandom(state.rngState);
      state = { ...state, rngState: roll.rngState };
      if (roll.value < 0.5) {
        const pick = nextRandom(state.rngState);
        state = { ...state, rngState: pick.rngState };
        const target =
          candidates[
            Math.min(
              candidates.length - 1,
              Math.floor(pick.value * candidates.length),
            )
          ];
        cosmonauts = cosmonauts.map(crew =>
          crew.id === target.id
            ? withAvailability({
                ...crew,
                condition: 'unwell',
                fullRationNights: 0,
              })
            : crew,
        );
      }
    }
  }

  // 6. Selesai: cek gagal/menang.
  const outcome = resolveOutcome(
    { meters, rations, cosmonauts, sol: state.sol },
    balance.maxSols,
  );

  if (outcome) {
    return {
      ...state,
      meters,
      rations,
      cosmonauts: tickCrew(cosmonauts),
      phase: outcome.status === 'lost' || state.sol >= balance.maxSols
        ? 'ended'
        : 'playing',
      outcome,
      phaseState: 'night',
      pendingEffects,
      pendingExtraRations: { food: 0, water: 0 },
      pendingNightPenalty: 0,
      activeDisaster: null,
      hand: [],
      morningGroups: [],
      morningPicks: [],
      selectedCardIds: [],
      assignments: [],
    };
  }

  const nextSol = state.sol + 1;
  const nextState: GameState = {
    ...state,
    sol: nextSol,
    cycle: 'morning',
    phase: 'playing',
    phaseState: 'selecting',
    meters,
    rations,
    cosmonauts: tickCrew(cosmonauts),
    pendingEffects,
    pendingExtraRations: { food: 0, water: 0 },
    pendingNightPenalty: 0,
    disasterFollowUps: state.disasterFollowUps.filter(
      followUp => !followUp.cleared && followUp.dueSol > state.sol,
    ),
    activeDisaster: null,
    explorationBlockedUntilSol:
      state.explorationBlockedUntilSol !== null &&
      state.explorationBlockedUntilSol >= nextSol
        ? state.explorationBlockedUntilSol
        : null,
    evaUnwellRiskUntilSol:
      state.evaUnwellRiskUntilSol !== null &&
      state.evaUnwellRiskUntilSol >= nextSol
        ? state.evaUnwellRiskUntilSol
        : null,
    hand: [],
    morningGroups: [],
    morningPicks: [],
    selectedCardIds: [],
    assignments: [],
    outcome: null,
  };

  return enterPhase(nextState, 'morning', content);
}

// ---------------------------------------------------------------------------
// Transition
// ---------------------------------------------------------------------------

export function transition(
  state: GameState,
  action: GameAction,
  content: GameContent = DEFAULT_CONTENT,
): GameState {
  switch (action.type) {
    case 'START':
      if (state.phase !== 'idle') return state;
      return startGame(action.seed, content);

    case 'RESTART':
      return startGame(action.seed, content);

    case 'SELECT_DAILY':
      return selectDaily(state, action.groupIndex, action.cardId);

    case 'CONFIRM_MORNING':
      return confirmMorning(state, action.playNow ?? [], content);

    case 'SELECT_CARD':
      return selectCard(state, action.cardId);

    case 'ASSIGN':
      return assignCosmonaut(state, action.cosmonautId);

    case 'UNASSIGN':
      return unassignCosmonaut(state, action.cosmonautId);

    case 'EXECUTE_CARD':
      return executeCard(state, content);

    case 'REJECT_CARD':
      return rejectCard(state, content);

    case 'SELECT_REPAIR':
      return selectRepair(
        state,
        action.cardId,
        action.cosmonautIds ?? [],
        content,
      );

    case 'SKIP_REPAIR':
      return skipRepair(state, content);

    case 'SET_RATION':
      return setRation(
        state,
        action.cosmonautId,
        action.food,
        action.water,
      );

    case 'ADVANCE_CYCLE':
      return advanceCycle(state, content);

    case 'END_SOL':
      return endSol(state, content);

    default:
      return state;
  }
}

export function gameReducer(
  state: GameState,
  action: GameAction,
): GameState {
  return transition(state, action, DEFAULT_CONTENT);
}
