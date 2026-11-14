import type { CharacterRules } from '../data/balance';
import type { CardEffect } from '../types';
import { nextRandom } from './rng';

export type CharacterEffectSource = 'clash' | 'corinAnxiety' | 'sylvanSolo';

export interface CharacterEffectEvent {
  source: CharacterEffectSource;
  cosmonautIds: string[];
  effects: CardEffect[];
  message: string;
}

export interface CharacterEffectResolution {
  rngState: number;
  effects: CardEffect[];
  events: CharacterEffectEvent[];
}

/**
 * Pure dan bisa dites terpisah dari reducer.
 * Hanya dipanggil saat konfirmasi pagi/siang (saat ada assignment).
 */
export function evaluateCharacterEffects(
  assignedCosmonautIds: readonly string[],
  rngState: number,
  rules: CharacterRules,
): CharacterEffectResolution {
  const ids = Array.from(new Set(assignedCosmonautIds));
  const events: CharacterEffectEvent[] = [];

  let state = rngState >>> 0;

  const [clashA, clashB] = rules.clash.cosmonautIds;
  if (ids.includes(clashA) && ids.includes(clashB)) {
    const roll = nextRandom(state);
    state = roll.rngState;

    if (roll.value < rules.clash.chance) {
      events.push({
        source: 'clash',
        cosmonautIds: [clashA, clashB],
        effects: rules.clash.effects,
        message: rules.clash.message,
      });
    }
  }

  const alone = ids.length === 1;
  const corinRule = rules.corinAnxiety;

  if (
    ids.includes(corinRule.cosmonautId) &&
    (!corinRule.whenAlone || alone)
  ) {
    events.push({
      source: 'corinAnxiety',
      cosmonautIds: [corinRule.cosmonautId],
      effects: corinRule.effects,
      message: corinRule.message,
    });
  }

  const sylvanRule = rules.sylvanSolo;
  if (alone && ids.includes(sylvanRule.cosmonautId)) {
    events.push({
      source: 'sylvanSolo',
      cosmonautIds: [sylvanRule.cosmonautId],
      effects: sylvanRule.effects,
      message: sylvanRule.message,
    });
  }

  return {
    rngState: state,
    effects: events.flatMap(event => event.effects),
    events,
  };
}
