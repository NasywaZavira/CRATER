import type { CardDefinition, GameState, Meters, PendingEffect, ResourceKey } from '../types';
import { CARD_BY_ID } from '../data/cards';
import { METER_KEYS } from './meters';
import { SCHEMA_VERSION } from './version';
export type SaveError = 'not-json' | 'wrong-format' | 'too-new' | 'unsupported-version' | 'invalid-shape' | 'unknown-card';
export type ParseSaveResult = { ok: true; state: GameState } | { ok: false; error: SaveError };
export interface SaveFile { format: 'crater-save'; schemaVersion: number; savedAt: string; state: unknown }
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
function ids(cards: CardDefinition[]): string[] { return cards.map(c => c.id); }
export function serializeSave(state: GameState, savedAt: string = new Date().toISOString()): string {
  return JSON.stringify({
    format: 'crater-save', schemaVersion: SCHEMA_VERSION, savedAt,
    state: {
      ...state,
      hand: ids(state.hand),
      activeDisaster: state.activeDisaster
        ? { ...state.activeDisaster, repairChoices: ids(state.activeDisaster.repairChoices) } : null,
    },
  } satisfies SaveFile);
}
function loadCards(value: unknown): CardDefinition[] | null {
  if (!Array.isArray(value)) return null;
  const result: CardDefinition[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    // Memuat hanya dari library JSON, tidak mempercayai objek kartu dari save.
    const id = typeof item === 'string' ? item : record(item) && typeof item.id === 'string' ? item.id : null;
    if (id === null || seen.has(id) || !CARD_BY_ID.has(id)) return null;
    seen.add(id);
    result.push(CARD_BY_ID.get(id)!);
  }
  return result;
}
function validEffects(value: unknown): boolean {
  return record(value) && Object.keys(value).length === METER_KEYS.length && METER_KEYS.every(k => typeof value[k] === 'number' && Number.isFinite(value[k]));
}
function validMeters(value: unknown): value is Meters {
  return record(value) && METER_KEYS.every(k => {
    const meter = value[k];
    return record(meter) && meter.id === k && typeof meter.value === 'number' && Number.isFinite(meter.value)
      && meter.value >= 0 && meter.value <= 100 && typeof meter.min === 'number' && typeof meter.max === 'number'
      && meter.min <= meter.value && meter.max >= meter.value;
  });
}
export function parseSave(input: string): ParseSaveResult {
  let root: unknown;
  try { root = JSON.parse(input); } catch { return { ok: false, error: 'not-json' }; }
  if (!record(root) || root.format !== 'crater-save' || !record(root.state)) return { ok: false, error: 'wrong-format' };
  if (typeof root.schemaVersion !== 'number' || !Number.isInteger(root.schemaVersion)) return { ok: false, error: 'wrong-format' };
  if (root.schemaVersion > SCHEMA_VERSION) return { ok: false, error: 'too-new' };
  // Kartu DR/RS/BL/RP tidak dapat secara aman dimigrasi ke 20 ID baru.
  if (root.schemaVersion < SCHEMA_VERSION) return { ok: false, error: 'unsupported-version' };
  const raw = root.state;
  const hand = loadCards(raw.hand);
  if (hand === null) return { ok: false, error: 'unknown-card' };
  let activeDisaster = null;
  if (raw.activeDisaster !== null) {
    if (!record(raw.activeDisaster)) return { ok: false, error: 'invalid-shape' };
    const choices = loadCards(raw.activeDisaster.repairChoices);
    if (choices === null || choices.some(c => c.category !== 'repair')) return { ok: false, error: 'unknown-card' };
    activeDisaster = { ...raw.activeDisaster, repairChoices: choices };
  }
  if (!validMeters(raw.meters) || !Array.isArray(raw.pendingEffects) || !Array.isArray(raw.playedCards)
    || !Array.isArray(raw.skippedCardIds) || !Array.isArray(raw.solReports)
    || !Array.isArray(raw.disasterHistory) || !Array.isArray(raw.cosmonauts) || !record(raw.rations)
    || typeof raw.rations.food !== 'number' || typeof raw.rations.water !== 'number'
    || !Number.isInteger(raw.sol) || typeof raw.sol !== 'number' || raw.sol < 0
    || typeof raw.seed !== 'number' || typeof raw.rngState !== 'number'
    || !['idle', 'playing', 'ended'].includes(String(raw.phase))
    || !['morning', 'afternoon', 'evening', 'night'].includes(String(raw.cycle))
    || !['selecting', 'resolved', 'repair', 'night'].includes(String(raw.phaseState))
    || (raw.selectedCardId !== null && (typeof raw.selectedCardId !== 'string' || !hand.some(c => c.id === raw.selectedCardId)))) {
    return { ok: false, error: 'invalid-shape' };
  }
  const pending = raw.pendingEffects as PendingEffect[];
  if (pending.some(e => !record(e) || !CARD_BY_ID.has(e.cardId) || !Number.isInteger(e.dueSol)
    || !Number.isInteger(e.playedSol) || e.dueSol <= e.playedSol || !validEffects(e.effects))) {
    return { ok: false, error: 'invalid-shape' };
  }
  return { ok: true, state: { ...raw, schemaVersion: SCHEMA_VERSION, hand, activeDisaster } as unknown as GameState };
}
