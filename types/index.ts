export type MeterKey = 'lifeSupport' | 'shielding' | 'power' | 'food';

export type RationKind = 'food' | 'water';

export interface Rations {
  food: number;
  water: number;
}

export interface Meter {
  id: MeterKey;
  label: string;
  value: number;
  min: number;
  max: number;
}

export type Meters = Record<MeterKey, Meter>;

export type CosmonautRole =
  | 'mechanicalEngineer'
  | 'electricalEngineer'
  | 'medicalOfficer'
  | 'botanist';

export type Specialty = 'research' | 'exploration' | 'build' | 'upgrade' | 'daily';

/** GDD 4.1: Siap, Lelah, Tertekan, Tidak Sehat. */
export type CrewCondition = 'ready' | 'tired' | 'stressed' | 'unwell';

export interface Cosmonaut {
  id: string;
  name: string;
  role: CosmonautRole;
  specialty: Specialty;
  condition: CrewCondition;
  cooldown: number;
  available: boolean;
  /** Ration yang dibagikan pemain untuk malam berikutnya. */
  ration: { food: boolean; water: boolean };
  /** Jumlah malam berturut-turut dengan ration lengkap (untuk memulihkan Unwell). */
  fullRationNights: number;
}

export type CardCategory =
  | 'daily'
  | 'research'
  | 'exploration'
  | 'build'
  | 'upgrade'
  | 'repair';

export type DeckId = CardCategory;

/** GDD 2: Pagi, Siang, Sore, Malam. */
export type Cycle = 'morning' | 'afternoon' | 'evening' | 'night';

export type GamePhase = 'idle' | 'playing' | 'ended';

export type PhaseState =
  | 'selecting'
  | 'executed'
  | 'rejected'
  | 'repair'
  | 'night';

export type DisasterId =
  | 'dustStorm'
  | 'solarParticle'
  | 'airlockLeak'
  | 'waterPlantFailure';

export type ConditionTarget = 'assigned' | 'all' | 'one' | 'random';

/**
 * Efek generik untuk kartu, biaya, penalti, dan efek karakter.
 * Satu objek dapat memuat efek meter, ration, atau kondisi kru.
 */
export interface CardEffect {
  meter?: MeterKey;
  delta?: number;
  ration?: RationKind;
  rationDelta?: number;
  fromCondition?: CrewCondition | 'any';
  condition?: CrewCondition;
  conditionTarget?: ConditionTarget;
  conditionCount?: number;
  timing?: 'immediate' | 'delayed';
  delaySols?: number;
}

export interface PermanentModifiers {
  /** Tambahan pemulihan Power malam. */
  nightlyPower?: number;
  /** Tambahan Water Ration malam. */
  nightlyWater?: number;
  /** Tambahan Food Ration malam. */
  nightlyFood?: number;
  /** Bonus produksi Food Ration. */
  foodProductionBonus?: number;
  /** Bonus produksi Water Ration. */
  waterProductionBonus?: number;
  /** Pengurangan penurunan pasif (angka positif = mengurangi decay). */
  passiveLifeSupport?: number;
  passiveShielding?: number;
  passivePower?: number;
  passiveFood?: number;
  /** Override biaya irigasi malam. */
  irrigationPowerCost?: number;
  irrigationWaterCost?: number;
  /** Diskon Power permanen untuk semua kartu. */
  powerCostDiscount?: number;
  dustPenaltyImmunity?: boolean;
  evaTiredImmunity?: boolean;
  sepDamageReduction?: number;
  sepUnwellImmunity?: boolean;
  unwellImmunity?: boolean;
  repairChoicesBonus?: number;
  explorationUnwellReduction?: number;
  shieldEvaThreshold?: number;
  nightlyRemoveTired?: number;
  foodProductionFloor?: number;
}

export interface Card {
  id: string;
  name: string;
  description: string;
  deck: DeckId;
  category: CardCategory;
  cycles: Cycle[];
  costs: CardEffect[];
  effects: CardEffect[];
  rejectionPenalty: CardEffect[];
  /** Durasi misi dalam cycle (0, 1, 2, atau 4). */
  durationCycles: number;
  requiresCrew: boolean;
  recommendedCrewIds: string[];
  /** Masa berlaku untuk kartu Daily Routine (1 atau 2 Sol). */
  validitySol?: number;
  /** Manfaat permanen setelah kartu selesai. */
  permanent?: PermanentModifiers;
  delayedEffects?: CardEffect[];
  disasterId?: DisasterId;
  clearsFollowUp?: boolean;
  fact: string;
  source: string;
  limit: string;
}

export interface Assignment {
  cardId: string;
  cosmonautIds: string[];
}

export interface StoredCard {
  card: Card;
  expiresSol: number;
}

export interface ActiveDisaster {
  id: DisasterId;
  repairChoices: Card[];
  resolved: boolean;
  clearedFollowUp: boolean;
}

export interface DisasterRecord {
  id: DisasterId;
  sol: number;
  cycle: Cycle;
}

export interface PendingEffect {
  dueSol: number;
  effects: CardEffect[];
}

export interface DelayFollowUp {
  id: DisasterId;
  dueSol: number;
  cleared: boolean;
}


export interface LostOutcome {
  status: 'lost';
  reason: 'meter-depleted' | 'crew-unwell';
  sol: number;
  meters: MeterKey[];
  crewIds?: string[];
}

export interface WonOutcome {
  status: 'won';
  medal: 'gold' | 'silver' | 'bronze';
  sol: number;
  meters: Record<MeterKey, number>;
  rations: Rations;
  conditions: Record<string, CrewCondition>;
}

export type GameOutcome = LostOutcome | WonOutcome;

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

  /** Tiga kartu siang/sore, atau 9 kartu pagi yang diratakan. */
  hand: Card[];
  /** Pagi: 3 kelompok x 3 kartu. */
  morningGroups: Card[][];
  /** Pagi: pilihan pemain per kelompok. */
  morningPicks: (string | null)[];
  selectedCardIds: string[];
  assignments: Assignment[];

  /** Command Hand maksimal 4 kartu Daily Routine. */
  commandHand: StoredCard[];

  permanentModifiers: PermanentModifiers;
  pendingEffects: PendingEffect[];
  pendingExtraRations: Rations;
  pendingNightPenalty: number;

  disasterHistory: DisasterRecord[];
  activeDisaster: ActiveDisaster | null;
  disasterFollowUps: DelayFollowUp[];
  lastDisasterPhase: number | null;
  explorationBlockedUntilSol: number | null;
  evaUnwellRiskUntilSol: number | null;

  rngState: number;
  outcome: GameOutcome | null;
}

export type GameAction =
  | { type: 'START'; seed: number }
  | { type: 'RESTART'; seed: number }
  | { type: 'SELECT_DAILY'; groupIndex: number; cardId: string }
  | { type: 'CONFIRM_MORNING' }
  | { type: 'SELECT_CARD'; cardId: string }
  | { type: 'ASSIGN'; cosmonautId: string }
  | { type: 'UNASSIGN'; cosmonautId: string }
  | { type: 'EXECUTE_CARD' }
  | { type: 'REJECT_CARD' }
  | { type: 'SELECT_REPAIR'; cardId: string; cosmonautIds?: string[] }
  | { type: 'SKIP_REPAIR' }
  | { type: 'PLAY_HAND_CARD'; cardId: string; cosmonautIds?: string[] }
  | { type: 'DISCARD_HAND_CARD'; cardId: string }
  | { type: 'SET_RATION'; cosmonautId: string; food: boolean; water: boolean }
  | { type: 'ADVANCE_CYCLE' }
  | { type: 'END_SOL' };
