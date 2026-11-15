import type { MeterEffects, Meters, ResourceKey } from '../types';
export const METER_KEYS: readonly ResourceKey[] = ['lifeSupport', 'shielding', 'power', 'food'];
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
/** 0 adalah no-op; seluruh delta (positif/negatif) diterapkan sekaligus. */
export function applyMeterEffects(meters: Meters, effects: MeterEffects): Meters {
  const next = { ...meters };
  for (const key of METER_KEYS) {
    const delta = effects[key];
    if (!Number.isFinite(delta)) throw new Error(`Invalid delta for ${key}`);
    next[key] = { ...meters[key], value: clamp(meters[key].value + delta, meters[key].min, meters[key].max) };
  }
  return next;
}
export function areMetersDepleted(meters: Meters, failureThreshold = 0): ResourceKey[] {
  return METER_KEYS.filter(key => meters[key].value <= failureThreshold);
}
export function meterValues(meters: Meters): Record<ResourceKey, number> {
  return { lifeSupport: meters.lifeSupport.value, shielding: meters.shielding.value, power: meters.power.value, food: meters.food.value };
}
