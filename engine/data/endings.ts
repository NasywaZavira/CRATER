import type { EndingId, ResourceKey } from '../types';
export const ENDING_TITLES: Record<EndingId, string> = {
  abort: 'Game Over / Abort',
  gold: 'Gold Ending – Pelopor Mars',
  silver: 'Silver Ending – Koloni Bertahan',
  bronze: 'Bronze Ending – Bertahan dengan Kerusakan',
};
export const METER_FAILURE_TEXT: Record<ResourceKey, string> = {
  lifeSupport: 'Kegagalan atmosfer habitat', shielding: 'Paparan radiasi kritis',
  power: 'Blackout total', food: 'Kegagalan sistem pangan',
};
