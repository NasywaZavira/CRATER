import type { SceneSnapshot } from '../contracts/types';

/** Kontrak event React <-> Phaser (Blueprint bagian 03 no. 7 + 'enam:scene-error' sebagai tambahan). */
export interface BridgeEvents {
  'enam:scene-ready': { ready: true };
  'enam:scene-snapshot': SceneSnapshot;
  'enam:scene-error': { message: string };
}

type Handler<K extends keyof BridgeEvents> = (payload: BridgeEvents[K]) => void;

/**
 * Event bus kecil bertipe, tanpa dependensi Phaser (bisa dites di Node).
 * on() mengembalikan fungsi unsubscribe supaya cleanup tinggal memanggilnya.
 */
export class TypedEventBus {
  private handlers = new Map<keyof BridgeEvents, Set<(payload: never) => void>>();

  on<K extends keyof BridgeEvents>(event: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof BridgeEvents>(event: K, handler: Handler<K>): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof BridgeEvents>(event: K, payload: BridgeEvents[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const h of [...set] as Handler<K>[]) h(payload); // salinan: aman jika handler off() dirinya sendiri
  }

  listenerCount(event: keyof BridgeEvents): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  clear(): void {
    this.handlers.clear();
  }
}

/** Satu bus bersama untuk seluruh app. */
export const bridge = new TypedEventBus();
