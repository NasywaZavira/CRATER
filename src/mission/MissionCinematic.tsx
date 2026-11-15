import { useEffect, useState, type CSSProperties } from 'react';
import { FAILURE_LINES, OPENING_LINES, successLines, type FailureMeter } from './dialogues';
import '../styles/mission-cinematic.css';

export type MissionCinematicProps =
  | { mode: 'intro'; onFinish: () => void }
  | { mode: 'ending'; result: 'success' | FailureMeter; threshold?: number; finishLabel?: string; onFinish: () => void };

type Frame = 'briefing' | 'title' | 'report' | 'dialogue';
const INTRO_FRAMES: readonly Frame[] = ['briefing', 'title', 'dialogue'];
const ENDING_FRAMES: readonly Frame[] = ['report', 'dialogue'];
const FRAME_DURATION: Partial<Record<Frame, number>> = {
  briefing: 2200,
  title: 2600,
  report: 2300,
};

// Bintang CSS deterministik; seluruh file PNG karakter, termasuk NOE.png, tetap asli.
const STARS = Array.from({ length: 235 }, (_, index) => {
  const x = (index * 73.517 + (index % 13) * 4.9) % 100;
  const y = (index * 29.743 + (index % 11) * 8.3) % 100;
  const size = index % 37 === 0 ? 4 : index % 11 === 0 ? 2.4 : index % 3 === 0 ? 1.5 : 1;
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: size,
    height: size,
    opacity: index % 9 === 0 ? 0.95 : 0.48,
    animationDelay: `${(index % 9) * -0.43}s`,
  };
});

/** Tampilan intro dan laporan misi. Tidak mengubah state Phaser/game engine. */
export function MissionCinematic(props: MissionCinematicProps) {
  const frames = props.mode === 'intro' ? INTRO_FRAMES : ENDING_FRAMES;
  const [frameIndex, setFrameIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const frame = frames[frameIndex];
  const lines = props.mode === 'intro'
    ? OPENING_LINES
    : props.result === 'success'
      ? successLines(props.threshold ?? 0)
      : FAILURE_LINES[props.result];

  const endingReportNeedsContinue = props.mode === 'ending' && frame === 'report';

  useEffect(() => {
    const duration = FRAME_DURATION[frame];
    if (duration === undefined || endingReportNeedsContinue) return;
    const timer = window.setTimeout(() => {
      setFrameIndex(index => Math.min(index + 1, frames.length - 1));
    }, duration);
    return () => window.clearTimeout(timer);
  }, [frame, frames, endingReportNeedsContinue]);

  function advance() {
    if (lineIndex + 1 < lines.length) {
      setLineIndex(index => index + 1);
    } else {
      props.onFinish();
    }
  }

  const lastLine = lineIndex === lines.length - 1;
  return (
    <main className="mission-cinematic" aria-label={props.mode === 'intro' ? 'CRATER Mission Briefing' : 'CRATER Mission Ending'}>
      <section className="cinematic-screen">
        <div className="cinematic-nebula" aria-hidden="true" />
        <div className="cinematic-stars" aria-hidden="true">
          {STARS.map((style, index) => (
            <span className="cinematic-star" key={index} style={style as CSSProperties} />
          ))}
        </div>

        {frame === 'briefing' && <h1 className="cinematic-splash" key="briefing">Mission Briefing</h1>}
        {frame === 'title' && (
          <div className="cinematic-title" key="title">
            <h1>CRATER</h1>
            <p>Crew Resources and Trade-offs for Emergency Response</p>
          </div>
        )}
        {props.mode === 'ending' && frame === 'report' && (
          <div className="cinematic-report-panel" key="report">
            <h1 className="cinematic-splash">{props.result === 'success' ? 'Mission Success' : 'Mission Failure'}</h1>
            <button type="button" className="cinematic-report-continue" onClick={() => setFrameIndex(index => Math.min(index + 1, frames.length - 1))}>CONTINUE<span aria-hidden="true"> ›</span></button>
          </div>
        )}

        {frame === 'dialogue' && (
          <div className="cinematic-dialogue" key={props.mode}>
            <div className="cinematic-portrait-block">
              {/* NOE.png dari ZIP enam(4) sudah termasuk bingkai dan tulisan "NOE S.". */}
              <img src={`${import.meta.env.BASE_URL}assets/NOE.png`} alt="Noe S., Mission Control" />
            </div>
            <div className="cinematic-message" aria-live="polite">
              <p key={lineIndex}>“{lines[lineIndex]}”</p>
              <div className="cinematic-dialogue-bottom">
                <span>{String(lineIndex + 1).padStart(2, '0')} / {String(lines.length).padStart(2, '0')}</span>
                <button type="button" onClick={advance}>
                  {lastLine ? (props.mode === 'intro' ? 'START MISSION' : props.finishLabel ?? 'PLAY AGAIN') : 'CONTINUE'}
                  <span aria-hidden="true"> ›</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
