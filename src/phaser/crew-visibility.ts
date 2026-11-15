import type { SceneCrew } from '../bridge/scene-snapshot';

/**
 * Kontrak dengan engine: available=false ketika astronaut sedang ditugaskan / cooldown.
 * Pada OutpostScene karakter tersebut harus HILANG, bukan dibuat redup.
 * Ketika available kembali true, sprite muncul lagi pada tempat duduk yang sama.
 */
export function shouldShowCrew(crew: Pick<SceneCrew, 'available'>): boolean {
  return crew.available;
}
