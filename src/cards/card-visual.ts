import type { CardDefinition, ResourceKey } from '../../engine/types';

/** Resource illustration is driven by the largest positive card benefit. If a
 * card has only negative immediate effects, look at the delayed benefit.
 * This is solely presentation: it never changes JSON effects or draw odds.
 */
export function cardVisualResource(card: Pick<CardDefinition, 'effects' | 'delayed'>): ResourceKey {
  // For the current GDD catalog, the contextual group overrides numerical heuristics.
  if ('primaryMeter' in card && card.primaryMeter) return card.primaryMeter as ResourceKey;
  const priority: readonly ResourceKey[] = ['lifeSupport', 'shielding', 'power', 'food'];
  const scores = priority.map(key => ({
    key,
    score: Math.max(0, card.effects[key]) + Math.max(0, card.delayed?.effects[key] ?? 0),
  }));
  const best = scores.reduce((a, b) => b.score > a.score ? b : a);
  if (best.score > 0) return best.key;
  return priority.reduce((a, b) => Math.abs(card.effects[b]) > Math.abs(card.effects[a]) ? b : a);
}
