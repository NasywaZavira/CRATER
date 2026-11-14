import type { EndingId, MeterKey } from '../types';

export const ENDING_TITLES: Record<EndingId, string> = {
  abort: 'Game Over / Abort',
  gold: 'Gold Ending – Pelopor Mars',
  silver: 'Silver Ending – Koloni Bertahan',
  bronze: 'Bronze Ending – Bertahan dengan Kerusakan',
};

/** GDD §3: teks kegagalan saat meter mencapai 0. */
export const METER_FAILURE_TEXT: Record<MeterKey, string> = {
  lifeSupport: 'Kegagalan atmosfer habitat',
  shielding: 'Paparan radiasi kritis',
  power: 'Blackout total',
  food: 'Kegagalan sistem pangan',
};

export const CREW_FAILURE_TEXT =
  'Empat astronaut Tidak Sehat bersamaan pada malam hari.';
