import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import type { SceneSnapshot } from './scene-snapshot';
import { createGame } from '../phaser/config';
import { bridge } from './typed-event-bus';

interface Props {
  snapshot: SceneSnapshot;
  className?: string;
  onSceneReady?: () => void;
  /** Dipanggil jika Phaser gagal init/create. React harus menampilkan fallback HTML. */
  onSceneError?: (message: string) => void;
}

/**
 * Menempel Phaser ke React. Idempoten: snapshot yang sama boleh dikirim berulang.
 * Remount-safe (StrictMode): setiap mount membuat game baru dan unmount menghancurkannya + off() semua listener.
 * Tidak pernah memutasi state game.
 */
export function SceneBridge({ snapshot, className, onSceneReady, onSceneError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const latestSnapshot = useRef(snapshot);
  const readyRef = useRef(false);
  const cbReady = useRef(onSceneReady);
  const cbError = useRef(onSceneError);

  useEffect(() => {
    latestSnapshot.current = snapshot;
    cbReady.current = onSceneReady;
    cbError.current = onSceneError;
  });

  // Mount/unmount Phaser sekali per mount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let game: Phaser.Game | null = null;
    readyRef.current = false;

    const offReady = bridge.on('enam:scene-ready', () => {
      readyRef.current = true;
      bridge.emit('enam:scene-snapshot', latestSnapshot.current); // kirim ulang snapshot terbaru setelah ready/remount
      cbReady.current?.();
    });
    const offError = bridge.on('enam:scene-error', ({ message }) => cbError.current?.(message));

    try {
      game = createGame(container);
    } catch (err) {
      cbError.current?.(err instanceof Error ? err.message : String(err));
    }

    return () => {
      readyRef.current = false;
      offReady();
      offError();
      game?.destroy(true); // true = hapus canvas dari DOM
      game = null;
    };
  }, []);

  // Sinkronisasi snapshot (hanya setelah scene ready).
  useEffect(() => {
    if (readyRef.current) bridge.emit('enam:scene-snapshot', snapshot);
  }, [snapshot]);

  return <div ref={containerRef} className={className} data-testid="phaser-container" />;
}
