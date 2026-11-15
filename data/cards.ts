import rawCards from './cards.json';
import type { CardCategory, CardDefinition, Localized, MeterEffects, ResourceKey } from '../types';

export const RESOURCE_KEYS: readonly ResourceKey[] = ['lifeSupport', 'shielding', 'power', 'food'];
export const CARD_CATEGORIES: readonly CardCategory[] = ['operations', 'construction', 'repair', 'research'];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[cards.json] ${message}`);
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function validateLocalized(value: unknown, id: string, field: string): asserts value is Localized {
  assert(record(value) && typeof value.en === 'string' && value.en.trim().length > 0, `${id}: ${field}.en required`);
  if (value.id !== undefined) assert(typeof value.id === 'string', `${id}: ${field}.id must be string`);
}
function validateEffects(value: unknown, id: string, isInstant: boolean): asserts value is MeterEffects {
  assert(record(value), `${id}: effects must be a complete meter record`);
  assert(Object.keys(value).length === RESOURCE_KEYS.length, `${id}: exactly 4 meter keys required`);
  for (const key of RESOURCE_KEYS) {
    assert(typeof value[key] === 'number' && Number.isFinite(value[key]) && Number.isInteger(value[key]), `${id}: ${key} must be a finite integer`);
  }
  if (isInstant) {
    const values = RESOURCE_KEYS.map(key => value[key] as number);
    assert(values.filter(n => n !== 0).length <= 3, `${id}: max 3 non-zero immediate effects`);
    assert(values.some(n => n < 0), `${id}: immediate effects require at least one negative`);
  }
}
/** Runtime validation protects saves/gameplay if JSON is edited without TypeScript checks. */
export function validateCards(input: unknown): asserts input is CardDefinition[] {
  assert(Array.isArray(input) && input.length > 0, 'expected a non-empty card array');
  const ids = new Set<string>();
  for (const item of input) {
    assert(record(item), 'each card must be an object');
    const id = typeof item.id === 'string' ? item.id : '<unknown>';
    assert(id !== '<unknown>' && id.trim().length > 0 && !ids.has(id), `${id}: missing or duplicate ID`);
    ids.add(id);
    assert(CARD_CATEGORIES.includes(item.category as CardCategory), `${id}: invalid category`);
    validateLocalized(item.title, id, 'title');
    validateLocalized(item.description, id, 'description');
    assert(typeof item.artKey === 'string' && item.artKey.trim().length > 0, `${id}: artKey missing`);
    assert(record(item.fact) && typeof item.fact.dataset === 'string' && item.fact.dataset.length > 0, `${id}: fact.dataset missing`);
    assert(typeof item.fact.sourceName === 'string' && item.fact.sourceName.length > 0, `${id}: fact.sourceName missing`);
    assert(item.fact.sourceUrl === null || (typeof item.fact.sourceUrl === 'string' && item.fact.sourceUrl.trim().length > 0), `${id}: invalid fact.sourceUrl`);
    validateEffects(item.effects, id, true);
    if (item.delayed !== undefined) {
      assert(record(item.delayed) && Number.isInteger(item.delayed.afterSols) && (item.delayed.afterSols as number) >= 1, `${id}: delayed.afterSols must be positive integer`);
      validateEffects(item.delayed.effects, `${id}.delayed`, false);
    }
  }
}

validateCards(rawCards);
export const CARD_LIBRARY: readonly CardDefinition[] = rawCards;
export const CARD_BY_ID: ReadonlyMap<string, CardDefinition> = new Map(CARD_LIBRARY.map(card => [card.id, card]));
export function localize(value: Localized, language: 'en' | 'id' = 'en'): string {
  return value[language] || value.en;
}
/** Presentational helper: 0 is “—”, not a zero-point effect to apply. */
export function formatCardEffect(value: number): string {
  return value === 0 ? '—' : value > 0 ? `+${value}` : String(value);
}
