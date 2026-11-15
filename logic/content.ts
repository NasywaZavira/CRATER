import type { CardDefinition, Cosmonaut, Meters, ResourceKey } from '../types';
import type { BalanceConfig, MeterDefinition } from '../data/balance';
import { BALANCE, METER_DEFINITIONS } from '../data/balance';
import { CARD_LIBRARY } from '../data/cards';
import cosmonautsJson from '../data/cosmonauts.json';
export interface CosmonautRosterEntry { id: string; name: string; role: string; specialty: string }
export interface GameContent {
  cards: readonly CardDefinition[];
  balance: BalanceConfig;
  meterDefinitions: Record<ResourceKey, MeterDefinition>;
  roster: readonly CosmonautRosterEntry[];
}
export const COSMONAUT_ROSTER: readonly CosmonautRosterEntry[] = cosmonautsJson;
export const DEFAULT_CONTENT: GameContent = {
  cards: CARD_LIBRARY, balance: BALANCE, meterDefinitions: METER_DEFINITIONS, roster: COSMONAUT_ROSTER,
};
export function createCosmonauts(content: GameContent = DEFAULT_CONTENT): Cosmonaut[] {
  return content.roster.map(crew => ({
    ...crew, condition: 'ready', ration: { food: true, water: true },
    consecutiveMissedNights: 0, fullRationNights: 0,
  }));
}
export { CARD_LIBRARY };
