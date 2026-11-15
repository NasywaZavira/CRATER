import Phaser from 'phaser';
import { bridge } from '../bridge/typed-event-bus';
import type { Hazard, SceneCrew, SceneSnapshot } from '../bridge/scene-snapshot';
import { LIGHTING, lerpColor, lookPath, type Look } from './lighting';
import { CREW_ART_KEYS, createCrewView, type CrewView } from './sprites';
import { shouldShowCrew } from './crew-visibility';

export const OUTPOST_SCENE_KEY = 'OutpostScene';

// Canvas asli dibuat pada 2048x1152 (16:9). Semua layer berada dalam koordinat yang sama.
// Nilai ini bisa disesuaikan untuk mengganti posisi kru tanpa memotong PNG sumber.
const ART_W = 2048;
const ART_H = 1152;
const LOOKS: Look[] = ['morning', 'afternoon', 'evening', 'night'];
const CREW_LAYOUT: Record<string, { left: number; top: number; scale: number }> = {
  toria: { left: 82, top: 280, scale: 0.36 },
  sylvan: { left: 592, top: 235, scale: 0.285 },
  corin: { left: 1020, top: 225, scale: 0.32 },
  cirra: { left: 1512, top: 215, scale: 0.34 },
};

function reduceMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * CRATER Outpost: scene presentasi saja; seluruh meter, keputusan kartu dan pergantian
 * Sol tetap berasal dari React/engine melalui SceneSnapshot. Jadi tidak duplikasi state.
 * Urutan z: Mars sky -> interior transparan -> kru -> meja oval -> lighting -> hazard.
 */
export class OutpostScene extends Phaser.Scene {
  private snapshot: SceneSnapshot | null = null;
  private snapshotKey = '';
  private rosterKey = '';
  private hazard: Hazard = 'none';

  private skyLayers = new Map<Look, Phaser.GameObjects.Image>();
  private room?: Phaser.GameObjects.Image;
  private table?: Phaser.GameObjects.Image;
  private ambience?: Phaser.GameObjects.Rectangle;
  private crewViews: Array<{ crew: SceneCrew; view: CrewView }> = [];
  private fxObjects: Phaser.GameObjects.GameObject[] = [];

  private fromLook: Look = 'morning';
  private toLook: Look = 'morning';
  private mix = 1;
  private lookQueue: Look[] = [];
  private transition?: Phaser.Tweens.Tween;
  private cleaned = false;
  private unsubscribe?: () => void;

  constructor() {
    super(OUTPOST_SCENE_KEY);
  }

  preload(): void {
    this.load.setPath(`${import.meta.env.BASE_URL}assets/`);
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[CRATER] Aset gagal dimuat: ${file.key}`);
    });
    for (const look of LOOKS) this.load.image(`mars-sky-${look}`, `mars-sky-${look}.png`);
    this.load.image('crater-outpost-room', 'outpost-room.png');
    this.load.image('crater-outpost-table', 'outpost-table.png');
    for (const key of CREW_ART_KEYS) this.load.image(key, `${key}.png`);
  }

  create(): void {
    try {
      this.cleaned = false;
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
      this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);

      for (const look of LOOKS) {
        if (this.textures.exists(`mars-sky-${look}`)) {
          const img = this.add.image(0, 0, `mars-sky-${look}`).setOrigin(0).setDepth(-20);
          this.skyLayers.set(look, img);
        }
      }
      if (this.textures.exists('crater-outpost-room')) {
        this.room = this.add.image(0, 0, 'crater-outpost-room').setOrigin(0).setDepth(0);
      }
      if (this.textures.exists('crater-outpost-table')) {
        this.table = this.add.image(0, 0, 'crater-outpost-table').setOrigin(0).setDepth(20);
      }
      this.ambience = this.add.rectangle(0, 0, 1, 1, 0xffffff, 0).setOrigin(0).setDepth(30);

      this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
      this.unsubscribe = bridge.on('enam:scene-snapshot', (s) => this.applySnapshot(s));
      this.layout();
      bridge.emit('enam:scene-ready', { ready: true });
    } catch (error) {
      bridge.emit('enam:scene-error', { message: error instanceof Error ? error.message : String(error) });
    }
  }

  private applySnapshot(next: SceneSnapshot): void {
    if (this.cleaned) return;
    const snapshotKey = JSON.stringify(next);
    if (snapshotKey === this.snapshotKey) return;
    const old = this.snapshot;
    this.snapshot = next;
    this.snapshotKey = snapshotKey;

    // Hanya bangun ulang sprite kalau daftar/desain crew berubah.
    // available berubah saat bekerja => cukup sembunyikan/tampilkan tanpa rebuild.
    const rosterKey = JSON.stringify(next.crew.map(({ id, name, role, artKey }) => ({ id, name, role, artKey })));
    if (rosterKey !== this.rosterKey) {
      this.rosterKey = rosterKey;
      this.rebuildCrew();
    }
    this.syncCrewVisibility();

    if (!old) {
      this.fromLook = this.toLook = next.cycle;
      this.mix = 1;
      this.renderLighting();
    } else if (old.cycle !== next.cycle) {
      this.startTransition(next.cycle);
    }

    if (next.hazard !== this.hazard) {
      this.hazard = next.hazard;
      this.buildHazard();
    }
  }

  private startTransition(nextCycle: SceneSnapshot['cycle']): void {
    this.transition?.stop();
    const startingLook = this.mix >= 0.5 ? this.toLook : this.fromLook;
    this.fromLook = this.toLook = startingLook;
    this.mix = 1;
    this.lookQueue = lookPath(startingLook, nextCycle);
    this.stepTransition();
  }

  private stepTransition(): void {
    const next = this.lookQueue.shift();
    if (!next || this.cleaned) return;
    this.toLook = next;
    this.mix = 0;
    if (reduceMotion()) {
      this.fromLook = next;
      this.mix = 1;
      this.renderLighting();
      this.stepTransition();
      return;
    }
    const proxy = { mix: 0 };
    this.transition = this.tweens.add({
      targets: proxy,
      mix: 1,
      duration: this.lookQueue.length ? 450 : 850,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.mix = proxy.mix;
        this.renderLighting();
      },
      onComplete: () => {
        this.fromLook = next;
        this.mix = 1;
        this.renderLighting();
        this.stepTransition();
      },
    });
  }

  private renderLighting(): void {
    if (this.cleaned) return;
    for (const [look, layer] of this.skyLayers) {
      let a = 0;
      if (look === this.fromLook) a += 1 - this.mix;
      if (look === this.toLook) a += this.mix;
      layer.setAlpha(a);
    }
    const a = LIGHTING[this.fromLook];
    const b = LIGHTING[this.toLook];
    const color = lerpColor(a.color, b.color, this.mix);
    const alpha = Phaser.Math.Linear(a.alpha, b.alpha, this.mix) * 0.52;
    this.ambience?.setFillStyle(color, alpha);
  }

  /** Setiap karakter memakai PNG individual yang dikirim; slot tidak bergantung urutan dari engine. */
  private rebuildCrew(): void {
    for (const entry of this.crewViews) {
      this.tweens.killTweensOf(entry.view.inner);
      entry.view.root.destroy();
    }
    this.crewViews = [];
    if (!this.snapshot) return;
    const s = this.getArtTransform().scale;
    this.snapshot.crew.forEach((crew, index) => {
      const layout = CREW_LAYOUT[crew.id] ?? { left: 100 + index * 450, top: 300, scale: 0.28 };
      const spriteHeight = 2048 * layout.scale * s;
      const view = createCrewView(this, crew, spriteHeight);
      view.root.setDepth(10 + index * 0.01);
      if (!reduceMotion()) {
        this.tweens.add({
          targets: view.inner,
          y: -2.8 * s,
          duration: 1600 + index * 250,
          delay: index * 150,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
      this.crewViews.push({ crew, view });
    });
    this.positionCrew();
    this.syncCrewVisibility();
  }

  /** Misi aktif = tidak ada di ruangan. Misi selesai = kembali terlihat. */
  private syncCrewVisibility(): void {
    if (!this.snapshot) return;
    const statusById = new Map(this.snapshot.crew.map(crew => [crew.id, crew]));
    for (const { crew, view } of this.crewViews) {
      const latest = statusById.get(crew.id);
      view.root.setVisible(latest ? shouldShowCrew(latest) : false);
    }
  }

  private getArtTransform() {
    const { width, height } = this.scale;
    const scale = Math.max(width / ART_W, height / ART_H); // cover, tidak distorsi
    return { scale, x: (width - ART_W * scale) / 2, y: (height - ART_H * scale) / 2 };
  }

  private positionCrew(): void {
    const { scale: s, x, y } = this.getArtTransform();
    this.crewViews.forEach(({ crew, view }, index) => {
      const p = CREW_LAYOUT[crew.id] ?? { left: 100 + index * 450, top: 300, scale: 0.28 };
      // createCrewView memakai image origin (0.5, 1), posisi ini = bottom-center gambar.
      view.root.setPosition(x + (p.left + 1536 * p.scale * 0.5) * s, y + (p.top + 2048 * p.scale) * s);
    });
  }

  private layout(): void {
    if (this.cleaned) return;
    const { scale: s, x, y } = this.getArtTransform();
    const fit = (img: Phaser.GameObjects.Image) => img.setPosition(x, y).setDisplaySize(ART_W * s, ART_H * s);
    this.skyLayers.forEach(fit);
    if (this.room) fit(this.room);
    this.table?.setPosition(x, y + 766 * s).setDisplaySize(ART_W * s, 386 * s);
    this.ambience?.setSize(this.scale.width, this.scale.height);
    this.renderLighting();
    if (this.snapshot) this.rebuildCrew();
    this.buildHazard();
  }

  private clearHazard(): void {
    for (const obj of this.fxObjects) {
      this.tweens.killTweensOf(obj);
      obj.destroy();
    }
    this.fxObjects = [];
  }

  private buildHazard(): void {
    this.clearHazard();
    if (this.cleaned || this.hazard === 'none') return;
    const { width: w, height: h } = this.scale;
    const reduced = reduceMotion();
    const fx = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth>(obj: T): T => {
      obj.setDepth(40);
      this.fxObjects.push(obj);
      return obj;
    };
    const breathe = (color: number, low: number, high: number, ms: number) => {
      const screen = fx(this.add.rectangle(0, 0, w, h, color, reduced ? (low + high) / 2 : low).setOrigin(0));
      if (!reduced) this.tweens.add({ targets: screen, alpha: high, duration: ms, yoyo: true, repeat: -1 });
    };
    if (this.hazard === 'dust-storm') {
      breathe(0xbd7652, 0.10, 0.27, 2300);
      for (let i = 0; i < 32; i++) {
        const len = Phaser.Math.Between(30, 105);
        const streak = fx(this.add.rectangle(reduced ? Phaser.Math.Between(0, w) : w + len,
          Phaser.Math.Between(0, h), len, 1.2, 0xffd4a1, Phaser.Math.FloatBetween(0.22, 0.55)));
        if (!reduced) this.tweens.add({ targets: streak, x: -len, duration: Phaser.Math.Between(1350, 2900), delay: Phaser.Math.Between(0, 2800), repeat: -1 });
      }
    } else if (this.hazard === 'solar-storm') {
      breathe(0xf7cb6b, 0.04, 0.18, 1400);
    } else if (this.hazard === 'alarm') {
      breathe(0xef5b54, 0.03, 0.17, 1200);
    }
  }

  private cleanup(): void {
    if (this.cleaned) return;
    this.cleaned = true;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.transition?.stop();
    this.tweens.killAll();
    this.crewViews = [];
    this.fxObjects = [];
    this.skyLayers.clear();
    this.room = this.table = undefined;
    this.snapshot = null;
    this.snapshotKey = this.rosterKey = '';
    this.hazard = 'none';
  }
}
