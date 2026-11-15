/**
 * Kontrak sisi-scene (milik Akbar). Phaser hanya mengenal tipe ini.
 * Tipe ditulis ulang secara struktural supaya bridge tidak bergantung pada lokasi folder engine Pocut;
 * GameState miliknya otomatis memenuhi SceneSource.
 */
export type Cycle = 'morning' | 'afternoon' | 'evening' | 'night';
export type CosmonautRole = 'commander' | 'engineer' | 'medic' | 'geologist' | 'pilot';
/** Efek bencana yang digambar scene. 'none' = normal. */
export type Hazard = 'none' | 'dust-storm' | 'solar-storm' | 'alarm';

export interface SceneCrew {
  id: string;
  name: string;
  role: CosmonautRole;
  artKey: string; // crew-<id>, mis. crew-toria
  available: boolean; // false = sedang bekerja / cooldown -> sprite hilang dari outpost
}

export interface SceneSnapshot {
  sol: number;
  cycle: Cycle; // sekaligus tema pencahayaan
  crew: SceneCrew[];
  hazard: Hazard;
}

/** Bagian GameState (Pocut) yang dibutuhkan scene. */
export interface SceneSource {
  sol: number;
  cycle: Cycle;
  cosmonauts: ReadonlyArray<{ id: string; name: string; role: CosmonautRole; available: boolean }>;
  /** TimedEvent Pocut memenuhi bentuk ini. `hazard` opsional: bila nanti ditambahkan ke event, dipakai langsung. */
  activeEvent?: { id: string; title?: string; hazard?: Hazard } | null;
}

/**
 * Tebakan efek visual dari event. Pakai `event.hazard` bila ada (lebih andal);
 * kalau tidak, cocokkan kata kunci pada id/judul. Event tak dikenal -> 'alarm'.
 */
export function hazardFromEvent(event: SceneSource['activeEvent']): Hazard {
  if (!event) return 'none';
  if (event.hazard) return event.hazard;
  const text = `${event.id} ${event.title ?? ''}`.toLowerCase();
  if (/solar|surya|radiat|radiasi|particle|partikel/.test(text)) return 'solar-storm';
  if (/dust|debu/.test(text)) return 'dust-storm';
  return 'alarm';
}

/** Murni & deterministik: GameState -> SceneSnapshot. Sebelum START (sol 0) ditampilkan sebagai sol 1. */
export function deriveSceneSnapshot(state: SceneSource): SceneSnapshot {
  return {
    sol: Math.max(1, state.sol),
    cycle: state.cycle,
    crew: state.cosmonauts.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      artKey: `crew-${c.id}`,
      available: c.available,
    })),
    hazard: hazardFromEvent(state.activeEvent),
  };
}
