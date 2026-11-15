import type { DisasterId, MeterEffects } from '../types';
export const DISASTER_IDS: readonly DisasterId[] = [
  'dustStorm', 'solarParticle', 'airlockLeak', 'waterPlantFailure',
];
export const DISASTER_LABELS: Record<DisasterId, string> = {
  dustStorm: 'Badai Debu',
  solarParticle: 'Peristiwa Partikel Surya',
  airlockLeak: 'Kebocoran Airlock',
  waterPlantFailure: 'Kerusakan Sirkuit Air dan Tanaman',
};
/** Dampak kejadian tetap terpisah dari efek kartu JSON. */
export const DISASTER_DAMAGE: Record<DisasterId, MeterEffects> = {
  dustStorm: { lifeSupport: 0, shielding: 0, power: -20, food: 0 },
  solarParticle: { lifeSupport: 0, shielding: -22, power: 0, food: 0 },
  airlockLeak: { lifeSupport: -20, shielding: 0, power: 0, food: 0 },
  waterPlantFailure: { lifeSupport: 0, shielding: 0, power: 0, food: -20 },
};
