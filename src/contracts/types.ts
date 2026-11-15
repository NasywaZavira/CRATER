/**
 * SALINAN SEMENTARA dari Blueprint v2.2 bagian 03.
 * Milik A: ganti file ini dengan versi resmi setelah BASE-02 (contract freeze).
 * Akbar hanya memakai: Cycle, CrewRole, SceneSnapshot.
 */
export const TOTAL_DAYS = 8 as const;
export const CYCLES = ['morning', 'afternoon', 'night'] as const;
export type Cycle = (typeof CYCLES)[number];
export type CrewRole = 'powerEngineer' | 'shieldEngineer' | 'medic' | 'botanist';

export interface SceneSnapshot {
  day: number;
  cycle: Cycle;
  crew: Array<{ id: string; role: CrewRole; artKey: string }>;
  theme: 'morning' | 'afternoon' | 'night';
}
