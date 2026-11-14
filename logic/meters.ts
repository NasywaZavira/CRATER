import type { CardEffect, MeterKey, Meters } from '../types';

export const METER_KEYS: readonly MeterKey[] = [
  'lifeSupport',
  'shielding',
  'power',
  'food',
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function applyEffects(
  meters: Meters,
  effects: readonly CardEffect[],
): Meters {
  if (effects.length === 0) return meters;

  const deltas: Partial<Record<MeterKey, number>> = {};

  for (const effect of effects) {
    if (!METER_KEYS.includes(effect.meter)) {
      throw new Error(`Unknown meter "${String(effect.meter)}" in card effect.`);
    }
    if (!Number.isFinite(effect.delta)) {
      throw new Error(
        `Invalid delta for meter "${effect.meter}": ${String(effect.delta)}.`,
      );
    }

    deltas[effect.meter] = (deltas[effect.meter] ?? 0) + effect.delta;
  }

  const next: Meters = { ...meters };

  for (const key of METER_KEYS) {
    const delta = deltas[key];
    if (delta === undefined) continue;

    const meter = next[key];
    next[key] = {
      ...meter,
      value: clamp(Math.round(meter.value + delta), meter.min, meter.max),
    };
  }

  return next;
}

export function areMetersDepleted(meters: Meters): MeterKey[] {
  return METER_KEYS.filter(key => meters[key].value <= meters[key].min);
}
