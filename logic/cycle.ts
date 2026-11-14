import type { Card, CardCategory, Cycle } from '../types';

/** GDD 2: Pagi, Siang, Sore, Malam. */
export const CYCLES: readonly Cycle[] = [
  'morning',
  'afternoon',
  'evening',
  'night',
];

export const CYCLE_LABELS: Record<Cycle, string> = {
  morning: 'Pagi - Daily Routine',
  afternoon: 'Siang - Research / Exploration',
  evening: 'Sore - Building / Upgrade',
  night: 'Malam - Sol Evaluation',
};

export const CYCLE_CATEGORIES: Record<Cycle, readonly CardCategory[]> = {
  morning: ['daily'],
  afternoon: ['research', 'exploration'],
  evening: ['build', 'upgrade'],
  night: [],
};

export function cycleIndex(cycle: Cycle): number {
  return CYCLES.indexOf(cycle);
}

export function getNextCycle(cycle: Cycle): Cycle | null {
  const index = cycleIndex(cycle);
  return index >= 0 && index < CYCLES.length - 1 ? CYCLES[index + 1] : null;
}

export function isCardAllowedInCycle(card: Card, cycle: Cycle): boolean {
  return (
    card.cycles.includes(cycle) &&
    CYCLE_CATEGORIES[cycle].includes(card.category)
  );
}
