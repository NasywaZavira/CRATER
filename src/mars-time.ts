// src/engine/mars-time.ts  -> owned by A (engine). Alip: do NOT put this in src/ui.
// Pure functions, no Date.now(). Based on Allison & McEwen (2000).
const MARS_SOL_IN_EARTH_DAYS = 1.0274912517; // 88775.244 s
const TT_MINUS_UTC_S = 69.184; // TAI-UTC (37 s, 2026) + 32.184 s

export const julianDateUTC = (utcMs: number) => utcMs / 86_400_000 + 2_440_587.5;

/** Mars Sol Date for an instant given as UTC milliseconds. */
export function marsSolDate(utcMs: number): number {
  const jdTT = julianDateUTC(utcMs) + TT_MINUS_UTC_S / 86_400;
  return (jdTT - 2_451_549.5) / MARS_SOL_IN_EARTH_DAYS + 44_796.0 - 0.0009626;
}

/** Coordinated Mars Time (hours 0-24) at the prime meridian. */
export const marsTimeHours = (msd: number) => 24 * (msd - Math.floor(msd));

// Game mapping: the game is 8 sols x 3 cycles, so the clock is SIMULATED from a
// fixed mission start + cycle index, not read from the wall clock.
// Local hour per cycle is a placeholder: needs sign-off from Paran + A.
export const CYCLE_START_HOUR = { morning: 8, afternoon: 14, night: 20 } as const;

export function formatMarsClock(hours: number): string {
  const total = Math.round(hours * 60) % (24 * 60);
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
