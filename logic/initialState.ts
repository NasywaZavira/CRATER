import type { GameState, Meters } from '../types';
import { createCosmonauts, DEFAULT_CONTENT, type GameContent } from './content';
import { drawHand } from './draw';
import { clamp, METER_KEYS } from './meters';
import { normalizeSeed } from './rng';
import { SCHEMA_VERSION } from './version';
import { validateBalance } from './validateBalance';

export function createInitialMeters(
  content: GameContent = DEFAULT_CONTENT,
): Meters {
  const meters = {} as Meters;

  for (const key of METER_KEYS) {
    const definition = content.meterDefinitions[key];

    meters[key] = {
      id: key,
      label: definition.label,
      value: clamp(
        Math.round(definition.initial),
        definition.min,
        definition.max,
      ),
      min: definition.min,
      max: definition.max,
    };
  }

  return meters;
}

export function createInitialState(
  content: GameContent = DEFAULT_CONTENT,
): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    seed: 0,
    sol: 0,
    cycle: 'morning',
    phase: 'idle',

    meters: createInitialMeters(content),
    cosmonauts: createCosmonauts(content),
    hand: [],
    selectedCardIds: [],
    assignments: [],

    shuffleUsed: false,
    cardCooldowns: {},

    rngState: 0,
    activeEvent: null,
    outcome: null,
  };
}

export function startGame(
  seed: number,
  content: GameContent = DEFAULT_CONTENT,
): GameState {
  validateBalance(content.balance);

  const normalizedSeed = normalizeSeed(seed);
  const base = createInitialState(content);

  const draw = drawHand({
    cards: content.cards,
    cycle: 'morning',
    handSize: content.balance.handSize.morning,
    rngState: normalizedSeed,
    cooldowns: base.cardCooldowns,
  });

  return {
    ...base,
    seed: normalizedSeed,
    sol: 1,
    phase: 'playing',
    hand: draw.hand,
    rngState: draw.rngState,
  };
}
