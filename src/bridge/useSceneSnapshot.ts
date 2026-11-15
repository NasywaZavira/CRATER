import { useMemo } from 'react';
import { deriveSceneSnapshot, type SceneSnapshot, type SceneSource } from './scene-snapshot';

/**
 * Untuk Alip: `const snap = useSceneSnapshot(state)` lalu `<SceneBridge snapshot={snap} />`.
 * Identitas objek stabil selama isi snapshot sama (perubahan meter/kartu tidak memicu kirim ulang).
 */
export function useSceneSnapshot(state: SceneSource): SceneSnapshot {
  const next = deriveSceneSnapshot(state);
  const key = JSON.stringify(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => next, [key]);
}
