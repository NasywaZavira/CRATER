import { SCHEMA_VERSION } from '../logic/version';
import type { Card, Cosmonaut, GameState, Meter, MeterKey } from './index';

function makeMeter(id: MeterKey, label: string, value: number): Meter {
  return { id, label, value, min: 0, max: 100 };
}

export const MOCK_HAND: Card[] = [
  {
    id: 'mock-m01',
    name: 'Mock Regolith Assay',
    description: 'Fixture card for UI development.',
    category: 'research',
    cycles: ['morning'],
    effects: [
      { meter: 'lifeSupport', delta: 4 },
      { meter: 'power', delta: -1 },
    ],
  },
  {
    id: 'mock-m05',
    name: 'Mock North Rim Survey',
    description: 'Fixture card for UI development.',
    category: 'exploration',
    cycles: ['morning'],
    effects: [
      { meter: 'food', delta: 2 },
      { meter: 'lifeSupport', delta: 1 },
    ],
  },
  {
    id: 'mock-m07',
    name: 'Mock Dust Devil Tracking',
    description: 'Fixture card for UI development.',
    category: 'exploration',
    cycles: ['morning'],
    effects: [
      { meter: 'power', delta: 4 },
      { meter: 'lifeSupport', delta: -1 },
    ],
  },
];

export const MOCK_COSMONAUTS: Cosmonaut[] = [
  { id: 'toria', name: 'Toria', role: 'commander', cooldown: 0, available: true },
  { id: 'cirra', name: 'Cirra', role: 'engineer', cooldown: 0, available: true },
  { id: 'corin', name: 'Corin', role: 'medic', cooldown: 0, available: true },
  { id: 'sylvan', name: 'Sylvan', role: 'geologist', cooldown: 1, available: false },
  { id: 'vega', name: 'Vega', role: 'pilot', cooldown: 0, available: true },
];

export const mockGameState: GameState = {
  schemaVersion: SCHEMA_VERSION,
  seed: 20251114,
  sol: 3,
  cycle: 'morning',
  phase: 'playing',

  meters: {
    lifeSupport: makeMeter('lifeSupport', 'Life Support', 74),
    shielding: makeMeter('shielding', 'Shielding', 62),
    power: makeMeter('power', 'Power', 58),
    food: makeMeter('food', 'Food', 71),
  },

  cosmonauts: MOCK_COSMONAUTS,
  hand: MOCK_HAND,
  selectedCardIds: ['mock-m01'],
  assignments: [{ cardId: 'mock-m01', cosmonautIds: ['toria'] }],

  shuffleUsed: false,
  cardCooldowns: {},

  rngState: 424242,
  activeEvent: null,
  outcome: null,
};
