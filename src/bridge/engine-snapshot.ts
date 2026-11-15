import type { GameState, CardCategory } from '../../engine/types';
import { sceneSnapshotFixture } from './fixtures';
import type { Hazard, SceneSnapshot } from './scene-snapshot';

/** Thin adapter: the Phaser scene draws only state owned by engine. */
export function sceneFromEngine(state: GameState, workingCategory: CardCategory | null): SceneSnapshot {
  const id = state.activeDisaster?.id;
  const hazard: Hazard = !id ? 'none' : id === 'dustStorm' ? 'dust-storm' : id === 'solarParticle' ? 'solar-storm' : 'alarm';
  const workingCrew = workingCategory === 'operations' ? 'toria' :
    workingCategory === 'research' ? 'corin' : workingCategory === 'exploration' ? 'sylvan' :
    workingCategory === 'construction' ? 'toria' : workingCategory === 'upgrade' ? 'cirra' :
    workingCategory === 'repair' ? 'sylvan' : null;
  return {
    sol: Math.max(1, state.sol), cycle: state.cycle, hazard,
    crew: sceneSnapshotFixture.crew.map(c => ({
      ...c,
      available: state.cosmonauts.some(member => member.id === c.id && member.condition !== 'unwell') && c.id !== workingCrew,
    })),
  };
}
