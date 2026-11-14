import type { Card, Cycle, DisasterId } from '../types';
import { isCardAllowedInCycle } from './cycle';
import { DrawError } from './errors';
import { nextRandom } from './rng';

export interface DrawHandParams {
  cards: readonly Card[];
  cycle: Cycle;
  handSize: number;
  rngState: number;
}

export interface DrawHandResult {
  hand: Card[];
  rngState: number;
}

export function eligibleCards(
  cards: readonly Card[],
  cycle: Cycle,
): Card[] {
  const seen = new Set<string>();

  return cards
    .filter(card => {
      if (seen.has(card.id)) return false;
      if (!isCardAllowedInCycle(card, cycle)) return false;
      seen.add(card.id);
      return true;
    })
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function shuffleTake(
  pool: readonly Card[],
  count: number,
  rngState: number,
): DrawHandResult {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(
      `count must be a non-negative integer, received ${count}.`,
    );
  }

  const working = pool.slice();
  let state = rngState >>> 0;

  for (let i = 0; i < count; i += 1) {
    const roll = nextRandom(state);
    state = roll.rngState;

    const j = i + Math.floor(roll.value * (working.length - i));
    const tmp = working[i];
    working[i] = working[j];
    working[j] = tmp;
  }

  return { hand: working.slice(0, count), rngState: state };
}

export function drawHand({
  cards,
  cycle,
  handSize,
  rngState,
}: DrawHandParams): DrawHandResult {
  const pool = eligibleCards(cards, cycle);

  if (pool.length < handSize) {
    throw new DrawError({
      cycle,
      requested: handSize,
      available: pool.length,
      eligibleIds: pool.map(card => card.id),
    });
  }

  return shuffleTake(pool, handSize, rngState);
}

export interface MorningDrawResult {
  groups: Card[][];
  rngState: number;
}

/** GDD 2.1: sembilan kartu Daily Routine dalam tiga kelompok. */
export function drawMorningGroups(
  cards: readonly Card[],
  groupCount: number,
  perGroup: number,
  rngState: number,
): MorningDrawResult {
  const total = groupCount * perGroup;
  const draw = drawHand({
    cards,
    cycle: 'morning',
    handSize: total,
    rngState,
  });

  const groups: Card[][] = [];
  for (let i = 0; i < groupCount; i += 1) {
    groups.push(draw.hand.slice(i * perGroup, (i + 1) * perGroup));
  }

  return { groups, rngState: draw.rngState };
}

export function drawRepairChoices(
  cards: readonly Card[],
  disasterId: DisasterId,
  count: number,
  rngState: number,
): DrawHandResult {
  const pool = cards
    .filter(card => card.deck === 'repair' && card.disasterId === disasterId)
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return shuffleTake(pool, Math.min(count, pool.length), rngState);
}
