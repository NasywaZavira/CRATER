import type { Card, CardCategory, Cycle } from '../types';

export const CYCLES: readonly Cycle[] = ['morning', 'afternoon', 'night'];

export const CYCLE_CATEGORIES: Record<Cycle, readonly CardCategory[]> = {
  morning: ['research', 'exploration'],
  afternoon: ['build', 'upgrade'],
  night: ['daily'],
};

export function getNextCycle(cycle: Cycle): Cycle | null {
  if (cycle === 'morning') return 'afternoon';
  if (cycle === 'afternoon') return 'night';
  return null;
}

export function isCardAllowedInCycle(card: Card, cycle: Cycle): boolean {
  return (
    card.cycles.includes(cycle) &&
    CYCLE_CATEGORIES[cycle].includes(card.category)
  );
}
