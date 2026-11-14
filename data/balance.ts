import type {
  CardEffect,
  Cycle,
  DisasterId,
  MeterKey,
  Rations,
} from '../types';

export interface MeterDefinition {
  label: string;
  initial: number;
  min: number;
  max: number;
}

/** GDD 3: empat meter, skala 0-100, nilai awal 80. */
export const METER_DEFINITIONS: Record<MeterKey, MeterDefinition> = {
  lifeSupport: { label: 'Life Support', initial: 80, min: 0, max: 100 },
  shielding: { label: 'Radiation Shielding', initial: 80, min: 0, max: 100 },
  power: { label: 'Power', initial: 80, min: 0, max: 100 },
  food: { label: 'Food System', initial: 80, min: 0, max: 100 },
};

export const METER_LABELS: Record<MeterKey, string> = {
  lifeSupport: 'Life Support',
  shielding: 'Radiation Shielding',
  power: 'Power',
  food: 'Food System',
};

export interface CharacterClashRule {
  cosmonautIds: [string, string];
  chance: number;
  stressedChance: number;
  effects: CardEffect[];
  message: string;
}

export interface CorinAnxietyRule {
  cosmonautId: string;
  chance: number;
  stressedChance: number;
  foodRations: number;
  waterRations: number;
  message: string;
}

export interface SylvanSoloRule {
  cosmonautId: string;
  meterBonus: number;
  rationBonus: number;
  message: string;
}

export interface SylvanOverdriveRule {
  cosmonautId: string;
  chance: number;
  stressedChance: number;
  effects: CardEffect[];
  message: string;
}

export interface ToriaMasterBuilderRule {
  cosmonautId: string;
  meterBonus: number;
  durationReduction: number;
  message: string;
}

export interface CirraOptimizerRule {
  cosmonautId: string;
  powerBonus: number;
  /** Sisa biaya Power = ceil(cost / 2). */
  powerCostFactor: number;
  message: string;
}

export interface CorinAnalystRule {
  cosmonautId: string;
  multiplier: number;
  message: string;
}

export interface CharacterRules {
  clash: CharacterClashRule;
  corinAnxiety: CorinAnxietyRule;
  sylvanSolo: SylvanSoloRule;
  sylvanOverdrive: SylvanOverdriveRule;
  toriaMasterBuilder: ToriaMasterBuilderRule;
  cirraOptimizer: CirraOptimizerRule;
  corinAnalyst: CorinAnalystRule;
}

/** GDD 4.2: trait dan interaksi karakter. */
export const CHARACTER_RULES: CharacterRules = {
  clash: {
    cosmonautIds: ['toria', 'cirra'],
    chance: 0.3,
    stressedChance: 0.6,
    effects: [{ meter: 'shielding', delta: -10 }],
    message: 'Toria dan Cirra bentrok; Radiation Shielding berkurang 10.',
  },
  corinAnxiety: {
    cosmonautId: 'corin',
    chance: 0.3,
    stressedChance: 0.6,
    foodRations: 2,
    waterRations: 2,
    message: 'Corin mengalami Anxiety dan mengonsumsi dua Food/Water Ration.',
  },
  sylvanSolo: {
    cosmonautId: 'sylvan',
    meterBonus: 5,
    rationBonus: 1,
    message: 'Lone Pathfinder: Sylvan mendapat bonus eksplorasi solo.',
  },
  sylvanOverdrive: {
    cosmonautId: 'sylvan',
    chance: 0.3,
    stressedChance: 0.6,
    effects: [{ meter: 'power', delta: -10 }],
    message: 'Group Overdrive: Sylvan memakai perlengkapan berlebih, Power -10.',
  },
  toriaMasterBuilder: {
    cosmonautId: 'toria',
    meterBonus: 5,
    durationReduction: 1,
    message: 'Master Builder: hasil Building +5 dan durasi -1 cycle.',
  },
  cirraOptimizer: {
    cosmonautId: 'cirra',
    powerBonus: 4,
    powerCostFactor: 0.5,
    message: 'Power Optimizer: biaya Power kartu berkurang dan Power +4.',
  },
  corinAnalyst: {
    cosmonautId: 'corin',
    multiplier: 1.5,
    message: 'Methodical Analyst: hasil meter Research +50%.',
  },
};

export interface ProductionRule {
  high: number;
  mid: number;
  low: number;
  highThreshold: number;
  lowThreshold: number;
}

export interface BalanceConfig {
  maxSols: number;
  /** GDD 3: nilai awal meter dan ration. */
  startingMeters: number;
  startingRations: Rations;

  /** Pagi: 9 kartu dalam 3 kelompok, ambil 1 per kelompok. */
  dailyGroups: number;
  dailyPerGroup: number;
  /** Siang/sore: 3 kartu, pilih 1. */
  phaseCardCount: number;
  commandHandSize: number;

  solarRecovery: number[];
  passiveDecay: Record<MeterKey, number>;
  irrigation: { water: number; power: number };
  foodProduction: ProductionRule;
  waterProduction: ProductionRule;

  disasterChances: Record<Cycle, number>;
  disasterMinPhaseGap: number;
  maxDisasters: number;
  repairChoices: number;
  repairPenalty: number;

  characterRules: CharacterRules;
}

/**
 * GDD 7: pemulihan Power dari skenario MEDA, Sol 1-8.
 * Nilai berada pada rentang +8 sampai +2.
 */
export const SOLAR_RECOVERY = [8, 8, 6, 2, 4, 7, 8, 8];

/** GDD 3.2: penurunan pasif malam. */
export const PASSIVE_DECAY: Record<MeterKey, number> = {
  lifeSupport: 3,
  shielding: 2,
  power: 3,
  food: 2,
};

export const DISASTER_IDS: readonly DisasterId[] = [
  'dustStorm',
  'solarParticle',
  'airlockLeak',
  'waterPlantFailure',
];

export const DISASTER_LABELS: Record<DisasterId, string> = {
  dustStorm: 'Badai Debu',
  solarParticle: 'Peristiwa Partikel Surya',
  airlockLeak: 'Kebocoran Airlock',
  waterPlantFailure: 'Kerusakan Sirkuit Air dan Tanaman',
};

export const BALANCE: BalanceConfig = {
  maxSols: 8,
  startingMeters: 80,
  startingRations: { food: 10, water: 10 },

  dailyGroups: 3,
  dailyPerGroup: 3,
  phaseCardCount: 3,
  commandHandSize: 4,

  solarRecovery: SOLAR_RECOVERY,
  passiveDecay: PASSIVE_DECAY,
  irrigation: { water: 1, power: 5 },
  foodProduction: { high: 3, mid: 2, low: 1, highThreshold: 50, lowThreshold: 30 },
  waterProduction: { high: 3, mid: 2, low: 1, highThreshold: 50, lowThreshold: 30 },

  disasterChances: {
    morning: 0.02,
    afternoon: 0.095,
    evening: 0.05,
    night: 0,
  },
  disasterMinPhaseGap: 3,
  maxDisasters: 4,
  repairChoices: 3,
  repairPenalty: 10,

  characterRules: CHARACTER_RULES,
};
