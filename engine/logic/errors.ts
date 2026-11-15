import type { Cycle } from '../types';
export class DrawError extends Error {
  readonly cycle: Cycle;
  readonly requested: number;
  readonly available: number;
  constructor(cycle: Cycle, requested: number, available: number) {
    super(`Cannot draw ${requested} cards for ${cycle}: only ${available} available. Check data/cards.json.`);
    this.name = 'DrawError';
    this.cycle = cycle; this.requested = requested; this.available = available;
  }
}
