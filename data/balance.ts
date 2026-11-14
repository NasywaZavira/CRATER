import type { CardEffect, Cycle, MeterKey } from '../types';

// TODO(Paran): semua angka di file ini masih placeholder Day 1.
// Jangan pindahkan angka efek ke reducer; ubah di sini atau data/cards.json.
export interface MeterDefinition {
  label: string;
  initial: number;
  min: number;
  max: number;
}

export const METER_DEFINITIONS: Record<MeterKey, MeterDefinition> = {
  lifeSupport: { label: 'Life Support', initial: 80, min: 0, max: 100 },
  shielding: { label: 'Shielding', initial: 80, min: 0, max: 100 },
  power: { label: 'Power', initial: 80, min: 0, max: 100 },
  food: { label: 'Food', initial: 80, min: 0, max: 100 },
};

export interface CharacterClashRule {
  cosmonautIds: [string, string];
  chance: number;
  effects: CardEffect[];
  message: string;
}

export interface CorinAnxietyRule {
  cosmonautId: string;
  whenAlone: boolean;
  effects: CardEffect[];
  message: string;
}

export interface SylvanSoloRule {
  cosmonautId: string;
  effects: CardEffect[];
  message: string;
}

export interface CharacterRules {
  clash: CharacterClashRule;
  corinAnxiety: CorinAnxietyRule;
  sylvanSolo: SylvanSoloRule;
}

export interface BalanceConfig {
  handSize: Record<Cycle, number>;
  requiredPicks: Record<Cycle, number>;
  cosmonautCooldownCycles: number;
  cardCooldownCycles: number;
  rationConsumption: CardEffect[];
  characterRules: CharacterRules;
}

// TODO(Paran): nilai efek karakter masih placeholder.
export const CHARACTER_RULES: CharacterRules = {
  clash: {
    cosmonautIds: ['toria', 'cirra'],
    chance: 0.3,
    effects: [{ meter: 'power', delta: -6 }],
    message: 'Toria dan Cirra bentrok; efisiensi tim turun.',
  },
  corinAnxiety: {
    cosmonautId: 'corin',
    whenAlone: true,
    effects: [{ meter: 'lifeSupport', delta: -3 }],
    message: 'Corin cemas saat bekerja sendirian.',
  },
  sylvanSolo: {
    cosmonautId: 'sylvan',
    effects: [{ meter: 'power', delta: 4 }],
    message: 'Sylvan bekerja lebih efektif sendirian.',
  },
};

// TODO(Paran): hand size, picks, cooldown, dan konsumsi ration masih placeholder.
// Blueprint v2.2: tiap cycle memilih tepat 1 kartu; kartu tidak punya cooldown.
export const BALANCE: BalanceConfig = {
  handSize: { morning: 3, afternoon: 3, night: 3 },
  requiredPicks: { morning: 1, afternoon: 1, night: 1 },
  cosmonautCooldownCycles: 1,
  cardCooldownCycles: 0,
  rationConsumption: [{ meter: 'food', delta: -8 }],
  characterRules: CHARACTER_RULES,
};
