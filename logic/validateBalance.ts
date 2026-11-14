import type { BalanceConfig } from '../data/balance';
import { CYCLES } from './cycle';

export function validateBalance(balance: BalanceConfig): void {
  for (const cycle of CYCLES) {
    const requiredPicks = balance.requiredPicks[cycle];
    const handSize = balance.handSize[cycle];

    if (requiredPicks > handSize) {
      throw new Error(
        `Invalid balance for "${cycle}": requiredPicks (${requiredPicks}) ` +
          `exceeds handSize (${handSize}).`,
      );
    }
  }
}
