import Phaser from 'phaser';
import type { CrewRole } from '../contracts/types';

export const ROLE_LABEL: Record<CrewRole, string> = {
  powerEngineer: 'Power Eng.',
  shieldEngineer: 'Shield Eng.',
  medic: 'Medic',
  botanist: 'Botanist',
};

const ROLE_COLOR: Record<CrewRole, number> = {
  powerEngineer: 0xf5a623,
  shieldEngineer: 0x4a90e2,
  medic: 0xe94b4b,
  botanist: 0x5cb85c,
};

/** Path aset sesuai Blueprint (public/assets). Jika file tidak ada, scene memakai shapes. */
export const BG_KEY = 'outpost-bg';
export const BG_FILE = 'outpost-bg.webp';
export const CREW_ART_KEYS = ['crew-engineer-1', 'crew-engineer-2', 'crew-medic', 'crew-botanist'] as const;

export interface CrewView {
  root: Phaser.GameObjects.Container; // diposisikan oleh layout
  inner: Phaser.GameObjects.Container; // di-tween untuk idle bob
  height: number;
}

/**
 * Bangun satu kru. Memakai PNG bila texture ada; kalau tidak, siluet shapes + label role (BASE-16).
 * `size` = tinggi target dalam piksel.
 */
export function createCrewView(
  scene: Phaser.Scene,
  role: CrewRole,
  artKey: string,
  size: number,
): CrewView {
  const inner = scene.add.container(0, 0);

  if (scene.textures.exists(artKey)) {
    const img = scene.add.image(0, 0, artKey).setOrigin(0.5, 1);
    img.setScale(size / img.height);
    inner.add(img);
  } else {
    const g = scene.add.graphics();
    const color = ROLE_COLOR[role];
    const w = size * 0.5;
    // badan
    g.fillStyle(0x1b1b24, 1).fillRoundedRect(-w / 2, -size * 0.62, w, size * 0.62, w * 0.25);
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -size * 0.42, w, size * 0.1, 2); // strip role
    // helm
    g.fillStyle(0x2a2a36, 1).fillCircle(0, -size * 0.78, size * 0.2);
    g.fillStyle(0x9fd4ff, 0.85).fillCircle(0, -size * 0.78, size * 0.12); // visor
    inner.add(g);
  }

  const label = scene.add
    .text(0, 6, ROLE_LABEL[role], {
      fontFamily: 'system-ui, sans-serif',
      fontSize: `${Math.max(12, Math.round(size * 0.14))}px`,
      color: '#f3e6dc',
      backgroundColor: 'rgba(0,0,0,0.45)',
      padding: { x: 4, y: 2 },
    })
    .setOrigin(0.5, 0);
  inner.add(label);

  const root = scene.add.container(0, 0, [inner]);
  return { root, inner, height: size };
}
