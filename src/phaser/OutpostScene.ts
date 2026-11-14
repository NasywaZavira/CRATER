import Phaser from 'phaser';
import { bridge } from '../bridge/typed-event-bus';
import type { SceneSnapshot } from '../contracts/types';
import { LIGHTING } from './lighting';
import { BG_FILE, BG_KEY, CREW_ART_KEYS, createCrewView, type CrewView } from './sprites';

export const OUTPOST_SCENE_KEY = 'OutpostScene';

/**
 * Satu-satunya scene Phaser. HANYA render proyeksi SceneSnapshot:
 * background, 4 kru, pencahayaan, label cycle. Tidak memilih kartu / menghitung hari / menyimpan state.
 */
export class OutpostScene extends Phaser.Scene {
  private snapshot: SceneSnapshot | null = null;
  private snapshotKey = '';
  private crewKey = '';

  private bgGfx?: Phaser.GameObjects.Graphics;
  private bgImage?: Phaser.GameObjects.Image;
  private overlay?: Phaser.GameObjects.Rectangle;
  private cycleText?: Phaser.GameObjects.Text;
  private crewViews: CrewView[] = [];
  private lightTween?: Phaser.Tweens.Tween;
  private cleanedUp = false;

  private offSnapshot?: () => void;

  constructor() {
    super(OUTPOST_SCENE_KEY);
  }

  preload(): void {
    this.load.setPath(`${import.meta.env.BASE_URL}assets/`);
    // File yang hilang hanya memicu 'loaderror' -> kita fallback ke shapes, tidak crash.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[OutpostScene] aset tidak ada, pakai fallback: ${file.key}`);
    });
    this.load.image(BG_KEY, BG_FILE);
    for (const key of CREW_ART_KEYS) this.load.image(key, `${key}.png`);
  }

  create(): void {
    try {
      this.cleanedUp = false;
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
      this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);

      this.bgGfx = this.add.graphics().setDepth(0);
      if (this.textures.exists(BG_KEY)) {
        this.bgImage = this.add.image(0, 0, BG_KEY).setDepth(0);
      }
      this.overlay = this.add.rectangle(0, 0, 10, 10, 0x000000, 0).setOrigin(0).setDepth(50);
      this.cycleText = this.add
        .text(12, 10, '', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.45)',
          padding: { x: 8, y: 4 },
        })
        .setDepth(60);

      this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
      this.offSnapshot = bridge.on('enam:scene-snapshot', (s) => this.applySnapshot(s));

      this.layout();
      // Beri tahu React bahwa scene siap; React akan mengirim snapshot terbaru.
      bridge.emit('enam:scene-ready', { ready: true });
    } catch (err) {
      bridge.emit('enam:scene-error', { message: err instanceof Error ? err.message : String(err) });
    }
  }

  /** Idempoten: snapshot yang sama dua kali tidak mengubah apa pun. */
  private applySnapshot(next: SceneSnapshot): void {
    if (this.cleanedUp) return;
    const key = JSON.stringify(next);
    if (key === this.snapshotKey) return;

    const prev = this.snapshot;
    this.snapshot = next;
    this.snapshotKey = key;

    const crewKey = JSON.stringify(next.crew);
    if (crewKey !== this.crewKey) {
      this.crewKey = crewKey;
      this.rebuildCrew();
    }

    const themeChanged = !prev || prev.theme !== next.theme;
    this.applyLighting(next.theme, !!prev && themeChanged);
    this.cycleText?.setText(`DAY ${String(next.day).padStart(2, '0')} / 08 · ${LIGHTING[next.theme].label}`);
    this.drawBackground();
  }

  private applyLighting(theme: SceneSnapshot['theme'], animate: boolean): void {
    const overlay = this.overlay;
    if (!overlay) return;
    const target = LIGHTING[theme];
    this.lightTween?.stop();

    if (!animate) {
      overlay.setFillStyle(target.color, target.alpha);
      return;
    }
    const from = Phaser.Display.Color.IntegerToColor(overlay.fillColor);
    const to = Phaser.Display.Color.IntegerToColor(target.color);
    const startAlpha = overlay.fillAlpha;
    const proxy = { t: 0 };
    this.lightTween = this.tweens.add({
      targets: proxy,
      t: 1,
      duration: 600,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 1, proxy.t);
        overlay.setFillStyle(
          Phaser.Display.Color.GetColor(c.r, c.g, c.b),
          Phaser.Math.Linear(startAlpha, target.alpha, proxy.t),
        );
      },
    });
  }

  private rebuildCrew(): void {
    for (const v of this.crewViews) {
      this.tweens.killTweensOf(v.inner);
      v.root.destroy();
    }
    this.crewViews = [];
    if (!this.snapshot) return;

    const size = this.crewSize();
    this.snapshot.crew.forEach((c, i) => {
      const view = createCrewView(this, c.role, c.artKey, size);
      view.root.setDepth(10);
      // idle bob; delay dibedakan agar tidak serempak
      this.tweens.add({
        targets: view.inner,
        y: -4,
        duration: 1200 + i * 150,
        delay: i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.crewViews.push(view);
    });
    this.positionCrew();
  }

  private crewSize(): number {
    const { width, height } = this.scale;
    return Math.max(56, Math.min(width, height) * 0.2);
  }

  private positionCrew(): void {
    const { width, height } = this.scale;
    const wide = width > height * 1.2;
    const slots = wide
      ? [0.2, 0.4, 0.6, 0.8].map((x) => [x, 0.82] as const)
      : ([[0.3, 0.66], [0.7, 0.66], [0.3, 0.9], [0.7, 0.9]] as const);
    this.crewViews.forEach((v, i) => {
      const [sx, sy] = slots[i] ?? slots[0];
      v.root.setPosition(width * sx, height * sy);
    });
  }

  private layout(): void {
    if (this.cleanedUp) return;
    const { width, height } = this.scale;
    this.overlay?.setSize(width, height);
    this.drawBackground();

    // ukuran kru berubah mengikuti layar -> bangun ulang bila sudah ada snapshot
    if (this.snapshot) this.rebuildCrew();
  }

  /** Background: PNG/WebP "cover" bila ada; kalau tidak, outpost prosedural dari shapes. */
  private drawBackground(): void {
    const g = this.bgGfx;
    if (!g) return;
    const { width: w, height: h } = this.scale;
    g.clear();

    if (this.bgImage) {
      const s = Math.max(w / this.bgImage.width, h / this.bgImage.height); // cover, tanpa distorsi
      this.bgImage.setScale(s).setPosition(w / 2, h / 2);
    } else {
      const horizon = h * 0.5;
      // langit: pita warna (hindari API gradient agar aman lintas renderer)
      const bands = 8;
      for (let i = 0; i < bands; i++) {
        const t = i / (bands - 1);
        const r = Math.round(Phaser.Math.Linear(0x2a, 0xc9, t));
        const gr = Math.round(Phaser.Math.Linear(0x14, 0x7a, t));
        const b = Math.round(Phaser.Math.Linear(0x1c, 0x52, t));
        g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b), 1);
        g.fillRect(0, (horizon / bands) * i, w, horizon / bands + 1);
      }
      // tanah Mars
      g.fillStyle(0x8c3f24, 1).fillRect(0, horizon, w, h - horizon);
      g.fillStyle(0x72321c, 1).fillRect(0, horizon + (h - horizon) * 0.55, w, (h - horizon) * 0.45);
      // kubah outpost
      const cx = w / 2;
      const domeR = Math.min(w, h) * 0.22;
      g.fillStyle(0x59606b, 1).fillRect(cx - domeR * 1.6, horizon - domeR * 0.15, domeR * 3.2, domeR * 0.3);
      g.fillStyle(0x7d8794, 1).fillCircle(cx, horizon, domeR);
      g.fillStyle(0x59606b, 1).fillRect(cx - domeR * 1.1, horizon, domeR * 2.2, domeR * 0.25);
      g.fillStyle(0xffd27a, 0.9).fillRect(cx - domeR * 0.15, horizon - domeR * 0.45, domeR * 0.3, domeR * 0.35); // jendela
    }

    // penanda matahari / bulan mengikuti cycle
    const theme = this.snapshot?.theme ?? 'morning';
    const preset = LIGHTING[theme];
    const cy = preset.celestial === 'sun-high' ? h * 0.12 : preset.celestial === 'sun-low' ? h * 0.34 : h * 0.14;
    const cx = preset.celestial === 'sun-low' ? w * 0.18 : preset.celestial === 'sun-high' ? w * 0.5 : w * 0.82;
    const r = Math.min(w, h) * 0.05;
    if (preset.celestial === 'moon') {
      g.fillStyle(0xe8ecff, 1).fillCircle(cx, cy, r);
    } else {
      g.fillStyle(0xfff1c0, 1).fillCircle(cx, cy, r);
    }
  }

  /** Dipanggil pada SHUTDOWN dan DESTROY; aman dipanggil dua kali. */
  private cleanup(): void {
    if (this.cleanedUp) return;
    this.cleanedUp = true;
    this.offSnapshot?.();
    this.offSnapshot = undefined;
    this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.lightTween?.stop();
    this.tweens.killAll();
    this.crewViews = [];
    this.snapshot = null;
    this.snapshotKey = '';
    this.crewKey = '';
  }
}
