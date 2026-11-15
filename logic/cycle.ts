import type { CardCategory, CardDefinition, Cycle } from '../types';
export const CYCLES: readonly Cycle[] = ['morning', 'afternoon', 'evening', 'night'];
export const CYCLE_LABELS: Record<Cycle, string> = {
  morning: 'Pagi – DAILY ROUTINE',
  afternoon: 'Siang – RESEARCH',
  evening: 'Sore – UPGRADE',
  night: 'Malam – Sol Evaluation',
};
/** Repair/FIX hanya diambil melalui bencana; bukan bagian dari hand biasa. */
export const CYCLE_CATEGORIES: Record<Cycle, readonly CardCategory[]> = {
  morning: ['operations'], afternoon: ['research'], evening: ['construction'], night: [],
};
export function cycleIndex(cycle: Cycle): number { return CYCLES.indexOf(cycle); }
export function getNextCycle(cycle: Cycle): Cycle | null {
  return CYCLES[cycleIndex(cycle) + 1] ?? null;
}
export function isCardAllowedInCycle(card: CardDefinition, cycle: Cycle): boolean {
  return CYCLE_CATEGORIES[cycle].includes(card.category);
}
