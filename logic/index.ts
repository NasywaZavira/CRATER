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
  getDayForecast,
  resolveOutcome,
  transition,
  gameReducer,
} from './gameReducer';
export type { OutcomeInput } from './gameReducer';

export type {
  ActiveBuff,
  ActiveMission,
  DayForecast,
  DayForecastPlanEntry,
  EndingId,
  MorningConfirmationCheck,
  MorningConfirmationReason,
  MorningPlay,
  MorningPlayInput,
  SolReport,
  StoredCard,
} from '../types';

export { parseSave, serializeSave } from './save';
export type { ParseSaveResult, SaveError, SaveFile } from './save';

export {
  createLocalStorageSaveStorage,
  createMemorySaveStorage,
} from './storage';
export type { SaveStorage } from './storage';

export {
  DISASTER_DAMAGE,
  DUST_STORM_POWER_RECOVERY_PENALTY,
  SEP_FOLLOWUP_SHIELDING_THRESHOLD,
  SEP_UNWELL_SHIELDING_THRESHOLD,
} from '../data/disasters';
export type { DisasterDamage } from '../data/disasters';

export {
  CREW_FAILURE_TEXT,
  ENDING_TITLES,
  METER_FAILURE_TEXT,
} from '../data/endings';

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
