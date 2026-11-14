import type { Card, Cosmonaut, CosmonautRole, MeterKey } from '../types';
import {
  BALANCE,
  METER_DEFINITIONS,
  type BalanceConfig,
  type MeterDefinition,
} from '../data/balance';
import cardsJson from '../data/cards.json';
import cosmonautsJson from '../data/cosmonauts.json';

export interface CosmonautRosterEntry {
  id: string;
  name: string;
  role: CosmonautRole;
}

export interface GameContent {
  cards: readonly Card[];
  roster: readonly CosmonautRosterEntry[];
  meterDefinitions: Record<MeterKey, MeterDefinition>;
  balance: BalanceConfig;
}

// TODO(Paran): angka efek di data/cards.json masih placeholder Day 1.
export const CARD_LIBRARY: readonly Card[] = cardsJson as unknown as Card[];

export const COSMONAUT_ROSTER: readonly CosmonautRosterEntry[] =
  cosmonautsJson as unknown as CosmonautRosterEntry[];

export const DEFAULT_CONTENT: GameContent = {
  cards: CARD_LIBRARY,
  roster: COSMONAUT_ROSTER,
  meterDefinitions: METER_DEFINITIONS,
  balance: BALANCE,
};

export function createCosmonauts(
  content: GameContent = DEFAULT_CONTENT,
): Cosmonaut[] {
  return content.roster.map(entry => ({
    id: entry.id,
    name: entry.name,
    role: entry.role,
    cooldown: 0,
    available: true,
  }));
}
