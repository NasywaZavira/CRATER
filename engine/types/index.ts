/** Sumber kartu aktif: data/cards.json (80 kartu GDD + klasifikasi meter). */
export type ResourceKey = 'lifeSupport' | 'shielding' | 'power' | 'food';
export type MeterKey = ResourceKey;
export type MeterEffects = Record<ResourceKey, number>;
export type Localized = { en: string; id?: string };
export type CardCategory = 'operations' | 'research' | 'exploration' | 'construction' | 'upgrade' | 'repair';

export interface NasaFactSource {
  dataset: string;
  sourceName: string;
  sourceUrl: string | null;
}

export interface CardDefinition {
  id: string;
  /** Jenis aktivitas: subkategori di dalam masing-masing meter utama. */
  category: CardCategory;
  /** Satu meter utama berdasarkan KONTEKS kartu; bukan otomatis nilai positif terbesar. */
  primaryMeter: ResourceKey;
  /** Meter lain yang mendapat manfaat positif; tidak memengaruhi pengundian/efek. */
  relatedMeters?: ResourceKey[];
  /** Metadata GDD asli dipertahankan utuh pada JSON. */
  gddId?: string;
  title: Localized;
  description: Localized;
  artKey: string;
  fact: NasaFactSource;
  /** Delta langsung ke 4 meter; 0 ditampilkan sebagai em-dash (—). */
  effects: MeterEffects;
  /** Delta tertunda; katalog GDD juga punya afterSols=0 untuk efek malam. */
  delayed?: { afterSols: number; effects: MeterEffects };
}

/** Alias migrasi sederhana, tidak mengembalikan properti kartu lama. */
export type Card = CardDefinition;
export const CATEGORY_LABEL: Record<CardCategory, string> = {
  operations: 'DAILY ROUTINE',
  construction: 'BUILDING',
  upgrade: 'UPGRADE',
  exploration: 'EXPLORATION',
  repair: 'FIX',
  research: 'RESEARCH',
};

export type Cycle = 'morning' | 'afternoon' | 'evening' | 'night';
export type GamePhase = 'idle' | 'playing' | 'ended';
export type PhaseState = 'selecting' | 'resolved' | 'repair' | 'night';
export type DisasterId = 'dustStorm' | 'solarParticle' | 'airlockLeak' | 'waterPlantFailure';
export type CrewCondition = 'ready' | 'tired' | 'stressed' | 'unwell';

export interface Meter {
  id: ResourceKey;
  label: string;
  value: number;
  min: number;
  max: number;
}
export type Meters = Record<ResourceKey, Meter>;
export interface Rations { food: number; water: number }
export interface Cosmonaut {
  id: string;
  name: string;
  role: string;
  specialty: string;
  condition: CrewCondition;
  ration: { food: boolean; water: boolean };
  consecutiveMissedNights: number;
  fullRationNights: number;
}
export interface PendingEffect {
  cardId: string;
  playedSol: number;
  dueSol: number;
  effects: MeterEffects;
}
export interface ActiveDisaster {
  id: DisasterId;
  sol: number;
  cycle: Cycle;
  repairChoices: CardDefinition[];
}
export interface DisasterRecord {
  id: DisasterId;
  sol: number;
  cycle: Cycle;
}
export interface CardPlayLog {
  cardId: string;
  sol: number;
  cycle: Cycle;
  category: CardCategory;
  effects: MeterEffects;
  delayedDueSol?: number;
}
export interface SolReport {
  sol: number;
  meters: Record<ResourceKey, number>;
  rations: Rations;
  conditions: Record<string, CrewCondition>;
  cardIds: string[];
  delayedCardIds: string[];
  disasters: DisasterId[];
}
export type GameOutcome =
  | { status: 'lost'; endingId: 'abort'; reason: 'meter-depleted' | 'crew-unwell'; sol: number; meters: ResourceKey[] }
  | { status: 'won'; sol: number; meters: Record<ResourceKey, number> };

export interface GameState {
  schemaVersion: number;
  seed: number;
  sol: number;
  cycle: Cycle;
  phase: GamePhase;
  phaseState: PhaseState;
  meters: Meters;
  rations: Rations;
  cosmonauts: Cosmonaut[];
  hand: CardDefinition[];
  selectedCardId: string | null;
  pendingEffects: PendingEffect[];
  playedCards: CardPlayLog[];
  skippedCardIds: string[];
  solReports: SolReport[];
  activeDisaster: ActiveDisaster | null;
  disasterHistory: DisasterRecord[];
  lastDisasterPhase: number | null;
  rngState: number;
  outcome: GameOutcome | null;
}

export type GameAction =
  | { type: 'START'; seed: number }
  | { type: 'RESTART'; seed: number }
  | { type: 'SELECT_CARD'; cardId: string }
  | { type: 'EXECUTE_CARD' }
  | { type: 'REJECT_CARD' }
  | { type: 'SELECT_REPAIR'; cardId: string }
  | { type: 'SKIP_REPAIR' }
  | { type: 'SET_RATION'; cosmonautId: string; food: boolean; water: boolean }
  | { type: 'ADVANCE_CYCLE' }
  | { type: 'END_SOL' }
  | { type: 'LOAD_STATE'; state: GameState };
