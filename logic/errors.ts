import type { Cycle } from '../types';

export interface DrawErrorDetails {
  cycle: Cycle;
  requested: number;
  available: number;
  eligibleIds: readonly string[];
}

export class DrawError extends Error {
  readonly cycle: Cycle;
  readonly requested: number;
  readonly available: number;
  readonly eligibleIds: readonly string[];

  constructor(details: DrawErrorDetails) {
    const ids = details.eligibleIds.length
      ? ` [${details.eligibleIds.join(', ')}]`
      : ' []';

    super(
      `Cannot draw ${details.requested} card(s) for ${details.cycle}: ` +
        `only ${details.available} eligible card(s) available${ids}. ` +
        'Check data/cards.ts and the eligible deck for this phase.',
    );

    this.name = 'DrawError';
    this.cycle = details.cycle;
    this.requested = details.requested;
    this.available = details.available;
    this.eligibleIds = [...details.eligibleIds];
  }
}
