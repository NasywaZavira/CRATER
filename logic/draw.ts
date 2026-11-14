import type { Card, Cycle } from '../types';
import { isCardAllowedInCycle } from './cycle';
import { DrawError } from './errors';
import { nextRandom } from './rng';

export interface DrawHandParams {
  cards: readonly Card[];
  cycle: Cycle;
  handSize: number;
  rngState: number;
  cooldowns?: Readonly<Record<string, number>>;
}

export interface DrawHandResult {
  hand: Card[];
  rngState: number;
}

export function eligibleCards(
  cards: readonly Card[],
  cycle: Cycle,
  cooldowns: Readonly<Record<string, number>> = {},
): Card[] {
  const seen = new Set<string>();

  return cards
    .filter(card => {
      if (seen.has(card.id)) return false;
      if (!isCardAllowedInCycle(card, cycle)) return false;
      if ((cooldowns[card.id] ?? 0) > 0) return false;

      seen.add(card.id);
      return true;
    })
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function drawHand({
  cards,
  cycle,
  handSize,
  rngState,
  cooldowns = {},
}: DrawHandParams): DrawHandResult {
  if (!Number.isInteger(handSize) || handSize < 0) {
    throw new RangeError(
      `handSize must be a non-negative integer, received ${handSize}.`,
    );
  }

  const pool = eligibleCards(cards, cycle, cooldowns);

  if (pool.length < handSize) {
    throw new DrawError({
      cycle,
      requested: handSize,
      available: pool.length,
      eligibleIds: pool.map(card => card.id),
    });
  }

  let state = rngState >>> 0;

  // Partial Fisher-Yates: hasil unik tanpa duplikat dalam satu hand.
  for (let i = 0; i < handSize; i += 1) {
    const roll = nextRandom(state);
    state = roll.rngState;

    const j = i + Math.floor(roll.value * (pool.length - i));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  return {
    hand: pool.slice(0, handSize),
    rngState: state,
  };
}
