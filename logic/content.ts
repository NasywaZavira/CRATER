import type { Card, Cosmonaut, CosmonautRole, Specialty } from '../types';
import {
  BALANCE,
  METER_DEFINITIONS,
  type BalanceConfig,
  type MeterDefinition,
} from '../data/balance';
import { CARD_LIBRARY } from '../data/cards';
import cosmonautsJson from '../data/cosmonauts.json';

export interface CosmonautRosterEntry {
  id: string;
  name: string;
  role: CosmonautRole;
  specialty: Specialty;
}

export interface GameContent {
  cards: readonly Card[];
  roster: readonly CosmonautRosterEntry[];
  meterDefinitions: Record<keyof typeof METER_DEFINITIONS, MeterDefinition>;
  balance: BalanceConfig;
}

export { CARD_LIBRARY };

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
    specialty: entry.specialty,
    condition: 'ready',
    cooldown: 0,
    available: true,
    ration: { food: true, water: true },
    fullRationNights: 0,
  }));
}
