import type { DisasterId, MeterKey, RationKind } from '../types';

export interface DisasterDamage {
  meters: Partial<Record<MeterKey, number>>;
  rations: Partial<Record<RationKind, number>>;
}

/** GDD §6: angka dampak langsung, dipindahkan dari reducer. */
export const DISASTER_DAMAGE: Record<DisasterId, DisasterDamage> = {
  dustStorm: { meters: { power: -20 }, rations: {} },
  solarParticle: { meters: { shielding: -22 }, rations: {} },
  airlockLeak: { meters: { lifeSupport: -20 }, rations: {} },
  waterPlantFailure: {
    meters: { food: -20 },
    rations: { water: -2 },
  },
};

/** GDD §3 dan §6: ambang Radiation Shielding untuk SEP. */
export const SEP_UNWELL_SHIELDING_THRESHOLD = 50;
export const SEP_FOLLOWUP_SHIELDING_THRESHOLD = 60;

/** GDD §6: panel berdebu mengurangi pemulihan Power malam berikutnya. */
export const DUST_STORM_POWER_RECOVERY_PENALTY = 5;
