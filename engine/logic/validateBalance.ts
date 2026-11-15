import type { BalanceConfig } from '../data/balance';
import { CYCLES } from './cycle';
import { RESOURCE_KEYS } from '../data/cards';

/** Validasi hanya properti dari BalanceConfig addendum JSON v4. */
export function validateBalance(balance: BalanceConfig): void {
  const positive = (value: number, name: string, allowZero = false) => {
    if (!Number.isInteger(value) || value < (allowZero ? 0 : 1)) {
      throw new Error(`${name} must be ${allowZero ? 'a non-negative' : 'a positive'} integer.`);
    }
  };
  positive(balance.maxSols, 'maxSols');
  positive(balance.startingMeters, 'startingMeters', true);
  if (balance.startingMeters > 100) throw new Error('startingMeters must not exceed 100');
  positive(balance.phaseCardCount, 'phaseCardCount');
  if (balance.phaseCardCount > 20) throw new Error('phaseCardCount exceeds available cards per phase');
  positive(balance.repairChoices, 'repairChoices');
  if (balance.repairChoices > 20) throw new Error('repairChoices exceeds available repair cards');
  positive(balance.maxDisasters, 'maxDisasters', true);
  if (balance.maxDisasters > 4) throw new Error('maxDisasters must be between 0 and 4');
  positive(balance.disasterMinPhaseGap, 'disasterMinPhaseGap');
  if (!Array.isArray(balance.solarRecovery) || balance.solarRecovery.length < balance.maxSols ||
    !balance.solarRecovery.every(n => Number.isFinite(n))) throw new Error('solarRecovery missing/invalid Sol entries');
  for (const key of ['food', 'water'] as const) positive(balance.startingRations[key], `startingRations.${key}`, true);
  positive(balance.irrigation.water, 'irrigation.water', true);
  positive(balance.irrigation.power, 'irrigation.power', true);
  for (const key of RESOURCE_KEYS) {
    positive(balance.passiveDecay[key], `passiveDecay.${key}`, true);
    for (const [field, effect] of [['skipPenalty', balance.skipPenalty], ['skipRepairPenalty', balance.skipRepairPenalty]] as const) {
      if (!Number.isFinite(effect[key]) || !Number.isInteger(effect[key]) || effect[key] > 0) {
        throw new Error(`${field}.${key} must be a non-positive integer`);
      }
    }
  }
  for (const cycle of CYCLES) {
    const chance = balance.disasterChances[cycle];
    if (!Number.isFinite(chance) || chance < 0 || chance > 1) {
      throw new Error(`Invalid disaster chance for "${cycle}": ${String(chance)}`);
    }
  }
}
