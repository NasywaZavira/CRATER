import { useEffect, useState } from 'react';
import { SceneBridge } from './bridge/SceneBridge';
import { sceneSnapshotFixture } from './bridge/fixtures';
import type { Cycle, SceneSnapshot } from './bridge/scene-snapshot';
import { MissionCinematic } from './mission/MissionCinematic';
import type { MissionEnding } from './mission/ending';
import './styles/outpost.css';

/**
 * DEMO SCENE PHASER (bagian Akbar). ZIP ini belum memiliki engine/kartu/meter.
 * Intro asli terpasang; ending tersedia untuk preview melalui Shift+1..5 atau ?ending=...
 * Saat engine diintegrasikan, panggil resolveMissionEnding(state) untuk pemicu otomatis.
 *
 * Kontrol asli dipertahankan: 1..4 kru tersedia/tidak, P/S/E/M fase, R reset snapshot.
 */
const CREW_SHORTCUT: Record<string, string> = {
  '1': 'toria',
  '2': 'sylvan',
  '3': 'corin',
  '4': 'cirra',
};
const PHASE_SHORTCUT: Record<string, Cycle> = {
  p: 'morning',
  s: 'afternoon',
  e: 'evening',
  m: 'night',
};

const ENDING_PREVIEW: Record<string, MissionEnding> = {
  Digit1: 'lifeSupport',
  Digit2: 'shielding',
  Digit3: 'power',
  Digit4: 'food',
  Digit5: 'success',
};

function endingFromUrl(): MissionEnding | null {
  const value = new URLSearchParams(window.location.search).get('ending');
  if (value === 'lifeSupport' || value === 'shielding' || value === 'power' || value === 'food' || value === 'success') {
    return value;
  }
  return null;
}

export default function App() {
  const [previewEnding] = useState<MissionEnding | null>(endingFromUrl);
  const [stage, setStage] = useState<'intro' | 'game' | 'ending'>(() => previewEnding ? 'ending' : 'intro');
  const [ending, setEnding] = useState<MissionEnding>(previewEnding ?? 'success');
  const [snapshot, setSnapshot] = useState<SceneSnapshot>(sceneSnapshotFixture);
  const [sceneError, setSceneError] = useState<string | null>(null);

  useEffect(() => {
    if (stage !== 'game') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;

      // Hanya preview ending: tidak memalsukan data engine yang belum ada di ZIP ini.
      if (event.shiftKey && ENDING_PREVIEW[event.code]) {
        setEnding(ENDING_PREVIEW[event.code]);
        setStage('ending');
        return;
      }
      if (event.shiftKey) return;

      const key = event.key.toLowerCase();
      const crewId = CREW_SHORTCUT[key];
      if (crewId) {
        setSnapshot(previous => ({
          ...previous,
          crew: previous.crew.map(crew =>
            crew.id === crewId ? { ...crew, available: !crew.available } : crew,
          ),
        }));
      } else if (PHASE_SHORTCUT[key]) {
        setSnapshot(previous => ({ ...previous, cycle: PHASE_SHORTCUT[key] }));
      } else if (key === 'r') {
        setSnapshot(sceneSnapshotFixture);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stage]);

  const restart = () => {
    setSnapshot(sceneSnapshotFixture);
    setSceneError(null);
    setStage('intro');
  };

  if (stage === 'intro') {
    return <MissionCinematic key="mission-intro" mode="intro" onFinish={() => setStage('game')} />;
  }
  if (stage === 'ending') {
    return (
      <MissionCinematic
        key={`mission-ending-${ending}`}
        mode="ending"
        result={ending}
        threshold={0}
        onFinish={restart}
      />
    );
  }

  return (
    <main className="outpost-desktop" aria-label="CRATER Mars Outpost scene">
      <div className="outpost-stage">
        <SceneBridge
          snapshot={snapshot}
          className="outpost-phaser"
          onSceneError={setSceneError}
        />
        {sceneError && (
          <p role="alert" className="outpost-error">
            Scene gagal dibuka: {sceneError}
          </p>
        )}
      </div>
    </main>
  );
}
