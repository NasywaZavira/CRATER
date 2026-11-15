import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { SceneBridge } from './bridge/SceneBridge';
import { sceneFromEngine } from './bridge/engine-snapshot';
import type { SceneSnapshot } from './bridge/scene-snapshot';
import { useGameState } from '../engine/hooks/useGameState';
import {
  BALANCE, CARD_BY_ID, CATEGORY_LABEL, CYCLE_LABELS, DISASTER_LABELS,
  DONKI_ARCHIVE, DONKI_ARCHIVE_LABEL, METER_LABELS, METER_CATEGORY_LABEL, RESOURCE_KEYS,
  formatCardEffect, localize,
} from '../engine/logic';
import type { CardDefinition, Cycle, MeterEffects, ResourceKey } from '../engine/types';
import { cardVisualResource } from './cards/card-visual';
import { MissionCinematic } from './mission/MissionCinematic';
import { METER_FAILURE_THRESHOLD } from '../engine/data/balance';
import { resolveMissionEnding, type MissionEnding } from './mission/ending';
import './styles/outpost.css';

const BASE = import.meta.env.BASE_URL;
const WAIT_SECONDS = 3;
const BACKSOUND_SRC = `${BASE}assets/Backsound.mp3`;

const METER_UI: Record<ResourceKey, { color: string; abbrev: string }> = {
  lifeSupport: { color: '#79cfe9', abbrev: 'LS' },
  shielding: { color: '#cba1e8', abbrev: 'SH' },
  power: { color: '#f0cc75', abbrev: 'PW' },
  food: { color: '#85de9d', abbrev: 'FD' },
};

const PHASE_LABEL: Record<Cycle, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

const PHASE_DIALOGUE: Record<Cycle, { name: string; text: string }> = {
  morning: {
    name: 'Toria',
    text: 'Good morning, Commander. Let’s begin the routine checks.',
  },
  afternoon: {
    name: 'Sylvan',
    text: 'Let’s investigate what can help our outpost.',
  },
  evening: {
    name: 'Corin',
    text: 'Let’s strengthen the habitat before night falls.',
  },
  night: {
    name: 'Cirra',
    text: 'Time to distribute water and food before the next Sol.',
  },
};

const INTRO = [
  {
    title: 'WELCOME ABOARD',
    text: 'Welcome, Commander! I am Noe, calling from Mission Control on Earth. Your mission lasts eight Sols.',
  },
  {
    title: 'WHAT IS A SOL?',
    text: 'A Sol is one day on Mars. Each of the eight Sols has Morning (Daily Routine), Afternoon (Research / Exploration), Evening (Building / Upgrade), and Night (rations and evaluation).',
  },
  {
    title: 'FOUR OUTPOST SYSTEMS',
    text: 'Keep Life Support, Shielding, Power, and Food above 40/100. Any meter at 40 or below triggers its own Bad Ending. Card effects come from the NASA card JSON, and some upgrades provide delayed benefits.',
  },
  {
    title: 'CARDS & NASA SOURCES',
    text: 'Choose one of three cards after a 3-second transmission. Each card features a NASA fact, dataset, and source. Skipping reduces all four meters, while disasters offer FIX cards.',
  },
];

type ViewMode = 'tutorial' | 'waiting' | 'cards' | 'result' | 'night';

const EMPTY_EFFECTS: MeterEffects = {
  lifeSupport: 0,
  shielding: 0,
  power: 0,
  food: 0,
};

function MeterBar({
  resource,
  value,
  delta,
}: {
  resource: ResourceKey;
  value: number;
  delta: number | null;
}) {
  const blocks = Math.round(value / 100 * 12);
  const ui = METER_UI[resource];

  return (
    <div
      className="meter"
      aria-label={`${METER_LABELS[resource]}: ${value} out of 100`}
    >
      <span className="meter-symbol" aria-hidden="true">
        <HudMeterIcon resource={resource} />
      </span>

      <div className="meter-main">
        <div
          className="meter-segments"
          aria-hidden="true"
          style={{ '--meter-color': ui.color } as CSSProperties}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className={i < blocks ? 'filled' : ''} />
          ))}
        </div>

        <div className="meter-label-line">
          <span>{METER_LABELS[resource]}</span>
          <span className="meter-right">
            {delta !== null && delta !== 0 && (
              <b className={delta > 0 ? 'delta-positive' : 'delta-negative'}>
                {formatCardEffect(delta)}
              </b>
            )}
            {value}/100
          </span>
        </div>
      </div>
    </div>
  );
}

function ResourceIcon({ resource }: { resource: ResourceKey }) {
  if (resource === 'lifeSupport') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path
          d="M12 3h8v9h9v8h-9v9H3v-8h9z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (resource === 'power') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path
          d="M17 2 5 18h10l-2 12 15-19H17l4-9z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (resource === 'shielding') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path
          d="M16 2 4 7v8c0 7 5 12 12 15 7-3 12-8 12-15V7L16 2zm0 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-5 13a6 6 0 0 1 10 0"
          fill="currentColor"
          fillRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path
        d="M5 2v9c0 3 2 5 4 5v14h5V16c2 0 4-2 4-5V2h-3v9h-2V2h-3v9H8V2H5zm19 0c-3 5-4 10-4 16h5v12h4V2z"
        fill="currentColor"
      />
    </svg>
  );
}

function HudMeterIcon({ resource }: { resource: ResourceKey }) {
  const common = {
    'aria-hidden': true,
    focusable: 'false' as const,
    className: 'meter-icon-svg',
  };

  if (resource === 'lifeSupport') {
    return (
      <svg viewBox="0 0 32 32" {...common}>
        <path
          d="M12 3h8v9h9v8h-9v9h-8v-9H3v-8h9z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (resource === 'power') {
    return (
      <svg viewBox="0 0 32 32" {...common}>
        <path
          d="M17 2 5 18h10l-2 12 15-19H17l4-9z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (resource === 'shielding') {
    return (
      <svg viewBox="0 0 32 32" {...common}>
        <path
          d="M16 2 5 6.7v8.5c0 6.7 4.5 11.9 11 14.8 6.5-2.9 11-8.1 11-14.8V6.7L16 2Z"
          fill="currentColor"
          opacity=".98"
        />
        <path
          d="M11.5 12.3c1.2-2.5 3.5-4 4.5-4 1 0 3.3 1.5 4.5 4"
          fill="none"
          stroke="#4d668e"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12.2 15.7h7.6"
          stroke="#4d668e"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <text
          x="16"
          y="22.4"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="700"
          fill="#4d668e"
          fontFamily="Arial, sans-serif"
        >
          UV
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" {...common}>
      <path
        d="M5 2v9c0 3 2 5 4 5v14h5V16c2 0 4-2 4-5V2h-3v9h-2V2h-3v9H8V2H5zm19 0c-3 5-4 10-4 16h5v12h4V2z"
        fill="currentColor"
      />
    </svg>
  );
}

function Effects({ delta }: { delta: MeterEffects }) {
  return (
    <div className="card-effect-row" aria-label="Immediate card effects">
      {RESOURCE_KEYS.map(key => (
        <span
          key={key}
          title={`${METER_LABELS[key]}: ${formatCardEffect(delta[key])}`}
          className={`card-effect ${
            delta[key] > 0 ? 'plus' : delta[key] < 0 ? 'minus' : 'flat'
          }`}
        >
          <ResourceIcon resource={key} />
          <b>{formatCardEffect(delta[key])}</b>
        </span>
      ))}
    </div>
  );
}

function ChoiceCard({
  card,
  index,
  onChoose,
  disabled,
}: {
  card: CardDefinition;
  index: number;
  onChoose: (id: string) => void;
  disabled: boolean;
}) {
  const resource = cardVisualResource(card);
  const source = card.fact.sourceName;

  return (
    <button
      type="button"
      className={`mission-card card-resource-${resource}`}
      style={{ '--card-index': index } as CSSProperties}
      disabled={disabled}
      onClick={() => onChoose(card.id)}
      aria-label={`Deploy ${localize(card.title)}. Meter ${METER_CATEGORY_LABEL[resource]}, category ${CATEGORY_LABEL[card.category]}. ${card.fact.dataset}. Source: ${source}`}
    >
      <span className="card-bg-particles" aria-hidden="true" />

      <div className="card-category-header">
        <strong>{CATEGORY_LABEL[card.category]}</strong>
        <small>0{index + 1}</small>
      </div>

      <div className="card-hero-icon" aria-hidden="true">
        <img
          src={`${BASE}assets/cards/icons/${resource}.png`}
          alt=""
          loading="eager"
        />
      </div>

      <div className="card-detail-panel">
        <div className="card-meter-classification">
          {METER_CATEGORY_LABEL[resource]}
          <span>•</span>
          {CATEGORY_LABEL[card.category]}
        </div>

        <h2 className="card-heading">{localize(card.title)}</h2>
        <p className="card-description">{localize(card.description)}</p>

        <div className="card-science" title={source}>
          <strong>NASA DATASET · {card.fact.dataset}</strong>
          <span>Source: {source}</span>
        </div>

        {card.delayed &&
          card.delayed.afterSols >= 1 &&
          RESOURCE_KEYS.some(key => card.delayed!.effects[key] !== 0) && (
            <div className="card-delayed">
              SOL +{card.delayed.afterSols} ·{' '}
              {RESOURCE_KEYS
                .filter(key => card.delayed!.effects[key] !== 0)
                .map(
                  key =>
                    `${METER_UI[key].abbrev} ${formatCardEffect(
                      card.delayed!.effects[key]
                    )}`
                )
                .join(' · ')}
            </div>
          )}

        <Effects delta={card.effects} />
      </div>

      <div className="card-deploy-action" aria-hidden="true">
        DEPLOY
      </div>
    </button>
  );
}

function NightPanel({
  crew,
  rations,
  setRation,
  endSol,
}: {
  crew: ReturnType<typeof useGameState>['state']['cosmonauts'];
  rations: ReturnType<typeof useGameState>['state']['rations'];
  setRation: (id: string, food: boolean, water: boolean) => void;
  endSol: () => void;
}) {
  return (
    <section className="night-panel" aria-label="Night ration distribution">
      <h2>☾ NIGHT · SOL REVIEW</h2>

      <p>
        Set crew rations before sleep. Water remaining: {rations.water};
        food remaining: {rations.food}. Supplies and system meters
        are evaluated overnight.
      </p>

      <div className="night-crew">
        {crew.map(c => (
          <div className="night-crew-row" key={c.id}>
            <strong>
              {c.name} <small>({c.condition})</small>
            </strong>

            <label>
              <input
                type="checkbox"
                checked={c.ration.food}
                onChange={e =>
                  setRation(c.id, e.target.checked, c.ration.water)
                }
              />
              Food
            </label>

            <label>
              <input
                type="checkbox"
                checked={c.ration.water}
                onChange={e =>
                  setRation(c.id, c.ration.food, e.target.checked)
                }
              />
              Water
            </label>
          </div>
        ))}
      </div>

      <button className="phase-action" type="button" onClick={endSol}>
        END SOL →
      </button>
    </section>
  );
}

function describeEnding(
  outcome: ReturnType<typeof useGameState>['state']['outcome']
): string {
  if (!outcome) return '';

  if (outcome.status === 'won') {
    return 'Eight-Sol mission complete.';
  }

  return outcome.reason === 'crew-unwell'
    ? 'Mission aborted: all crew members are unwell.'
    : `Mission aborted: ${outcome.meters
        .map(key => METER_LABELS[key])
        .join(', ')} reached the critical threshold (${METER_FAILURE_THRESHOLD}/100 or below).`;
}

export default function App() {
  const {
    state: game,
    start,
    restart,
    selectCard,
    executeCard,
    rejectCard,
    selectRepair,
    skipRepair,
    setRation,
    advanceCycle,
    endSol,
  } = useGameState();

  const [view, setView] = useState<ViewMode>('tutorial');

  const [cinematicStage, setCinematicStage] = useState<
    'intro' | 'play' | 'ending' | 'report'
  >('intro');

  const [tutorialStep, setTutorialStep] = useState(0);
  const [remaining, setRemaining] = useState(WAIT_SECONDS);
  const [guideOpen, setGuideOpen] = useState(true);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [lastCardId, setLastCardId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'played' | 'skipped'>('played');
  const [lastSkippedRepair, setLastSkippedRepair] = useState(false);

  const lastCard = lastCardId
    ? CARD_BY_ID.get(lastCardId) ?? null
    : null;

  const tutorial = view === 'tutorial';
  const ended = game.phase === 'ended';

  // Determine the visible screen immediately during render.
  // This prevents Mission Report from flashing before Mission Failure.
  const visibleCinematicStage =
    ended && cinematicStage === 'play'
      ? game.outcome?.status === 'lost' &&
        game.outcome.reason === 'crew-unwell'
        ? 'report'
        : 'ending'
      : cinematicStage;

  const endingMeter: MissionEnding =
    resolveMissionEnding({
      sol: game.sol,
      ended,
      meters: {
        lifeSupport: game.meters.lifeSupport.value,
        shielding: game.meters.shielding.value,
        power: game.meters.power.value,
        food: game.meters.food.value,
      },
    }) ?? 'lifeSupport';

  const focus =
    tutorial && tutorialStep === 1
      ? 'sol'
      : tutorial && tutorialStep === 2
        ? 'meters'
        : '';

  const repair =
    game.phaseState === 'repair' && game.activeDisaster !== null;

  const offers = repair
    ? game.activeDisaster!.repairChoices
    : game.hand;

  const lastEffects =
    view === 'result' && lastCard
      ? lastCard.effects
      : view === 'result' && lastAction === 'skipped'
        ? lastSkippedRepair
          ? BALANCE.skipRepairPenalty
          : BALANCE.skipPenalty
        : EMPTY_EFFECTS;

  const snapshot = useMemo<SceneSnapshot>(
    () =>
      sceneFromEngine(
        game,
        view === 'result' && lastCard
          ? cardVisualResource(lastCard)
          : null
      ),
    [game, view, lastCard]
  );

  // Looping backsound from public/assets/Backsound.mp3.
  // Browsers block autoplay until a user gesture, so the first
  // pointer/key press also unpauses the music.
  useEffect(() => {
    const audio = new Audio(BACKSOUND_SRC);
    audio.loop = true;
    audio.volume = 0.35;

    const start = () => {
      void audio.play().then(() => {
        window.removeEventListener('pointerdown', start);
        window.removeEventListener('keydown', start);
      }).catch(() => {
        // Autoplay still blocked; keep listening for the next gesture.
      });
    };

    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
    start();

    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (
      view !== 'waiting' ||
      ended ||
      game.phaseState === 'night'
    ) {
      return;
    }

    if (remaining <= 0) {
      setView('cards');
      return;
    }

    const timer = window.setTimeout(
      () => setRemaining(n => n - 1),
      1000
    );

    return () => window.clearTimeout(timer);
  }, [view, remaining, ended, game.phaseState]);

  // No useEffect is needed to select the cinematic.
  // The visibleCinematicStage above already selects it synchronously.

  useEffect(() => {
    if (view !== 'result' || ended) return;

    const timer = window.setTimeout(() => {
      if (game.phaseState === 'resolved') {
        advanceCycle();

        setView(
          game.cycle === 'evening' ? 'night' : 'waiting'
        );

        setRemaining(WAIT_SECONDS);
        setLastCardId(null);
      }
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [
    view,
    ended,
    game.phaseState,
    game.cycle,
    advanceCycle,
  ]);

  const currentArchiveEvent = DONKI_ARCHIVE.events.find(
    ev =>
      ev.scheduledSol === game.sol &&
      ev.scheduledCycle === game.cycle
  );

  const archivalDisaster =
    repair &&
    game.activeDisaster?.id === 'solarParticle' &&
    !!currentArchiveEvent;

  const guideText = tutorial
    ? INTRO[tutorialStep].text
    : ended
      ? describeEnding(game.outcome)
      : repair
        ? `${DISASTER_LABELS[game.activeDisaster!.id]}! Choose one FIX card. ${
            archivalDisaster
              ? `${DONKI_ARCHIVE_LABEL}. Event ${currentArchiveEvent?.id} was detected by ${currentArchiveEvent?.observatory}; the simulated Sol is not a NASA forecast.`
              : 'This is a simulated hazard.'
          }`
        : game.phaseState === 'night'
          ? 'Night has arrived. Set crew rations before reviewing the Sol. The engine calculates solar energy, irrigation, and resource decay.'
          : view === 'waiting'
            ? `Receiving transmission. Three cards will be ready in ${remaining} seconds. Skipping a choice also reduces system resources.`
            : view === 'cards'
              ? `Choose one ${PHASE_LABEL[game.cycle]} action for Sol ${game.sol}. Review the effects, NASA dataset, and delayed bonuses.`
              : lastCard
                ? `NASA FACT (${lastCard.fact.dataset}): ${localize(
                    lastCard.description
                  )}. Source: ${lastCard.fact.sourceName}.`
                : 'Action skipped. All four outpost meters have been reduced.';

  const dialogue = tutorial
    ? {
        name: 'Toria',
        text: 'Let’s go through the outpost systems first.',
      }
    : PHASE_DIALOGUE[game.cycle];

  const newMissionSeed = () =>
    Math.floor(Math.random() * 0x1_0000_0000) >>> 0;

  const nextTutorial = () => {
    if (tutorialStep < INTRO.length - 1) {
      setTutorialStep(step => step + 1);
      return;
    }

    start(newMissionSeed());
    setView('waiting');
    setRemaining(WAIT_SECONDS);
    setGuideOpen(true);
  };

  const choose = (id: string) => {
    if (
      view !== 'cards' ||
      ended ||
      !offers.some(card => card.id === id)
    ) {
      return;
    }

    setLastCardId(id);
    setLastAction('played');
    setLastSkippedRepair(false);

    if (repair) {
      selectRepair(id);
    } else {
      selectCard(id);
      executeCard();
    }

    setGuideOpen(true);
    setView('result');
  };

  const skip = () => {
    if (view !== 'cards' || ended) return;

    if (repair) {
      skipRepair();
    } else {
      rejectCard();
    }

    setLastCardId(null);
    setLastAction('skipped');
    setLastSkippedRepair(repair);
    setGuideOpen(true);
    setView('result');
  };

  const finishNight = () => {
    endSol();
    setRemaining(WAIT_SECONDS);
    setLastCardId(null);
    setView('waiting');
  };

  const reset = () => {
    restart(newMissionSeed());
    setView('tutorial');
    setTutorialStep(0);
    setRemaining(WAIT_SECONDS);
    setGuideOpen(true);
    setLastCardId(null);
    setCinematicStage('intro');
  };

  // Render the opening cinematic.
  if (visibleCinematicStage === 'intro') {
    return (
      <MissionCinematic
        mode="intro"
        onFinish={() => setCinematicStage('play')}
      />
    );
  }

  // Render the ending cinematic immediately when the engine ends.
  if (visibleCinematicStage === 'ending') {
    return (
      <MissionCinematic
        mode="ending"
        result={endingMeter}
        threshold={METER_FAILURE_THRESHOLD}
        finishLabel="VIEW REPORT"
        onFinish={() => setCinematicStage('report')}
      />
    );
  }

  return (
    <main className="outpost-desktop">
      <section
        className={`outpost-stage ${
          tutorial ? 'is-tutorial' : ''
        } ${
          view === 'cards' ? 'is-card-view' : ''
        } ${
          focus ? 'focus-' + focus : ''
        }`}
        aria-label="CRATER Mars Outpost — NASA cards game"
      >
        <SceneBridge
          snapshot={snapshot}
          className="outpost-phaser"
          onSceneError={setSceneError}
        />

        <header className="hud-top">
          <div
            className="sol-hud"
            aria-label={`Sol ${Math.max(1, game.sol)} of 8, ${PHASE_LABEL[game.cycle]}`}
          >
            <strong className="sol-phase">
              {PHASE_LABEL[game.cycle]}
            </strong>

            <div className="sol-icon">
              {game.cycle === 'night' ? (
                <span aria-label="Night">☾</span>
              ) : (
                <img
                  src={`${BASE}assets/cycle-${game.cycle}.png`}
                  alt=""
                />
              )}
            </div>

            <div className="sol-counter">
              <strong>{Math.max(1, game.sol)}</strong> /{' '}
              {BALANCE.maxSols} Sol
            </div>
          </div>

          <div
            className="meters-hud"
            aria-label="Four outpost systems"
          >
            {RESOURCE_KEYS.map(key => (
              <MeterBar
                key={key}
                resource={key}
                value={game.meters[key].value}
                delta={
                  view === 'result'
                    ? lastEffects[key]
                    : null
                }
              />
            ))}
          </div>
        </header>

        {tutorial && focus && (
          <div
            key={`tutorial-callout-${tutorialStep}`}
            className={`tutorial-callout callout-${focus}`}
            role="status"
          >
            <span
              className="tutorial-arrow"
              aria-hidden="true"
            >
              ➤
            </span>

            {focus === 'sol'
              ? 'SOL: Day 1 of 8 on Mars. Cycle: Morning → Afternoon → Evening → Night.'
              : `Life Support (blue), Shielding (purple), Power (yellow), and Food (green) must all stay above ${METER_FAILURE_THRESHOLD}/100. Any meter at or below this threshold ends the mission.`}
          </div>
        )}

        <div className="crew-dialogue">
          <strong>{dialogue.name}:</strong>
          <em>“{dialogue.text}”</em>
        </div>

        {!tutorial &&
          !ended &&
          view === 'waiting' &&
          game.phaseState !== 'night' && (
            <div
              className="transmission-wait"
              role="status"
              aria-live="polite"
            >
              <span
                className="transmission-pulse"
                aria-hidden="true"
              >
                ◉
              </span>

              <strong>INCOMING TRANSMISSION</strong>

              <span>
                3 cards arrive in <b>{remaining}</b> seconds
              </span>
            </div>
          )}

        {!tutorial &&
          !ended &&
          view === 'result' && (
            <div className="result-bubble" role="status">
              <b>
                {lastCard
                  ? localize(lastCard.title)
                  : 'ACTION SKIPPED'}
              </b>

              <span>
                {lastCard
                  ? `Immediate effects applied · ${
                      lastCard.delayed
                        ? `delayed effect at Sol +${lastCard.delayed.afterSols}`
                        : 'NASA fact recorded'
                    }`
                  : 'Skip penalty applied'}
              </span>
            </div>
          )}

        {!tutorial &&
          !ended &&
          view === 'cards' &&
          game.phaseState !== 'night' && (
            <section
              className="cards-area"
              aria-label="Choose one of three NASA cards"
            >
              <div className="cards-topline">
                <span>
                  {repair
                    ? `⚠ ${
                        DISASTER_LABELS[game.activeDisaster!.id]
                      } · FIX`
                    : CYCLE_LABELS[game.cycle]}
                </span>

                <span>
                  {PHASE_LABEL[game.cycle].toUpperCase()} /{' '}
                  {String(game.sol).padStart(2, '0')}
                </span>
              </div>

              {archivalDisaster && (
                <div className="archive-tag">
                  {DONKI_ARCHIVE_LABEL} · MAPPED TO SIMULATED SOL
                </div>
              )}

              <div className="mobile-swipe-hint">
                Swipe to browse all three cards
              </div>

              <div
                key={`card-offers-${game.sol}-${game.cycle}-${game.phaseState}`}
                className="cards-grid"
              >
                {offers.map((card, index) => (
                  <ChoiceCard
                    key={card.id}
                    card={card}
                    index={index}
                    onChoose={choose}
                    disabled={false}
                  />
                ))}
              </div>

              <button
                className="skip-card"
                type="button"
                onClick={skip}
              >
                SKIP ACTION · RESOURCE PENALTY
              </button>
            </section>
          )}

        {!tutorial &&
          !ended &&
          game.phaseState === 'night' && (
            <NightPanel
              crew={game.cosmonauts}
              rations={game.rations}
              setRation={setRation}
              endSol={finishNight}
            />
          )}

        <aside
          className="noe-area"
          aria-label="Noe Mission Control"
        >
          <button
            className="noe-portrait"
            type="button"
            onClick={() =>
              !tutorial &&
              setGuideOpen(open => !open)
            }
            aria-label="Open Noe’s message"
          >
            <img
              src={`${BASE}assets/guide-noe-portrait.png`}
              alt="Noe, Mission Control"
            />

            <span>NOE</span>
          </button>

          {(guideOpen || tutorial) && (
            <div className="noe-chat" role="status">
              <div className="noe-chat-head">
                <strong>MISSION CONTROL · NOE</strong>

                {!tutorial && (
                  <button
                    type="button"
                    onClick={() => setGuideOpen(false)}
                    aria-label="Close Noe’s message"
                  >
                    ×
                  </button>
                )}
              </div>

              <p
                key={
                  tutorial
                    ? `tutorial-${tutorialStep}`
                    : `${view}-${game.sol}-${game.cycle}`
                }
              >
                {guideText}
              </p>

              {lastCard && view === 'result' && (
                <div className="source-link">
                  <span>DATA: {lastCard.fact.dataset}</span>

                  <a
                    href={lastCard.fact.sourceUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open NASA source ↗
                  </a>
                </div>
              )}

              {tutorial && (
                <div className="noe-actions">
                  <span>
                    {tutorialStep + 1} / {INTRO.length}
                  </span>

                  <button
                    type="button"
                    onClick={nextTutorial}
                  >
                    {tutorialStep === INTRO.length - 1
                      ? 'START MISSION'
                      : 'CONTINUE'}{' '}
                    →
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* FIX: The report is only visible AFTER
            the closing Noe cinematic has finished. */}
        {ended && visibleCinematicStage === 'report' && (
          <div
            className="ending-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Mission outcome"
          >
            <div className="ending-card">
              <span>
                {game.outcome?.status === 'lost'
                  ? 'MISSION FAILURE'
                  : 'MISSION SUCCESS'}{' '}
                · SOL {game.sol}
              </span>

              <h1>{describeEnding(game.outcome)}</h1>

              <p>
                {game.playedCards.length} NASA cards played
                during the mission.
              </p>

              <div className="end-stats">
                {RESOURCE_KEYS.map(key => (
                  <div key={key}>
                    <span>{METER_LABELS[key]}</span>
                    <b>{game.meters[key].value}/100</b>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={reset}
              >
                PLAY AGAIN
              </button>

              <small>
                CRATER · Engine JSON v4 · NASA historical
                archive data, not live
              </small>
            </div>
          </div>
        )}

        {sceneError && (
          <div className="outpost-error" role="alert">
            Unable to load Phaser: {sceneError}
          </div>
        )}
      </section>

      <p className="below-note">
        CRATER · ORIGINAL CHARACTER ART · JSON ENGINE V4 ·
        NASA ARCHIVAL DATA / NOT LIVE · 3 CARDS / 3 SECONDS
      </p>
    </main>
  );

}