export { SCHEMA_VERSION } from './version';

export { normalizeSeed, nextRandom } from './rng';
export type { RandomStep } from './rng';

export { DrawError } from './errors';
export type { DrawErrorDetails } from './errors';

export {
  CYCLES,
  CYCLE_CATEGORIES,
  CYCLE_LABELS,
  cycleIndex,
  getNextCycle,
  isCardAllowedInCycle,
} from './cycle';

export {
  drawHand,
  drawMorningGroups,
  drawRepairChoices,
  eligibleCards,
} from './draw';
export type {
  DrawHandParams,
  DrawHandResult,
  MorningDrawResult,
} from './draw';

export {
  METER_KEYS,
  clamp,
  applyMeterEffects,
  applyRationEffects,
  areMetersDepleted,
  canAfford,
  isMeterEffect,
  isRationEffect,
} from './meters';

export { evaluateMissionCharacters } from './characterEffects';
export type {
  CharacterEffectEvent,
  CharacterEffectSource,
  MissionCharacterResult,
} from './characterEffects';

export {
  CARD_LIBRARY,
  COSMONAUT_ROSTER,
  DEFAULT_CONTENT,
  createCosmonauts,
} from './content';
export type {
  CosmonautRosterEntry,
  GameContent,
} from './content';

export {
  createInitialMeters,
  createInitialRations,
  createInitialState,
  startGame,
} from './initialState';

export {
  canConfirmMorning,
  effectiveCosts,
  resolveOutcome,
  transition,
  gameReducer,
} from './gameReducer';
export type { OutcomeInput } from './gameReducer';

export type {
  MorningConfirmationCheck,
  MorningConfirmationReason,
  MorningPlay,
  MorningPlayInput,
} from '../types';

export { validateBalance } from './validateBalance';

export {
  BALANCE,
  DISASTER_IDS,
  DISASTER_LABELS,
  METER_DEFINITIONS,
  METER_LABELS,
  PASSIVE_DECAY,
  SOLAR_RECOVERY,
  CHARACTER_RULES,
} from '../data/balance';
export type {
  BalanceConfig,
  CharacterRules,
  MeterDefinition,
  ProductionRule,
} from '../data/balance';
