import type {
  ActiveBuff,
  ActiveDisaster,
  Card,
  CrewCondition,
  Cycle,
  GamePhase,
  GameState,
  MeterKey,
  PhaseState,
  SolReport,
} from '../types';
import { CARD_LIBRARY } from './content';
import { COSMONAUT_ROSTER } from './content';
import { SCHEMA_VERSION } from './version';
import { ENDING_TITLES, METER_FAILURE_TEXT } from '../data/endings';
import { CREW_FAILURE_TEXT } from '../data/endings';

export type SaveError =
  | 'not-json'
  | 'wrong-format'
  | 'too-new'
  | 'invalid-shape'
  | 'unknown-card';

export type ParseSaveResult =
  | { ok: true; state: GameState; migratedFrom?: number }
  | { ok: false; error: SaveError };

export interface SaveFile {
  format: 'crater-save';
  schemaVersion: number;
  savedAt: string;
  state: unknown;
}

const CARD_BY_ID = new Map(CARD_LIBRARY.map(card => [card.id, card]));
const ROSTER_IDS = COSMONAUT_ROSTER.map(crew => crew.id);
const METER_KEYS: readonly MeterKey[] = [
  'lifeSupport',
  'shielding',
  'power',
  'food',
];
const CYCLES: readonly Cycle[] = [
  'morning',
  'afternoon',
  'evening',
  'night',
];
const PHASES: readonly GamePhase[] = ['idle', 'playing', 'ended'];
const PHASE_STATES: readonly PhaseState[] = [
  'selecting',
  'executed',
  'rejected',
  'repair',
  'night',
];
const CONDITIONS: readonly CrewCondition[] = [
  'ready',
  'tired',
  'stressed',
  'unwell',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cardId(value: unknown): string | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  return value.id;
}

function serializeState(state: GameState): unknown {
  return {
    ...state,
    hand: state.hand.map(card => card.id),
    morningGroups: state.morningGroups.map(group =>
      group.map(card => card.id),
    ),
    activeDisaster: state.activeDisaster
      ? {
          ...state.activeDisaster,
          repairChoices: state.activeDisaster.repairChoices.map(
            card => card.id,
          ),
        }
      : null,
  };
}

export function serializeSave(state: GameState, savedAt: string): string {
  const file: SaveFile = {
    format: 'crater-save',
    schemaVersion: SCHEMA_VERSION,
    savedAt,
    state: serializeState(state),
  };
  return JSON.stringify(file);
}

function migrateV2(rawState: Record<string, unknown>, sol: number): Record<string, unknown> {
  const migrated: Record<string, unknown> = {
    ...rawState,
    schemaVersion: SCHEMA_VERSION,
    commandHand: [],
    activeBuffs: [],
    dayForecast: null,
    todayLog: [],
    todayPlayedCardIds: [],
    todayRejectedCardIds: [],
    solReports: [],
    activeMissions: [],
  };

  const legacyReduction = rawState.nextExplorationRiskReduction;
  if (typeof legacyReduction === 'number' && legacyReduction > 0) {
    migrated.activeBuffs = [
      {
        id: `legacy:exploration-risk-reduction:${sol}`,
        cardId: 'DR-08',
        kind: 'exploration-risk-reduction',
        value: legacyReduction,
        expiresAfterSol: sol + 1,
      } satisfies ActiveBuff,
    ];
  }
  delete migrated.nextExplorationRiskReduction;

  const outcome = rawState.outcome;
  if (isRecord(outcome)) {
    if (outcome.status === 'won') {
      const medal =
        outcome.medal === 'gold' ||
        outcome.medal === 'silver' ||
        outcome.medal === 'bronze'
          ? outcome.medal
          : 'bronze';
      migrated.outcome = {
        ...outcome,
        endingId: medal,
        endingTitle: ENDING_TITLES[medal],
      };
    } else if (outcome.status === 'lost') {
      const meters = Array.isArray(outcome.meters)
        ? (outcome.meters as MeterKey[])
        : [];
      migrated.outcome = {
        ...outcome,
        endingId: 'abort',
        endingTitle: ENDING_TITLES.abort,
        failureText:
          meters.length > 0
            ? meters.map(meter => METER_FAILURE_TEXT[meter]).join('; ')
            : CREW_FAILURE_TEXT,
      };
    }
  }

  return migrated;
}

function hydrateCardId(id: unknown): Card | null {
  if (typeof id !== 'string') return null;
  return CARD_BY_ID.get(id) ?? null;
}

function hydrateCardList(value: unknown): Card[] | null {
  if (!Array.isArray(value)) return null;
  const cards: Card[] = [];
  for (const entry of value) {
    const id = typeof entry === 'string' ? entry : cardId(entry);
    const card = hydrateCardId(id);
    if (!card) return null;
    cards.push(card);
  }
  return cards;
}

function hydrateGroups(value: unknown): Card[][] | null {
  if (!Array.isArray(value)) return null;
  const groups: Card[][] = [];
  for (const group of value) {
    const cards = hydrateCardList(group);
    if (!cards) return null;
    groups.push(cards);
  }
  return groups;
}

function hydrateDisaster(value: unknown): ActiveDisaster | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;

  const repairChoices = hydrateCardList(value.repairChoices);
  if (!repairChoices) return undefined;

  if (
    typeof value.id !== 'string' ||
    typeof value.resolved !== 'boolean' ||
    typeof value.clearedFollowUp !== 'boolean'
  ) {
    return undefined;
  }

  return {
    id: value.id as ActiveDisaster['id'],
    repairChoices,
    resolved: value.resolved,
    clearedFollowUp: value.clearedFollowUp,
  };
}

function validateCommandHand(
  value: unknown,
  capacity: number,
): { cardId: string; remainingSols: number }[] | null {
  if (!Array.isArray(value) || value.length > capacity) return null;

  const result: { cardId: string; remainingSols: number }[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return null;
    if (typeof entry.cardId !== 'string' || !CARD_BY_ID.has(entry.cardId)) {
      return null;
    }
    if (
      typeof entry.remainingSols !== 'number' ||
      !Number.isInteger(entry.remainingSols) ||
      entry.remainingSols < 1
    ) {
      return null;
    }
    result.push({
      cardId: entry.cardId,
      remainingSols: entry.remainingSols,
    });
  }
  return result;
}

function validateBuffs(value: unknown): ActiveBuff[] | null {
  if (!Array.isArray(value)) return null;

  const result: ActiveBuff[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return null;
    if (
      typeof entry.id !== 'string' ||
      typeof entry.cardId !== 'string' ||
      !CARD_BY_ID.has(entry.cardId) ||
      typeof entry.kind !== 'string' ||
      typeof entry.value !== 'number' ||
      typeof entry.expiresAfterSol !== 'number' ||
      !Number.isInteger(entry.expiresAfterSol)
    ) {
      return null;
    }
    result.push({
      id: entry.id,
      cardId: entry.cardId,
      kind: entry.kind as ActiveBuff['kind'],
      value: entry.value,
      expiresAfterSol: entry.expiresAfterSol,
    });
  }
  return result;
}

function validateReports(value: unknown): SolReport[] | null {
  if (!Array.isArray(value)) return null;
  return value as SolReport[];
}

function validateState(rawState: unknown, capacity: number): GameState | null {
  if (!isRecord(rawState)) return null;

  if (
    typeof rawState.seed !== 'number' ||
    !Number.isInteger(rawState.seed) ||
    rawState.seed < 0 ||
    rawState.seed > 0xffffffff ||
    typeof rawState.sol !== 'number' ||
    !Number.isInteger(rawState.sol) ||
    rawState.sol < 1 ||
    rawState.sol > 8 ||
    typeof rawState.cycle !== 'string' ||
    !CYCLES.includes(rawState.cycle as Cycle) ||
    typeof rawState.phase !== 'string' ||
    !PHASES.includes(rawState.phase as GamePhase) ||
    typeof rawState.phaseState !== 'string' ||
    !PHASE_STATES.includes(rawState.phaseState as PhaseState) ||
    typeof rawState.rngState !== 'number' ||
    !Number.isInteger(rawState.rngState) ||
    rawState.rngState < 0 ||
    rawState.rngState > 0xffffffff
  ) {
    return null;
  }

  if (!isRecord(rawState.meters) || !isRecord(rawState.rations)) return null;

  const meters = rawState.meters;
  for (const key of METER_KEYS) {
    const meter = meters[key];
    if (!isRecord(meter)) return null;
    if (
      typeof meter.value !== 'number' ||
      !Number.isInteger(meter.value) ||
      meter.value < 0 ||
      meter.value > 100
    ) {
      return null;
    }
  }

  if (
    typeof rawState.rations.food !== 'number' ||
    rawState.rations.food < 0 ||
    typeof rawState.rations.water !== 'number' ||
    rawState.rations.water < 0
  ) {
    return null;
  }

  if (!Array.isArray(rawState.cosmonauts)) return null;
  if (rawState.cosmonauts.length !== ROSTER_IDS.length) return null;

  const crewIds = new Set<string>();
  for (const crew of rawState.cosmonauts) {
    if (!isRecord(crew) || typeof crew.id !== 'string') return null;
    if (!ROSTER_IDS.includes(crew.id)) return null;
    if (crewIds.has(crew.id)) return null;
    crewIds.add(crew.id);

    if (
      typeof crew.condition !== 'string' ||
      !CONDITIONS.includes(crew.condition as CrewCondition) ||
      typeof crew.cooldown !== 'number' ||
      !Number.isInteger(crew.cooldown) ||
      crew.cooldown < 0
    ) {
      return null;
    }
  }
  if (crewIds.size !== ROSTER_IDS.length) return null;

  const hand = hydrateCardList(rawState.hand);
  const morningGroups = hydrateGroups(rawState.morningGroups);
  const activeDisaster = hydrateDisaster(rawState.activeDisaster);
  if (!hand || !morningGroups || activeDisaster === undefined) return null;

  const commandHand = validateCommandHand(rawState.commandHand, capacity);
  if (!commandHand) return null;

  const activeBuffs = validateBuffs(rawState.activeBuffs);
  const solReports = validateReports(rawState.solReports);
  if (!activeBuffs || !solReports) return null;

  if (!Array.isArray(rawState.activeMissions)) return null;
  if (!Array.isArray(rawState.todayLog)) return null;
  if (!Array.isArray(rawState.todayPlayedCardIds)) return null;
  if (!Array.isArray(rawState.todayRejectedCardIds)) return null;

  if (rawState.phase === 'ended') {
    if (!isRecord(rawState.outcome)) return null;
  } else if (rawState.outcome !== null) {
    return null;
  }

  return {
    ...(rawState as unknown as GameState),
    schemaVersion: SCHEMA_VERSION,
    hand,
    morningGroups,
    activeDisaster,
    commandHand,
    activeBuffs,
    solReports,
  };
}

function findUnknownCardId(rawState: Record<string, unknown>): string | null {
  const candidates: unknown[] = [];

  candidates.push(rawState.hand);
  candidates.push(rawState.morningGroups);
  candidates.push(rawState.todayPlayedCardIds);
  candidates.push(rawState.todayRejectedCardIds);

  if (Array.isArray(rawState.solReports)) {
    for (const report of rawState.solReports) {
      if (isRecord(report)) {
        candidates.push(report.playedCardIds);
        candidates.push(report.rejectedCardIds);
      }
    }
  }

  if (isRecord(rawState.activeDisaster)) {
    candidates.push(rawState.activeDisaster.repairChoices);
  }

  if (Array.isArray(rawState.commandHand)) {
    candidates.push(
      rawState.commandHand.map(entry =>
        isRecord(entry) ? entry.cardId : undefined,
      ),
    );
  }

  if (Array.isArray(rawState.activeBuffs)) {
    candidates.push(
      rawState.activeBuffs.map(entry =>
        isRecord(entry) ? entry.cardId : undefined,
      ),
    );
  }

  if (Array.isArray(rawState.activeMissions)) {
    candidates.push(
      rawState.activeMissions.map(entry =>
        isRecord(entry) ? entry.cardId : undefined,
      ),
    );
  }

  const flatten = (value: unknown): unknown[] => {
    if (Array.isArray(value)) return value.flatMap(flatten);
    return [value];
  };

  for (const candidate of candidates.flatMap(flatten)) {
    if (typeof candidate !== 'string') continue;
    if (!CARD_BY_ID.has(candidate)) return candidate;
  }

  return null;
}

export function parseSave(
  json: string,
  capacity = 4,
): ParseSaveResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'not-json' };
  }

  if (!isRecord(parsed) || parsed.format !== 'crater-save') {
    return { ok: false, error: 'wrong-format' };
  }

  const version =
    typeof parsed.schemaVersion === 'number'
      ? parsed.schemaVersion
      : Number.NaN;

  if (!Number.isInteger(version)) {
    return { ok: false, error: 'wrong-format' };
  }

  if (version > SCHEMA_VERSION) {
    return { ok: false, error: 'too-new' };
  }

  if (version < 2) {
    return { ok: false, error: 'invalid-shape' };
  }

  let rawState = parsed.state;
  if (!isRecord(rawState)) {
    return { ok: false, error: 'invalid-shape' };
  }

  let migratedFrom: number | undefined;
  if (version < SCHEMA_VERSION) {
    const sol = typeof rawState.sol === 'number' ? rawState.sol : 1;
    rawState = migrateV2(rawState, sol);
    migratedFrom = version;
  }

  if (findUnknownCardId(rawState as Record<string, unknown>)) {
    return { ok: false, error: 'unknown-card' };
  }

  const state = validateState(rawState, capacity);
  if (!state) {
    return { ok: false, error: 'invalid-shape' };
  }

  return { ok: true, state, ...(migratedFrom ? { migratedFrom } : {}) };
}
