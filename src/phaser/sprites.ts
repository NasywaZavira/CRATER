import Phaser from 'phaser';
import type { CosmonautRole, SceneCrew } from '../bridge/scene-snapshot';
import { shouldShowCrew } from './crew-visibility';

const ROLE_COLOR: Record<CosmonautRole, number> = {
  commander: 0xf5a623,
  engineer: 0x4a90e2,
  medic: 0xe94b4b,
  geologist: 0x9b6b3f,
  pilot: 0x5cb85c,
};

/** Path aset (public/assets). Jika file tidak ada, scene memakai shapes. */
export const BG_KEY = 'outpost-bg'; // satu background untuk semua cycle (opsional)
export const BG_FILE = 'outpost-bg.webp';
/** Opsional: satu background per tampilan. morning/afternoon/night wajib lengkap; evening opsional. */
export const BG_LOOK_KEYS = {
  morning: 'outpost-bg-morning',
  afternoon: 'outpost-bg-afternoon',
  evening: 'outpost-bg-evening',
  night: 'outpost-bg-night',
} as const;
/** Sprite kru: crew-<id>.png (id kosmonot dari engine). */
export const CREW_ART_KEYS = ['crew-toria', 'crew-cirra', 'crew-corin', 'crew-sylvan'] as const;

/** Rasio lebar/tinggi sprite kru (3:4). */
export const SPRITE_ASPECT = 0.75;

export interface CrewView {
  root: Phaser.GameObjects.Container; // diposisikan oleh layout
  inner: Phaser.GameObjects.Container; // di-tween untuk idle bob
  hasSprite: boolean;
}

/**
 * Satu kru. Memakai PNG bila texture ada (duduk, bagian bawah disembunyikan meja);
 * kalau tidak, siluet shapes + nama. Kru yang bekerja (available=false) disembunyikan.
 * `size` = tinggi target sprite (px).
 */
export function createCrewView(scene: Phaser.Scene, crew: SceneCrew, size: number): CrewView {
  const inner = scene.add.container(0, 0);
  const hasSprite = scene.textures.exists(crew.artKey);

  if (hasSprite) {
    const img = scene.add.image(0, 0, crew.artKey).setOrigin(0.5, 1);
    img.setScale(size / img.height);
    inner.add(img); // nama sudah tertulis di baju, tidak perlu label
  } else {
    const h = size * 0.6;
    const g = scene.add.graphics();
    const color = ROLE_COLOR[crew.role] ?? 0x888888;
    const w = h * 0.5;
    g.fillStyle(0x1b1b24, 1).fillRoundedRect(-w / 2, -h * 0.62, w, h * 0.62, w * 0.25);
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h * 0.42, w, h * 0.1, 2); // strip role
    g.fillStyle(0x2a2a36, 1).fillCircle(0, -h * 0.78, h * 0.2);
    g.fillStyle(0x9fd4ff, 0.85).fillCircle(0, -h * 0.78, h * 0.12); // visor
    inner.add(g);
    inner.add(
      scene.add
        .text(0, 6, crew.name, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: `${Math.max(12, Math.round(h * 0.16))}px`,
          color: '#f3e6dc',
          backgroundColor: 'rgba(0,0,0,0.45)',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5, 0),
    );
  }

  const root = scene.add.container(0, 0, [inner]);
  root.setVisible(shouldShowCrew(crew));
  return { root, inner, hasSprite };
}
