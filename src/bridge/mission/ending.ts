import type { FailureMeter } from '../../mission/dialogues';
import { BALANCE, METER_FAILURE_THRESHOLD } from '../../../engine/data/balance';

/** The four outpost meters; the first meter <= 40 takes priority on simultaneous failure. */
export interface MissionMeters {
  lifeSupport: number;
  shielding: number;
  power: number;
  food: number;
}

export type MissionEnding = FailureMeter | 'success';

/** Match the engine failure rule; do not infer success from a Phaser snapshot. */
export function resolveMissionEnding(state: {
  sol: number;
  ended: boolean;
  meters: Readonly<MissionMeters>;
}): MissionEnding | null {
  const ordered: readonly FailureMeter[] = ['lifeSupport', 'shielding', 'power', 'food'];
  for (const meter of ordered) {
    if (state.meters[meter] <= METER_FAILURE_THRESHOLD) return meter;
  }
  if (state.ended && state.sol >= BALANCE.maxSols) return 'success';
  return null;
}
