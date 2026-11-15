import type { FailureMeter } from './dialogues';

/** Bentuk meter sesuai cards.json/addendum engine CRATER. */
export interface MissionMeters {
  lifeSupport: number;
  shielding: number;
  power: number;
  food: number;
}

export type MissionEnding = FailureMeter | 'success';

/**
 * Pemanggilan saat UI dihubungkan ke engine yang sebenarnya:
 * - langsung gagal jika salah satu meter <= 0;
 * - berhasil hanya ketika engine menyatakan permainan selesai dan Sol 8 telah tercapai.
 * Tidak menebak hasil dari snapshot Phaser yang hanya memuat sol/cycle/crew/hazard.
 */
export function resolveMissionEnding(state: {
  sol: number;
  ended: boolean;
  meters: Readonly<MissionMeters>;
}): MissionEnding | null {
  const orderedMeters: readonly FailureMeter[] = ['lifeSupport', 'shielding', 'power', 'food'];
  for (const key of orderedMeters) {
    if (state.meters[key] <= 0) return key;
  }
  if (state.ended && state.sol >= 8) return 'success';
  return null;
}
