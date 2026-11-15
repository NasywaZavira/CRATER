import { CARD_LIBRARY } from '../data/cards';
import { CARD_CATEGORIES, RESOURCE_KEYS } from '../data/cards';
import type { CardCategory, CardDefinition, ResourceKey } from '../types';

export const METER_CATEGORY_LABEL: Record<ResourceKey, string> = {
  lifeSupport: 'LIFE SUPPORT',
  shielding: 'SHIELDING',
  power: 'POWER',
  food: 'FOOD',
};

/** Primary classification of each card; a secondary effect is not another primary grouping. */
export function getCardsByMeterAndCategory(
  meter: ResourceKey, category: CardCategory, cards: readonly CardDefinition[] = CARD_LIBRARY,
): CardDefinition[] {
  return cards.filter(card => card.primaryMeter === meter && card.category === category);
}

/** Indexed taxonomy: Life Support / Shielding / Power / Food -> six activity categories. */
export const GROUPED_CARDS_BY_METER: Record<ResourceKey, Record<CardCategory, readonly CardDefinition[]>> =
  Object.fromEntries(RESOURCE_KEYS.map(meter => [meter,
    Object.fromEntries(CARD_CATEGORIES.map(category => [category, getCardsByMeterAndCategory(meter, category)])),
  ])) as unknown as Record<ResourceKey, Record<CardCategory, readonly CardDefinition[]>>;
