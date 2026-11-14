import type { BalanceConfig } from '../data/balance';
import { CYCLES } from './cycle';

export function validateBalance(balance: BalanceConfig): void {
  if (!Number.isInteger(balance.maxSols) || balance.maxSols < 1) {
    throw new Error('maxSols must be a positive integer.');
  }

  if (balance.solarRecovery.length < balance.maxSols) {
    throw new Error(
      `solarRecovery must provide at least ${balance.maxSols} values.`,
    );
  }

  if (balance.dailyGroups < 1 || balance.dailyPerGroup < 1) {
    throw new Error('dailyGroups and dailyPerGroup must be at least 1.');
  }

  if (balance.phaseCardCount < 1) {
    throw new Error('phaseCardCount must be at least 1.');
  }

  if (balance.commandHandSize < 1) {
    throw new Error('commandHandSize must be at least 1.');
  }

  if (balance.disasterMinPhaseGap < 1) {
    throw new Error('disasterMinPhaseGap must be at least 1.');
  }

  if (balance.maxDisasters < 0 || balance.maxDisasters > 4) {
    throw new Error('maxDisasters must be between 0 and 4.');
  }

  if (balance.repairChoices < 1) {
    throw new Error('repairChoices must be at least 1.');
  }

  for (const cycle of CYCLES) {
    const chance = balance.disasterChances[cycle];
    if (!Number.isFinite(chance) || chance < 0 || chance > 1) {
      throw new Error(
        `Invalid disaster chance for "${cycle}": ${String(chance)}.`,
      );
    }
  }

  const rules = balance.characterRules;
  for (const [name, chance] of [
    ['clash', rules.clash.chance],
    ['clash/stressed', rules.clash.stressedChance],
    ['corinAnxiety', rules.corinAnxiety.chance],
    ['corinAnxiety/stressed', rules.corinAnxiety.stressedChance],
    ['sylvanOverdrive', rules.sylvanOverdrive.chance],
    ['sylvanOverdrive/stressed', rules.sylvanOverdrive.stressedChance],
  ] as const) {
    if (!Number.isFinite(chance) || chance < 0 || chance > 1) {
      throw new Error(`Invalid character chance for "${name}": ${chance}.`);
    }
  }
}
