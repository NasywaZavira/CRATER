import type { GameState, Meters, Rations } from '../types';
import { createCosmonauts, DEFAULT_CONTENT, type GameContent } from './content';
import { METER_KEYS } from './meters';
import { normalizeSeed } from './rng';
import { SCHEMA_VERSION } from './version';
import { validateBalance } from './validateBalance';
import { drawHand } from './draw';
export function createInitialMeters(content: GameContent = DEFAULT_CONTENT): Meters {
  const meters = {} as Meters;
  for (const key of METER_KEYS) {
    const definition = content.meterDefinitions[key];
    meters[key] = { id: key, label: definition.label, min: definition.min, max: definition.max, value: content.balance.startingMeters };
  }
  return meters;
}
export function createInitialRations(content: GameContent = DEFAULT_CONTENT): Rations {
  return { ...content.balance.startingRations };
}
export function createInitialState(content: GameContent = DEFAULT_CONTENT): GameState {
  return {
    schemaVersion: SCHEMA_VERSION, seed: 0, sol: 0, cycle: 'morning', phase: 'idle', phaseState: 'selecting',
    meters: createInitialMeters(content), rations: createInitialRations(content), cosmonauts: createCosmonauts(content),
    hand: [], selectedCardId: null, pendingEffects: [], playedCards: [], skippedCardIds: [], solReports: [],
    activeDisaster: null, disasterHistory: [], lastDisasterPhase: null, rngState: 0, outcome: null,
  };
}
export function startGame(seed: number, content: GameContent = DEFAULT_CONTENT): GameState {
  validateBalance(content.balance);
  const base = createInitialState(content);
  const normalized = normalizeSeed(seed);
  const draw = drawHand({ cards: content.cards, cycle: 'morning', handSize: content.balance.phaseCardCount, rngState: normalized });
  return { ...base, seed: normalized, rngState: draw.rngState, sol: 1, phase: 'playing', hand: draw.hand };
}
