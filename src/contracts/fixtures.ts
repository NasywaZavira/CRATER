import type { SceneSnapshot } from './types';

/** Fixture dari Blueprint (crew.json). Dipakai Akbar/Alip sebelum engine siap. */
export const sceneSnapshotFixture: SceneSnapshot = {
  day: 1,
  cycle: 'morning',
  theme: 'morning',
  crew: [
    { id: 'crew-power', role: 'powerEngineer', artKey: 'crew-engineer-1' },
    { id: 'crew-shield', role: 'shieldEngineer', artKey: 'crew-engineer-2' },
    { id: 'crew-medic', role: 'medic', artKey: 'crew-medic' },
    { id: 'crew-botanist', role: 'botanist', artKey: 'crew-botanist' },
  ],
};
