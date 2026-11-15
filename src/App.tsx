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
import './styles/outpost.css';

const BASE = import.meta.env.BASE_URL;
const WAIT_SECONDS = 15;
const METER_UI: Record<ResourceKey, { color: string; symbol: string; abbrev: string }> = {
  lifeSupport: { color: '#79ddbb', symbol: '◉', abbrev: 'LS' },
  shielding: { color: '#f0c97e', symbol: '◈', abbrev: 'SH' },
  power: { color: '#9fbffa', symbol: 'ϟ', abbrev: 'PW' },
  food: { color: '#d7a0d6', symbol: '✤', abbrev: 'FD' },
};
const PHASE_LABEL: Record<Cycle, string> = {
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night',
};
const PHASE_DIALOGUE: Record<Cycle, { name: string; text: string }> = {
  morning: { name: 'Toria', text: 'Selamat pagi, Komandan. Kita mulai pemeriksaan rutin.' },
  afternoon: { name: 'Sylvan', text: 'Mari lakukan riset untuk membantu pos kita.' },
  evening: { name: 'Corin', text: 'Kita perkuat habitat sebelum malam tiba.' },
  night: { name: 'Cirra', text: 'Saatnya membagikan air dan makanan sebelum Sol berikutnya.' },
};
const INTRO = [
  { title: 'SELAMAT DATANG', text: 'Selamat datang, Komandan! Aku Noe dari Mission Control di Bumi. Kita akan menjalankan misi selama delapan Sol.' },
  { title: 'PENJELASAN SOL', text: 'SOL menandakan hari Mars. Misi berlangsung 8 Sol: Morning (Daily Routine), Afternoon (Research / Exploration), Evening (Building / Upgrade), kemudian Night untuk ransum dan evaluasi.' },
  { title: 'EMPAT PILAR OUTPOST', text: 'Life Support, Shielding, Power, dan Food System harus dijaga. Efek instan kartu berasal langsung dari JSON NASA; beberapa upgrade memberikan bonus pada Sol berikutnya.' },
  { title: 'KARTU & SUMBER NASA', text: 'Pilih satu dari tiga kartu setelah transmisi 15 detik. Setiap kartu memuat fakta, dataset, dan rujukan NASA. Skip juga menurunkan meter. Bencana memunculkan kartu FIX.' },
];
type ViewMode = 'tutorial' | 'waiting' | 'cards' | 'result' | 'night';
const EMPTY_EFFECTS: MeterEffects = { lifeSupport: 0, shielding: 0, power: 0, food: 0 };

function MeterBar({ resource, value, delta }: { resource: ResourceKey; value: number; delta: number | null }) {
  const blocks = Math.round(value / 100 * 12);
  const ui = METER_UI[resource];
  return <div className="meter" aria-label={`${METER_LABELS[resource]}: ${value} dari 100`}>
    <span className="meter-symbol" aria-hidden="true">{ui.symbol}</span>
    <div className="meter-main">
      <div className="meter-segments" aria-hidden="true" style={{ '--meter-color': ui.color } as CSSProperties}>
        {Array.from({ length: 12 }, (_, i) => <span key={i} className={i < blocks ? 'filled' : ''} />)}
      </div>
      <div className="meter-label-line"><span>{METER_LABELS[resource]}</span><span className="meter-right">
        {delta !== null && delta !== 0 && <b className={delta > 0 ? 'delta-positive' : 'delta-negative'}>{formatCardEffect(delta)}</b>}
        {value}/100
      </span></div>
    </div>
  </div>;
}
/** Four symbols matching the user's blue/purple/yellow/green Figma artwork. */
function ResourceIcon({ resource }: { resource: ResourceKey }) {
  if (resource === 'lifeSupport') return <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M12 3h8v9h9v8h-9v9h-8v-9H3v-8h9z" fill="currentColor" /></svg>;
  if (resource === 'power') return <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M17 2 5 18h10l-2 12 15-19H17l4-9z" fill="currentColor" /></svg>;
  if (resource === 'shielding') return <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16 2 4 7v8c0 7 5 12 12 15 7-3 12-8 12-15V7L16 2zm0 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-5 13a6 6 0 0 1 10 0" fill="currentColor" fillRule="evenodd" /></svg>;
  return <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M5 2v9c0 3 2 5 4 5v14h5V16c2 0 4-2 4-5V2h-3v9h-2V2h-3v9H8V2H5zm19 0c-3 5-4 10-4 16h5v12h4V2z" fill="currentColor" /></svg>;
}
function Effects({ delta }: { delta: MeterEffects }) {
  return <div className="card-effect-row" aria-label="Efek langsung kartu">
    {RESOURCE_KEYS.map(key => <span key={key} title={`${METER_LABELS[key]}: ${formatCardEffect(delta[key])}`}
      className={`card-effect ${delta[key] > 0 ? 'plus' : delta[key] < 0 ? 'minus' : 'flat'}`}>
      <ResourceIcon resource={key} />
      <b>{formatCardEffect(delta[key])}</b>
    </span>)}
  </div>;
}
function ChoiceCard({ card, index, onChoose, disabled }: { card: CardDefinition; index: number; onChoose: (id: string) => void; disabled: boolean }) {
  const resource = cardVisualResource(card);
  const source = card.fact.sourceName;
  return <button type="button" className={`mission-card card-resource-${resource}`} disabled={disabled} onClick={() => onChoose(card.id)}
    aria-label={`Deploy ${localize(card.title)}. Meter ${METER_CATEGORY_LABEL[resource]}, kategori ${CATEGORY_LABEL[card.category]}. ${card.fact.dataset}. Sumber ${source}`}>
    <span className="card-bg-particles" aria-hidden="true" />
    <div className="card-category-header"><strong>{CATEGORY_LABEL[card.category]}</strong><small>0{index + 1}</small></div>
    <div className="card-hero-icon" aria-hidden="true">
      <img src={`${BASE}assets/cards/icons/${resource}.png`} alt="" loading="eager" />
    </div>
    <div className="card-detail-panel">
      <div className="card-meter-classification">{METER_CATEGORY_LABEL[resource]} <span>•</span> {CATEGORY_LABEL[card.category]}</div>
      <h2 className="card-heading">{localize(card.title)}</h2>
      <p className="card-description">{localize(card.description)}</p>
      <div className="card-science" title={source}>
        <strong>NASA DATASET · {card.fact.dataset}</strong>
        <span>Sumber: {source}</span>
      </div>
      {card.delayed && card.delayed.afterSols >= 1 && RESOURCE_KEYS.some(key => card.delayed!.effects[key] !== 0) && <div className="card-delayed">SOL +{card.delayed.afterSols} · {RESOURCE_KEYS.filter(key => card.delayed!.effects[key] !== 0).map(key => `${METER_UI[key].abbrev} ${formatCardEffect(card.delayed!.effects[key])}`).join(' · ')}</div>}
      <Effects delta={card.effects} />
    </div>
    <div className="card-deploy-action" aria-hidden="true">DEPLOY</div>
  </button>;
}
function NightPanel({ crew, rations, setRation, endSol }: {
  crew: ReturnType<typeof useGameState>['state']['cosmonauts'];
  rations: ReturnType<typeof useGameState>['state']['rations'];
  setRation: (id: string, food: boolean, water: boolean) => void;
  endSol: () => void;
}) {
  return <section className="night-panel" aria-label="Pembagian ransum malam">
    <h2>☾ NIGHT · EVALUASI SOL</h2>
    <p>Atur ransum kru sebelum tidur. Air tersisa {rations.water}, makanan {rations.food}. Persediaan dan meter mengalami evaluasi malam.</p>
    <div className="night-crew">
      {crew.map(c => <div className="night-crew-row" key={c.id}>
        <strong>{c.name} <small>({c.condition})</small></strong>
        <label><input type="checkbox" checked={c.ration.food} onChange={e => setRation(c.id, e.target.checked, c.ration.water)} /> Makanan</label>
        <label><input type="checkbox" checked={c.ration.water} onChange={e => setRation(c.id, c.ration.food, e.target.checked)} /> Air</label>
      </div>)}
    </div>
    <button className="phase-action" type="button" onClick={endSol}>AKHIRI SOL →</button>
  </section>;
}

function describeEnding(outcome: ReturnType<typeof useGameState>['state']['outcome']): string {
  if (!outcome) return '';
  if (outcome.status === 'won') return `Misi delapan Sol selesai · ${outcome.endingId.toUpperCase()} ENDING`;
  return outcome.reason === 'crew-unwell' ? 'Misi dihentikan: seluruh kru tidak sehat.' : `Misi dihentikan: meter ${outcome.meters.map(key => METER_LABELS[key]).join(', ')} habis.`;
}

export default function App() {
  const {
    state: game, start, restart, selectCard, executeCard, rejectCard,
    selectRepair, skipRepair, setRation, advanceCycle, endSol,
  } = useGameState();
  const [view, setView] = useState<ViewMode>('tutorial');
  const [tutorialStep, setTutorialStep] = useState(0);
  const [remaining, setRemaining] = useState(WAIT_SECONDS);
  const [guideOpen, setGuideOpen] = useState(true);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [lastCardId, setLastCardId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'played' | 'skipped'>('played');
  const [lastSkippedRepair, setLastSkippedRepair] = useState(false);
  const lastCard = lastCardId ? CARD_BY_ID.get(lastCardId) ?? null : null;
  const tutorial = view === 'tutorial';
  const ended = game.phase === 'ended';
  const focus = tutorial && tutorialStep === 1 ? 'sol' : tutorial && tutorialStep === 2 ? 'meters' : '';
  const repair = game.phaseState === 'repair' && game.activeDisaster !== null;
  const offers = repair ? game.activeDisaster!.repairChoices : game.hand;
  const lastEffects = view === 'result' && lastCard ? lastCard.effects :
    view === 'result' && lastAction === 'skipped' ? (lastSkippedRepair ? BALANCE.skipRepairPenalty : BALANCE.skipPenalty) : EMPTY_EFFECTS;
  const snapshot = useMemo<SceneSnapshot>(
    () => sceneFromEngine(game, view === 'result' && lastCard ? lastCard.category : null),
    [game, view, lastCard],
  );

  useEffect(() => {
    if (view !== 'waiting' || ended || game.phaseState === 'night') return;
    if (remaining <= 0) { setView('cards'); return; }
    const timer = window.setTimeout(() => setRemaining(n => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [view, remaining, ended, game.phaseState]);

  // Outcome and phase transition are owned by the engine; UI only controls waiting/animation.
  useEffect(() => {
    if (view !== 'result' || ended) return;
    const timer = window.setTimeout(() => {
      if (game.phaseState === 'resolved') {
        advanceCycle();
        setView(game.cycle === 'evening' ? 'night' : 'waiting');
        setRemaining(WAIT_SECONDS);
        setLastCardId(null);
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [view, ended, game.phaseState, game.cycle, advanceCycle]);

  const currentArchiveEvent = DONKI_ARCHIVE.events.find(ev => ev.scheduledSol === game.sol && ev.scheduledCycle === game.cycle);
  const archivalDisaster = repair && game.activeDisaster?.id === 'solarParticle' && !!currentArchiveEvent;
  const guideText = tutorial ? INTRO[tutorialStep].text : ended ? describeEnding(game.outcome) :
    repair ? `${DISASTER_LABELS[game.activeDisaster!.id]}! Pilih satu kartu FIX. ${archivalDisaster ? `${DONKI_ARCHIVE_LABEL}. Peristiwa ${currentArchiveEvent?.id} terdeteksi oleh ${currentArchiveEvent?.observatory}; Sol simulasi bukan prediksi NASA.` : 'Ini adalah simulasi kejadian berisiko.'}` :
    game.phaseState === 'night' ? 'Waktu malam. Tentukan ransum tiap kru lalu evaluasi Sol. Energi surya, irigasi, dan penyusutan sumber daya dihitung oleh engine.' :
    view === 'waiting' ? `Menunggu transmisi. Tiga kartu siap dalam ${remaining} detik. Tidak ada pilihan gratis: melewati kartu juga menurunkan meter.` :
    view === 'cards' ? `Pilih satu tindakan ${PHASE_LABEL[game.cycle]} untuk Sol ${game.sol}. Periksa efek, dataset NASA, dan bonus tertunda.` :
    lastCard ? `NASA FACT (${lastCard.fact.dataset}): ${localize(lastCard.description)}. Sumber: ${lastCard.fact.sourceName}.` :
    'Keputusan dilewati. Biaya penundaan telah mengurangi sistem outpost.';
  const dialogue = tutorial ? { name: 'Toria', text: 'Kita mulai dengan perkenalan sistem, ya?' } : PHASE_DIALOGUE[game.cycle];

  const newMissionSeed = () => (Math.floor(Math.random() * 0x1_0000_0000) >>> 0);
  const nextTutorial = () => {
    if (tutorialStep < INTRO.length - 1) { setTutorialStep(step => step + 1); return; }
    start(newMissionSeed());
    setView('waiting'); setRemaining(WAIT_SECONDS); setGuideOpen(true);
  };
  const choose = (id: string) => {
    if (view !== 'cards' || ended || !offers.some(card => card.id === id)) return;
    setLastCardId(id); setLastAction('played'); setLastSkippedRepair(false);
    if (repair) selectRepair(id);
    else { selectCard(id); executeCard(); }
    setGuideOpen(true); setView('result');
  };
  const skip = () => {
    if (view !== 'cards' || ended) return;
    if (repair) skipRepair(); else rejectCard();
    setLastCardId(null); setLastAction('skipped'); setLastSkippedRepair(repair);
    setGuideOpen(true); setView('result');
  };
  const finishNight = () => { endSol(); setRemaining(WAIT_SECONDS); setLastCardId(null); setView('waiting'); };
  const reset = () => {
    restart(newMissionSeed()); setView('tutorial'); setTutorialStep(0); setRemaining(WAIT_SECONDS);
    setGuideOpen(true); setLastCardId(null);
  };

  return <main className="outpost-desktop"><section className={`outpost-stage ${tutorial ? 'is-tutorial' : ''} ${view === 'cards' ? 'is-card-view' : ''} ${focus ? 'focus-' + focus : ''}`} aria-label="CRATER Mars Outpost — NASA cards game">
    <SceneBridge snapshot={snapshot} className="outpost-phaser" onSceneError={setSceneError} />
    <header className="hud-top">
      <div className="sol-hud" aria-label={`Sol ${Math.max(1, game.sol)} dari 8, ${PHASE_LABEL[game.cycle]}`}>
        <strong className="sol-phase">{PHASE_LABEL[game.cycle]}</strong>
        <div className="sol-icon">{game.cycle === 'night' ? <span aria-label="Malam">☾</span> : <img src={`${BASE}assets/cycle-${game.cycle}.png`} alt="" />}</div>
        <div className="sol-counter"><strong>{Math.max(1, game.sol)}</strong> / {BALANCE.maxSols} Sol</div>
      </div>
      <div className="meters-hud" aria-label="Empat pilar outpost">
        {RESOURCE_KEYS.map(key => <MeterBar key={key} resource={key} value={game.meters[key].value} delta={view === 'result' ? lastEffects[key] : null} />)}
      </div>
    </header>
    {tutorial && focus && <div className={`tutorial-callout callout-${focus}`} role="status">
      <span className="tutorial-arrow" aria-hidden="true">➤</span>
      {focus === 'sol' ? 'SOL: 1 dari 8 hari Mars. Siklus Morning → Afternoon → Evening → Night.' : 'Life Support, Shielding, Power, dan Food System mengikuti state engine. Kartu JSON mengubah meter secara langsung maupun tertunda.'}
    </div>}
    <div className="crew-dialogue"><strong>{dialogue.name}:</strong><em>“{dialogue.text}”</em></div>
    {!tutorial && !ended && view === 'waiting' && game.phaseState !== 'night' && <div className="transmission-wait" role="status" aria-live="polite">
      <span className="transmission-pulse" aria-hidden="true">◉</span><strong>MENUNGGU TRANSMISI</strong>
      <span>3 kartu tiba dalam <b>{remaining}</b> detik</span>
    </div>}
    {!tutorial && !ended && view === 'result' && <div className="result-bubble" role="status">
      <b>{lastCard ? localize(lastCard.title) : 'KEPUTUSAN DITUNDA'}</b>
      <span>{lastCard ? `Efek instan diterapkan · ${lastCard.delayed ? `efek tertunda Sol +${lastCard.delayed.afterSols}` : 'fakta NASA tercatat'}` : 'Penalti skip diterapkan'}</span>
    </div>}
    {!tutorial && !ended && view === 'cards' && game.phaseState !== 'night' && <section className="cards-area" aria-label="Pilih satu dari tiga kartu NASA">
      <div className="cards-topline"><span>{repair ? `⚠ ${DISASTER_LABELS[game.activeDisaster!.id]} · FIX` : CYCLE_LABELS[game.cycle]}</span><span>{PHASE_LABEL[game.cycle].toUpperCase()} / {String(game.sol).padStart(2, '0')}</span></div>
      {archivalDisaster && <div className="archive-tag">{DONKI_ARCHIVE_LABEL} · DIPETAKAN KE SOL SIMULASI</div>}
      <div className="cards-grid">{offers.map((card, index) => <ChoiceCard key={card.id} card={card} index={index} onChoose={choose} disabled={false} />)}</div>
      <button className="skip-card" type="button" onClick={skip}>LEWATI PILIHAN · PENALTI METER</button>
    </section>}
    {!tutorial && !ended && game.phaseState === 'night' && <NightPanel crew={game.cosmonauts} rations={game.rations} setRation={setRation} endSol={finishNight} />}
    <aside className="noe-area" aria-label="Noe Mission Control">
      <button className="noe-portrait" type="button" onClick={() => !tutorial && setGuideOpen(open => !open)} aria-label="Buka pesan Noe">
        <img src={`${BASE}assets/guide-noe-portrait.png`} alt="Noe asli dari aset game" /><span>NOE</span>
      </button>
      {(guideOpen || tutorial) && <div className="noe-chat" role="status">
        <div className="noe-chat-head"><strong>MISSION CONTROL · NOE</strong>{!tutorial && <button type="button" onClick={() => setGuideOpen(false)} aria-label="Tutup pesan Noe">×</button>}</div>
        <p>{guideText}</p>
        {lastCard && view === 'result' && <div className="source-link"><span>DATA: {lastCard.fact.dataset}</span><a href={lastCard.fact.sourceUrl ?? '#'} target="_blank" rel="noopener noreferrer">Buka sumber NASA ↗</a></div>}
        {tutorial && <div className="noe-actions"><span>{tutorialStep + 1} / {INTRO.length}</span><button type="button" onClick={nextTutorial}>{tutorialStep === INTRO.length - 1 ? 'MULAI MISI' : 'LANJUT'} →</button></div>}
      </div>}
    </aside>
    {ended && <div className="ending-backdrop" role="dialog" aria-modal="true" aria-label="Hasil misi">
      <div className="ending-card"><span>MISSION REPORT · SOL {game.sol}</span><h1>{describeEnding(game.outcome)}</h1><p>{game.playedCards.length} kartu NASA dimainkan selama misi.</p>
        <div className="end-stats">{RESOURCE_KEYS.map(key => <div key={key}><span>{METER_LABELS[key]}</span><b>{game.meters[key].value}/100</b></div>)}</div>
        <button type="button" onClick={reset}>MAIN LAGI</button><small>CRATER · Engine JSON v4 · data NASA berlabel arsip, bukan live</small>
      </div>
    </div>}
    {sceneError && <div className="outpost-error" role="alert">Gagal memuat Phaser: {sceneError}</div>}
  </section><p className="below-note">CRATER · ASET KARAKTER ASLI · ENGINE JSON V4 · ARSIP NASA / BUKAN LIVE · 3 KARTU / 15 DETIK</p></main>;
}
