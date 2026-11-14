import type {
  Card,
  CardEffect,
  Cosmonaut,
  CrewCondition,
  MeterKey,
  PermanentModifiers,
} from '../types';
import type { CharacterRules } from '../data/balance';
import { nextRandom } from './rng';

export type CharacterEffectSource =
  | 'clash'
  | 'corinAnxiety'
  | 'sylvanSolo'
  | 'sylvanOverdrive'
  | 'toriaMasterBuilder'
  | 'cirraOptimizer'
  | 'corinAnalyst';

export interface CharacterEffectEvent {
  source: CharacterEffectSource;
  cosmonautIds: string[];
  effects: CardEffect[];
  message: string;
}

export interface MissionCharacterResult {
  rngState: number;
  effects: CardEffect[];
  /** Pengali untuk efek positif kartu (diminishing returns + keahlian). */
  positiveMultiplier: number;
  durationDelta: number;
  anxiety: boolean;
  evaFatigueImmune: boolean;
  events: CharacterEffectEvent[];
}

function conditionFactor(condition: CrewCondition): number {
  if (condition === 'ready') return 1;
  if (condition === 'tired') return 0.5;
  return 0;
}

function mainMeterEffect(
  card: Card,
  assignedIds: readonly string[],
  rules: CharacterRules,
): MeterKey | undefined {
  const positives = card.effects.filter(
    (effect): effect is CardEffect & { meter: MeterKey; delta: number } =>
      effect.meter !== undefined &&
      effect.delta !== undefined &&
      effect.delta > 0,
  );

  if (positives.length === 0) return undefined;

  // Toria menyasar meter utama Building; secara umum pakai delta terbesar.
  if (
    card.category === 'build' &&
    assignedIds.includes(rules.toriaMasterBuilder.cosmonautId)
  ) {
    return positives[0].meter;
  }

  return positives.reduce((best, effect) =>
    effect.delta > best.delta ? effect : best,
  ).meter;
}

/**
 * Menghitung trait karakter untuk satu misi.
 * Pure function agar bisa diuji terpisah dari reducer.
 */
export function evaluateMissionCharacters(
  card: Card,
  assignedCosmonautIds: readonly string[],
  cosmonauts: readonly Cosmonaut[],
  rngState: number,
  rules: CharacterRules,
  _permanent: PermanentModifiers = {},
): MissionCharacterResult {
  const ids = Array.from(new Set(assignedCosmonautIds));
  const byId = new Map(cosmonauts.map(crew => [crew.id, crew]));
  const events: CharacterEffectEvent[] = [];
  const flatEffects: CardEffect[] = [];

  let state = rngState >>> 0;

  const anyStressed = ids.some(
    id => byId.get(id)?.condition === 'stressed',
  );

  // Diminishing returns: 100%, +50%, +25%, +10%.
  const contributions = [1, 0.5, 0.25, 0.1];
  const diminishing =
    ids.length === 0
      ? 1
      : contributions.slice(0, ids.length).reduce((sum, value) => sum + value, 0);

  // Corin Methodical Analyst: hasil meter Research +50%.
  let analyst = 1;
  const corin = byId.get(rules.corinAnalyst.cosmonautId);
  if (
    card.category === 'research' &&
    corin &&
    ids.includes(corin.id) &&
    corin.condition !== 'stressed' &&
    corin.condition !== 'unwell'
  ) {
    analyst = 1 + (rules.corinAnalyst.multiplier - 1) * conditionFactor(corin.condition);
    if (analyst > 1) {
      events.push({
        source: 'corinAnalyst',
        cosmonautIds: [corin.id],
        effects: [],
        message: rules.corinAnalyst.message,
      });
    }
  }

  // Toria Master Builder.
  const toria = byId.get(rules.toriaMasterBuilder.cosmonautId);
  let durationDelta = 0;
  if (
    card.category === 'build' &&
    toria &&
    ids.includes(toria.id) &&
    toria.condition !== 'stressed' &&
    toria.condition !== 'unwell'
  ) {
    const factor = conditionFactor(toria.condition);
    const main = mainMeterEffect(card, ids, rules);
    if (main) {
      flatEffects.push({
        meter: main,
        delta: Math.floor(rules.toriaMasterBuilder.meterBonus * factor),
      });
    }
    durationDelta -= rules.toriaMasterBuilder.durationReduction;
    events.push({
      source: 'toriaMasterBuilder',
      cosmonautIds: [toria.id],
      effects: [],
      message: rules.toriaMasterBuilder.message,
    });
  }

  // Cirra Power Optimizer: +4 Power.
  const cirra = byId.get(rules.cirraOptimizer.cosmonautId);
  if (
    cirra &&
    ids.includes(cirra.id) &&
    cirra.condition !== 'stressed' &&
    cirra.condition !== 'unwell'
  ) {
    const bonus = Math.floor(
      rules.cirraOptimizer.powerBonus * conditionFactor(cirra.condition),
    );
    if (bonus > 0) {
      flatEffects.push({ meter: 'power', delta: bonus });
      events.push({
        source: 'cirraOptimizer',
        cosmonautIds: [cirra.id],
        effects: [{ meter: 'power', delta: bonus }],
        message: rules.cirraOptimizer.message,
      });
    }
  }

  // Konflik Toria-Cirra.
  const [clashA, clashB] = rules.clash.cosmonautIds;
  if (ids.includes(clashA) && ids.includes(clashB)) {
    const roll = nextRandom(state);
    state = roll.rngState;
    const chance = anyStressed
      ? rules.clash.stressedChance
      : rules.clash.chance;

    if (roll.value < chance) {
      flatEffects.push(...rules.clash.effects);
      durationDelta -= 1;
      events.push({
        source: 'clash',
        cosmonautIds: [clashA, clashB],
        effects: rules.clash.effects,
        message: rules.clash.message,
      });
    }
  }

  // Corin Solo Anxiety.
  let anxiety = false;
  const corinRule = rules.corinAnxiety;
  if (ids.length === 1 && ids[0] === corinRule.cosmonautId) {
    const corinCrew = byId.get(corinRule.cosmonautId);
    const stressed = corinCrew?.condition === 'stressed';
    const roll = nextRandom(state);
    state = roll.rngState;
    const chance = stressed
      ? corinRule.stressedChance
      : corinRule.chance;

    if (roll.value < chance) {
      anxiety = true;
      events.push({
        source: 'corinAnxiety',
        cosmonautIds: [corinRule.cosmonautId],
        effects: [],
        message: corinRule.message,
      });
    }
  }

  // Sylvan Lone Pathfinder / Group Overdrive.
  const sylvan = byId.get(rules.sylvanSolo.cosmonautId);
  let evaFatigueImmune = false;
  if (sylvan && ids.includes(sylvan.id)) {
    if (card.category === 'exploration') {
      evaFatigueImmune = true;
    }

    if (ids.length === 1) {
      const main = mainMeterEffect(card, ids, rules);
      if (main) {
        flatEffects.push({
          meter: main,
          delta: rules.sylvanSolo.meterBonus,
        });
      } else {
        const positiveRation = card.effects.find(
          effect => effect.ration !== undefined && (effect.rationDelta ?? 0) > 0,
        );
        if (positiveRation?.ration) {
          flatEffects.push({
            ration: positiveRation.ration,
            rationDelta: rules.sylvanSolo.rationBonus,
          });
        } else {
          flatEffects.push({
            meter: 'food',
            delta: rules.sylvanSolo.meterBonus,
          });
        }
      }
      events.push({
        source: 'sylvanSolo',
        cosmonautIds: [sylvan.id],
        effects: flatEffects.slice(-1),
        message: rules.sylvanSolo.message,
      });
    } else {
      const roll = nextRandom(state);
      state = roll.rngState;
      const stressed = sylvan.condition === 'stressed';
      const chance = stressed
        ? rules.sylvanOverdrive.stressedChance
        : rules.sylvanOverdrive.chance;

      if (roll.value < chance) {
        flatEffects.push(...rules.sylvanOverdrive.effects);
        events.push({
          source: 'sylvanOverdrive',
          cosmonautIds: [sylvan.id],
          effects: rules.sylvanOverdrive.effects,
          message: rules.sylvanOverdrive.message,
        });
      }
    }
  }

  return {
    rngState: state,
    effects: flatEffects,
    positiveMultiplier: diminishing * analyst,
    durationDelta,
    anxiety,
    evaFatigueImmune,
    events,
  };
}
