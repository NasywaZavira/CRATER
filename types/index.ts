export type MeterKey = 'lifeSupport' | 'shielding' | 'power' | 'food';

export interface Meter {
  id: MeterKey;
  label: string;
  value: number;
  min: number;
  max: number;
}

export type Meters = Record<MeterKey, Meter>;

export type CosmonautRole =
  | 'commander'
  | 'engineer'
  | 'medic'
  | 'geologist'
  | 'pilot';

export interface Cosmonaut {
  id: string;
  name: string;
  role: CosmonautRole;
  cooldown: number;
  available: boolean;
}

export type CardCategory =
  | 'research'
  | 'exploration'
  | 'build'
  | 'upgrade'
  | 'daily';

export type Cycle = 'morning' | 'afternoon' | 'night';

export type GamePhase = 'idle' | 'playing' | 'ended';

export interface CardEffect {
  meter: MeterKey;
  delta: number;
}

export interface Card {
  id: string;
  name: string;
  description: string;
  category: CardCategory;
  cycles: Cycle[];
  effects: CardEffect[];
}

export interface Assignment {
  cardId: string;
  cosmonautIds: string[];
}

export interface TimedEventOption {
  id: string;
  label: string;
  effects: CardEffect[];
}

export interface TimedEvent {
  id: string;
  title: string;
  description: string;
  durationMs: number;
  options: TimedEventOption[];
}

export interface NasaFact {
  id: string;
  text: string;
  source?: string;
}

export interface GameOutcome {
  status: 'lost';
  reason: 'meter-depleted';
  sol: number;
  meters: MeterKey[];
}

export interface GameState {
  schemaVersion: number;
  seed: number;
  sol: number;
  cycle: Cycle;
  phase: GamePhase;

  meters: Meters;
  cosmonauts: Cosmonaut[];
  hand: Card[];
  selectedCardIds: string[];
  assignments: Assignment[];

  shuffleUsed: boolean;
  cardCooldowns: Record<string, number>;

  rngState: number;
  activeEvent: TimedEvent | null;
  outcome: GameOutcome | null;
}

export type GameAction =
  | { type: 'START'; seed: number }
  | { type: 'ASSIGN'; cosmonautId: string }
  | { type: 'SELECT_CARD'; cardId: string }
  | { type: 'SHUFFLE' }
  | { type: 'ADVANCE_CYCLE' }
  | { type: 'END_SOL' }
  | { type: 'RESOLVE_EVENT'; eventId: string; optionId: string }
  | { type: 'EVENT_TIMEOUT'; eventId: string }
  | { type: 'RESTART'; seed: number };
