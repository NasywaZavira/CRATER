/**
 * DEV HARNESS sementara untuk Akbar (App.tsx sebenarnya milik Alip).
 * Fungsinya: menguji OutpostScene + bridge dengan fixture, tanpa menunggu engine A.
 * Jangan di-merge ke main; pakai hanya di branch feat/phaser-akbar.
 */
import { useMemo, useState } from 'react';
import { SceneBridge } from './bridge/SceneBridge';
import { sceneSnapshotFixture } from './contracts/fixtures';
import { CYCLES, type Cycle, type SceneSnapshot } from './contracts/types';

export default function App() {
  const [day, setDay] = useState(1);
  const [cycle, setCycle] = useState<Cycle>('morning');
  const [mounted, setMounted] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const snapshot = useMemo<SceneSnapshot>(
    () => ({ ...sceneSnapshotFixture, day, cycle, theme: cycle }),
    [day, cycle],
  );

  const btn = 'min-h-11 rounded bg-stone-700 px-3 text-base active:bg-stone-600';

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-2 p-2">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-stone-700">
        {mounted && !error && (
          <SceneBridge
            className="absolute inset-0"
            snapshot={snapshot}
            onSceneError={(m) => setError(m)}
          />
        )}
        {(error || !mounted) && (
          <div className="p-4 text-base" role="status">
            {error ? `Phaser gagal: ${error}. Fallback HTML:` : 'Scene unmounted (tes cleanup).'}
            <ul className="mt-2 list-disc pl-6">
              {snapshot.crew.map((c) => (
                <li key={c.id}>{c.role}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className={btn} onClick={() => setDay((d) => Math.max(1, d - 1))}>Day −</button>
        <span className="px-1">Day {day}/8</span>
        <button className={btn} onClick={() => setDay((d) => Math.min(8, d + 1))}>Day +</button>
        {CYCLES.map((c) => (
          <button key={c} className={`${btn} ${c === cycle ? 'ring-2 ring-amber-400' : ''}`} onClick={() => setCycle(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={() => setMounted((m) => !m)}>{mounted ? 'Unmount' : 'Remount'} scene</button>
        <button className={btn} onClick={() => { setError(null); setMounted(true); }}>Reset error</button>
      </div>
    </div>
  );
}
