import type { GameState, Meters, Rations } from '../types';
import { createCosmonauts, DEFAULT_CONTENT, type GameContent } from './content';
import { drawMorningGroups } from './draw';
import { clamp, METER_KEYS } from './meters';
import { normalizeSeed } from './rng';
import { SCHEMA_VERSION } from './version';
import { validateBalance } from './validateBalance';

export function createInitialMeters(
  content: GameContent = DEFAULT_CONTENT,
): Meters {
  const meters = {} as Meters;

  for (const key of METER_KEYS) {
    const definition = content.meterDefinitions[key];

    meters[key] = {
      id: key,
      label: definition.label,
      value: clamp(
        Math.round(content.balance.startingMeters || definition.initial),
        definition.min,
        definition.max,
      ),
      min: definition.min,
      max: definition.max,
    };
  }

  return meters;
}

export function createInitialRations(
  content: GameContent = DEFAULT_CONTENT,
): Rations {
  return { ...content.balance.startingRations };
}

export function createInitialState(
  content: GameContent = DEFAULT_CONTENT,
): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    seed: 0,
    sol: 0,
    cycle: 'morning',
    phase: 'idle',
    phaseState: 'selecting',

    meters: createInitialMeters(content),
    rations: createInitialRations(content),
    cosmonauts: createCosmonauts(content),

    hand: [],
    morningGroups: [],
    morningPicks: [],
    selectedCardIds: [],
    assignments: [],

    commandHand: [],

    permanentModifiers: {},
    nextExplorationRiskReduction: 0,
    pendingEffects: [],
    pendingExtraRations: { food: 0, water: 0 },
    pendingNightPenalty: 0,

    disasterHistory: [],
    activeDisaster: null,
    disasterFollowUps: [],
    lastDisasterPhase: null,
    explorationBlockedUntilSol: null,
    evaUnwellRiskUntilSol: null,

    rngState: 0,
    outcome: null,
  };
}

export function startGame(
  seed: number,
  content: GameContent = DEFAULT_CONTENT,
): GameState {
  validateBalance(content.balance);

  const normalizedSeed = normalizeSeed(seed);
  const base = createInitialState(content);

  // Sol 1 pagi tidak pernah memunculkan bencana (GDD 6.1).
  const draw = drawMorningGroups(
    content.cards,
    content.balance.dailyGroups,
    content.balance.dailyPerGroup,
    normalizedSeed,
  );

  return {
    ...base,
    seed: normalizedSeed,
    sol: 1,
    phase: 'playing',
    phaseState: 'selecting',
    morningGroups: draw.groups,
    morningPicks: draw.groups.map(() => null),
    rngState: draw.rngState,
  };
}
