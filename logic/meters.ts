import type {
  CardEffect,
  MeterKey,
  Meters,
  Rations,
} from '../types';

export const METER_KEYS: readonly MeterKey[] = [
  'lifeSupport',
  'shielding',
  'power',
  'food',
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isMeterEffect(effect: CardEffect): effect is CardEffect & {
  meter: MeterKey;
  delta: number;
} {
  return effect.meter !== undefined && effect.delta !== undefined;
}

export function isRationEffect(effect: CardEffect): effect is CardEffect & {
  ration: 'food' | 'water';
  rationDelta: number;
} {
  return effect.ration !== undefined && effect.rationDelta !== undefined;
}

export function applyMeterEffects(
  meters: Meters,
  effects: readonly CardEffect[],
): Meters {
  const deltas: Partial<Record<MeterKey, number>> = {};

  for (const effect of effects) {
    if (!isMeterEffect(effect)) continue;
    if (!METER_KEYS.includes(effect.meter)) {
      throw new Error(`Unknown meter "${String(effect.meter)}" in effect.`);
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

export function applyRationEffects(
  rations: Rations,
  effects: readonly CardEffect[],
): Rations {
  let food = rations.food;
  let water = rations.water;

  for (const effect of effects) {
    if (!isRationEffect(effect)) continue;
    if (effect.ration === 'food') food += effect.rationDelta;
    if (effect.ration === 'water') water += effect.rationDelta;
  }

  return {
    food: Math.max(0, Math.round(food)),
    water: Math.max(0, Math.round(water)),
  };
}

export function areMetersDepleted(meters: Meters): MeterKey[] {
  return METER_KEYS.filter(key => meters[key].value <= meters[key].min);
}

export function canAfford(
  meters: Meters,
  rations: Rations,
  effects: readonly CardEffect[],
): boolean {
  for (const effect of effects) {
    if (isMeterEffect(effect) && effect.delta < 0) {
      if (meters[effect.meter].value + effect.delta < meters[effect.meter].min) {
        return false;
      }
    }
    if (isRationEffect(effect) && effect.rationDelta < 0) {
      if (rations[effect.ration] + effect.rationDelta < 0) return false;
    }
  }

  return true;
}
