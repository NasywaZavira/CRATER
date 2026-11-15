import type { GameState, ResourceKey } from '../../engine/types';
import { sceneSnapshotFixture } from './fixtures';
import type { Hazard, SceneSnapshot } from './scene-snapshot';

/** Thin adapter: the Phaser scene draws only state owned by engine. */
/** During a played card's result window, hide the assigned specialist for its PRIMARY METER. */
export function sceneFromEngine(state: GameState, workingMeter: ResourceKey | null): SceneSnapshot {
  const id = state.activeDisaster?.id;
  const hazard: Hazard = !id ? 'none' : id === 'dustStorm' ? 'dust-storm' : id === 'solarParticle' ? 'solar-storm' : 'alarm';
  const specialistByMeter: Record<ResourceKey, string> = {
    lifeSupport: 'corin', shielding: 'toria', power: 'cirra', food: 'sylvan',
  };
  const workingCrew = workingMeter ? specialistByMeter[workingMeter] : null;
  return {
    sol: Math.max(1, state.sol), cycle: state.cycle, hazard,
    crew: sceneSnapshotFixture.crew.map(c => ({
      ...c,
      available: state.cosmonauts.some(member => member.id === c.id && member.condition !== 'unwell') && c.id !== workingCrew,
    })),
  };
}
