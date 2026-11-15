import type { CardCategory, CardDefinition, Cycle } from '../types';
import { CYCLE_CATEGORIES } from './cycle';
import { DrawError } from './errors';
import { nextRandom } from './rng';
export interface DrawResult { hand: CardDefinition[]; rngState: number }
/** Kartu unik dalam satu penawaran, dapat muncul kembali pada Sol lain. */
export function drawFromCategory(
  cards: readonly CardDefinition[], category: CardCategory, count: number, rngState: number,
  cycle: Cycle = 'morning',
): DrawResult {
  const pool = cards.filter(c => c.category === category).slice().sort((a, b) => a.id.localeCompare(b.id));
  if (!Number.isInteger(count) || count < 0) throw new RangeError('Card count must be non-negative integer');
  if (pool.length < count) throw new DrawError(cycle, count, pool.length);
  let state = rngState >>> 0;
  for (let i = 0; i < count; i++) {
    const roll = nextRandom(state);
    state = roll.rngState;
    const j = i + Math.floor(roll.value * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return { hand: pool.slice(0, count), rngState: state };
}
export function drawHand(args: { cards: readonly CardDefinition[]; cycle: Cycle; handSize: number; rngState: number }): DrawResult {
  const category = CYCLE_CATEGORIES[args.cycle][0];
  if (!category) {
    if (args.handSize === 0) return { hand: [], rngState: args.rngState };
    throw new DrawError(args.cycle, args.handSize, 0);
  }
  return drawFromCategory(args.cards, category, args.handSize, args.rngState, args.cycle);
}
export function drawRepairChoices(cards: readonly CardDefinition[], count: number, rngState: number): DrawResult {
  return drawFromCategory(cards, 'repair', count, rngState, 'morning');
}
