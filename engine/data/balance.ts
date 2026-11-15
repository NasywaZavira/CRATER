import type { Cycle, ResourceKey, Rations, MeterEffects } from '../types';

export interface MeterDefinition {
  label: string;
  initial: number;
  min: number;
  max: number;
}
export const METER_DEFINITIONS: Record<ResourceKey, MeterDefinition> = {
  lifeSupport: { label: 'Life Support', initial: 80, min: 0, max: 100 },
  shielding: { label: 'Radiation Shielding', initial: 80, min: 0, max: 100 },
  power: { label: 'Power', initial: 80, min: 0, max: 100 },
  food: { label: 'Food System', initial: 80, min: 0, max: 100 },
};
export const METER_LABELS: Record<ResourceKey, string> = {
  lifeSupport: 'Life Support', shielding: 'Radiation Shielding', power: 'Power', food: 'Food System',
};
export interface BalanceConfig {
  maxSols: number;
  startingMeters: number;
  startingRations: Rations;
  phaseCardCount: number;
  repairChoices: number;
  passiveDecay: Record<ResourceKey, number>;
  skipPenalty: MeterEffects;
  skipRepairPenalty: MeterEffects;
  solarRecovery: number[];
  irrigation: { water: number; power: number };
  disasterChances: Record<Cycle, number>;
  disasterMinPhaseGap: number;
  maxDisasters: number;
}
/** Nilai lingkungan dan Sol 8 berasal dari GDD, bukan dari data kartu. */
export const BALANCE: BalanceConfig = {
  maxSols: 8,
  startingMeters: 80,
  startingRations: { food: 10, water: 10 },
  phaseCardCount: 3,
  repairChoices: 3,
  passiveDecay: { lifeSupport: 5, shielding: 5, power: 6, food: 5 },
  skipPenalty: { lifeSupport: -5, shielding: -3, power: -5, food: -3 },
  skipRepairPenalty: { lifeSupport: -4, shielding: -5, power: -4, food: -4 },
  solarRecovery: [8, 8, 6, 2, 4, 7, 8, 8],
  irrigation: { water: 1, power: 5 },
  disasterChances: { morning: 0.02, afternoon: 0.095, evening: 0.05, night: 0 },
  disasterMinPhaseGap: 3,
  maxDisasters: 4,
};
