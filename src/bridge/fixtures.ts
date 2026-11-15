import type { SceneSnapshot } from './scene-snapshot';

/** Fixture CRATER sesuai GDD: empat astronaut; semua tersedia di awal Sol 1. */
export const sceneSnapshotFixture: SceneSnapshot = {
  sol: 1,
  cycle: 'morning',
  hazard: 'none',
  crew: [
    { id: 'toria', name: 'Toria', role: 'commander', artKey: 'crew-toria', available: true },
    { id: 'sylvan', name: 'Sylvan', role: 'geologist', artKey: 'crew-sylvan', available: true },
    { id: 'corin', name: 'Corin', role: 'medic', artKey: 'crew-corin', available: true },
    { id: 'cirra', name: 'Cirra', role: 'engineer', artKey: 'crew-cirra', available: true },
  ],
};
