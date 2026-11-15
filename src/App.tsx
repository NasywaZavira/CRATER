import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { SceneBridge } from './bridge/SceneBridge';
import { sceneSnapshotFixture } from './bridge/fixtures';
import type { SceneSnapshot } from './bridge/scene-snapshot';
import { METERS, type ActionCard, type MeterKey, type Phase } from './demo/cards';
import { newGame, nextCycle, PHASE_LABEL, pickCard, selectedCard, statusLabel, type DemoState } from './demo/game';
import './styles/outpost.css';

const BASE = import.meta.env.BASE_URL;
const WAIT_SECONDS = 15;
const CREW_NAMES: Record<string, string> = { toria: 'Toria', sylvan: 'Sylvan', corin: 'Corin', cirra: 'Cirra' };
const PHASE_DIALOGUE: Record<Phase, { name:string; text:string }> = {
  morning: { name:'Toria', text:'Selamat pagi, Komandan. Kita mulai pemeriksaan rutin.' },
  afternoon: { name:'Sylvan', text:'Ada hal menarik yang perlu kita teliti hari ini.' },
  evening: { name:'Corin', text:'Saatnya menjaga dan memperkuat sistem habitat.' },
};
const INTRO = [
  { title:'SELAMAT DATANG', text:'Selamat datang, Komandan! Aku Noe dari Mission Control di Bumi. Aku akan memandu kamu mengenali outpost Mars ini.' },
  { title:'PENJELASAN SOL', text:'Lihat kotak SOL di kiri atas. 1/8 berarti hari pertama dari delapan hari di Mars. Setiap Sol melalui Morning, Afternoon, lalu Evening.' },
  { title:'EMPAT PILAR OUTPOST', text:'Keempat bar di kanan atas adalah Life Support, Shielding, Power, dan Food System. Kartu yang kamu pilih bisa menaikkan, mengurangi, atau mempertahankan nilainya.' },
  { title:'TRANSMISI TIGA KARTU', text:'Sebentar lagi kamu menerima tiga pilihan kartu. Setelah jeda 15 detik, pilih SATU kartu. Pilihanmu akan berdampak pada sistem dan kru. Kita mulai!' },
];
type ViewMode = 'tutorial' | 'waiting' | 'cards' | 'result';

function MeterBar({ label, value, color, symbol, delta }: {label:string;value:number;color:string;symbol:string;delta:number|null}) {
  const blocks = Math.round(value / 100 * 12);
  return <div className="meter" aria-label={`${label}: ${value} dari 100`}>
    <span className="meter-symbol" aria-hidden="true">{symbol}</span>
    <div className="meter-main"><div className="meter-segments" aria-hidden="true" style={{ '--meter-color':color } as CSSProperties}>
      {Array.from({length:12}, (_,i)=><span key={i} className={i < blocks ? 'filled' : ''}/>)}
    </div><div className="meter-label-line"><span>{label}</span><span className="meter-right">{delta !== null && delta !== 0 && <b className={delta > 0 ? 'delta-positive' : 'delta-negative'}>{delta > 0 ? '+' : ''}{delta}</b>} {value}/100</span></div></div>
  </div>;
}
function Effects({delta}: {delta:Partial<Record<MeterKey,number>>}) {
  return <div className="effect-grid">{METERS.map(({key,label})=>{
    const amount = delta[key] ?? 0;
    return <span key={key} title={label} className={`effect ${amount > 0 ? 'plus' : amount < 0 ? 'minus' : 'flat'}`}>
      {({life:'LS',shielding:'SH',power:'PW',food:'FD'} as const)[key]} <b>{amount === 0 ? '—' : `${amount > 0 ? '+' : ''}${amount}`}</b>
    </span>;
  })}</div>;
}
const cardArt: Record<ActionCard['deck'], { icon:string; label:string; style:string }> = {
  'Daily Routine': {icon:'☀', label:'HABITAT ROUTINE', style:'routine'},
  'Research': {icon:'⌕', label:'RESEARCH LAB', style:'research'},
  'Exploration': {icon:'⌁', label:'MARS EXPLORATION', style:'exploration'},
  'Building': {icon:'▤', label:'CONSTRUCTION', style:'building'},
  'Upgrade': {icon:'⚙', label:'SYSTEM UPGRADE', style:'upgrade'},
};
function cardThumbnail(card:ActionCard):string {
  const best = Object.entries(card.delta).filter(([,value])=>typeof value==='number' && value>0).sort((a,b)=>(b[1]??0)-(a[1]??0))[0]?.[0];
  return best==='food'?'card-hydro.jpg':best==='shielding'?'card-shield.jpg':'card-antenna.jpg';
}
function ChoiceCard({card, index, onChoose, chosen, disabled}: {card:ActionCard;index:number;onChoose:(id:string)=>void;chosen:boolean;disabled:boolean}) {
  const art = cardArt[card.deck];
  return <button type="button" className={`mission-card ${chosen?'chosen':''} ${disabled && !chosen?'not-chosen':''}`}
    disabled={disabled} onClick={()=>onChoose(card.id)} aria-label={`Pilih kartu ${card.title}`}>
    <div className={`card-art card-art-${art.style}`}><img className="card-art-image" src={`${BASE}assets/${cardThumbnail(card)}`} alt="Ilustrasi tugas outpost"/><span className="card-art-caption">{art.label}</span></div>
    <div className="card-info">
      <div className="card-issue"><span>{card.deck.toUpperCase()}</span><span>{card.id}</span></div>
      <h2 className="card-heading">{card.title}</h2>
      <p className="card-description">{card.detail}</p>
      <Effects delta={card.delta}/>
      <div className="card-footer"><span>✧ {CREW_NAMES[card.crew]}</span><b>{chosen?'✓ DIPILIH':`0${index+1} / PILIH`}</b></div>
    </div>
  </button>;
}

export default function App() {
  const [game,setGame] = useState<DemoState>(()=>newGame());
  const [view,setView] = useState<ViewMode>('tutorial');
  const [tutorialStep,setTutorialStep] = useState(0);
  const [remaining,setRemaining] = useState(WAIT_SECONDS);
  const [guideOpen,setGuideOpen] = useState(true);
  const [sceneError,setSceneError] = useState<string|null>(null);
  const current = selectedCard(game);
  const tutorial = view === 'tutorial';
  const focus = tutorial && tutorialStep === 1 ? 'sol' : tutorial && tutorialStep === 2 ? 'meters' : '';
  const snapshot = useMemo<SceneSnapshot>(()=>({
    ...sceneSnapshotFixture,
    sol: game.sol, cycle:game.phase,
    crew:sceneSnapshotFixture.crew.map(crew=>({...crew, available:crew.id !== game.working})),
    hazard:'none',
  }), [game.sol,game.phase,game.working]);

  // 15 detik layar tanpa kartu untuk setiap cycle, termasuk cycle pertama setelah tutorial.
  useEffect(()=>{
    if (view !== 'waiting' || game.ended) return;
    if (remaining <= 0) { setView('cards'); return; }
    const timer = window.setTimeout(()=>setRemaining(n=>n-1),1000);
    return ()=>window.clearTimeout(timer);
  },[view,remaining,game.ended]);

  // Sesudah memilih, tampilkan akibat kartu sebentar, lalu masuk ke cycle berikutnya.
  useEffect(()=>{
    if (view !== 'result') return;
    const timer = window.setTimeout(()=>{
      setGame(prev=>nextCycle(prev));
      setRemaining(WAIT_SECONDS);
      setView('waiting');
    },1800);
    return ()=>window.clearTimeout(timer);
  },[view]);

  const guideText = tutorial ? INTRO[tutorialStep].text : game.ended ? statusLabel(game.meters) :
    view === 'waiting' ? `Menunggu transmisi Mission Control. Tiga kartu akan tersedia dalam ${remaining} detik. Perhatikan kondisi kru dan sistem outpost.` :
    view === 'cards' ? `Tiga kartu sudah tiba! Pilih satu tindakan untuk ${PHASE_LABEL[game.phase]} Sol ${game.sol}. Periksa bonus dan biayanya.` :
    current ? `${CREW_NAMES[current.crew]} mulai bertugas, jadi sementara tidak terlihat di ruangan. ${current.science}` : 'Misi sedang berjalan.';
  const dialogue = tutorial ? {name:'Toria',text:'Kita mulai dengan perkenalan sistem, ya?'} :
    current && view === 'result' ? {name:CREW_NAMES[current.crew],text:current.quote} : PHASE_DIALOGUE[game.phase];
  const nextTutorial = ()=>{
    if (tutorialStep < 3) { setTutorialStep(n=>n+1); return; }
    setView('waiting'); setRemaining(WAIT_SECONDS); setGuideOpen(true);
  };
  const choose = (id:string)=>{
    if (view !== 'cards' || game.selectedId) return;
    setGame(prev=>pickCard(prev,id));
    setGuideOpen(true);
    setView('result');
  };
  const reset = ()=>{setGame(newGame());setView('tutorial');setTutorialStep(0);setRemaining(WAIT_SECONDS);setGuideOpen(true)};

  return <main className="outpost-desktop"><section className={`outpost-stage ${tutorial?'is-tutorial':''} ${focus?'focus-'+focus:''}`} aria-label="CRATER Mars Outpost — tutorial dan HUD desktop">
    <SceneBridge snapshot={snapshot} className="outpost-phaser" onSceneError={setSceneError}/>
    <header className="hud-top">
      <div className="sol-hud" aria-label={`Sol ${game.sol} dari 8, ${PHASE_LABEL[game.phase]}`}>
        <strong className="sol-phase">{PHASE_LABEL[game.phase]}</strong>
        <div className="sol-icon"><img src={`${BASE}assets/cycle-${game.phase}.png`} alt=""/></div>
        <div className="sol-counter"><strong>{game.sol}</strong> / 8 Sol</div>
      </div>
      <div className="meters-hud" aria-label="Empat pilar outpost">
        {METERS.map(m=><MeterBar key={m.key} label={m.label} value={game.meters[m.key]} color={m.color} symbol={m.symbol} delta={view==='result'?(game.lastDelta[m.key]??0):null}/>)}
      </div>
    </header>
    {tutorial && focus && <div className={`tutorial-callout callout-${focus}`} role="status">
      <span className="tutorial-arrow" aria-hidden="true">➤</span>
      {focus==='sol' ? 'SOL menunjukkan hari di Mars. 1 / 8 berarti Sol pertama dari delapan. Setiap hari: Morning → Afternoon → Evening.' : 'Keempat pilar menunjukkan kondisi pos: Life Support, Shielding, Power, dan Food System. Efek kartu bisa positif, negatif, atau tetap.'}
    </div>}
    <div className="crew-dialogue"><strong>{dialogue.name}:</strong><em>“{dialogue.text}”</em></div>

    {!tutorial && !game.ended && view==='waiting' && <div className="transmission-wait" role="status" aria-live="polite">
      <span className="transmission-pulse" aria-hidden="true">◉</span>
      <strong>MENUNGGU TRANSMISI</strong>
      <span>3 kartu tiba dalam <b>{remaining}</b> detik</span>
    </div>}
    {!tutorial && !game.ended && view==='result' && current && <div className="result-bubble" role="status">
      <b>{current.title}</b><span>Keputusan tercatat · {CREW_NAMES[current.crew]} sedang bekerja</span>
    </div>}
    {!tutorial && !game.ended && view==='cards' && <section className="cards-area" aria-label="Pilih satu dari tiga kartu">
      <div className="cards-topline"><span>TRANSMISI BARU · PILIH 1 KARTU</span><span>{PHASE_LABEL[game.phase].toUpperCase()} / {String(game.sol).padStart(2,'0')}</span></div>
      <div className="cards-grid">{game.offer.map((card,index)=><ChoiceCard key={card.id} card={card} index={index} onChoose={choose} chosen={false} disabled={false}/>)}</div>
    </section>}

    <aside className="noe-area" aria-label="Noe Mission Control">
      <button className="noe-portrait" type="button" onClick={()=>!tutorial&&setGuideOpen(o=>!o)} aria-label="Buka pesan Noe">
        <img src={`${BASE}assets/guide-noe-portrait.png`} alt="Noe asli dari aset game"/><span>NOE</span>
      </button>
      {(guideOpen || tutorial) && <div className="noe-chat" role="status">
        <div className="noe-chat-head"><strong>MISSION CONTROL · NOE</strong>{!tutorial && <button type="button" onClick={()=>setGuideOpen(false)} aria-label="Tutup pesan Noe">×</button>}</div>
        <p>{guideText}</p>
        {tutorial && <div className="noe-actions"><span>{tutorialStep+1} / 4</span><button type="button" onClick={nextTutorial}>{tutorialStep===3?'MULAI MISI':'LANJUT'} →</button></div>}
      </div>}
    </aside>
    {game.ended && <div className="ending-backdrop" role="dialog" aria-modal="true" aria-label="Hasil misi">
      <div className="ending-card"><span>MISSION REPORT · SOL 8</span><h1>{statusLabel(game.meters)}</h1><p>{game.log.length} keputusan dicatat selama misi.</p>
        <div className="end-stats">{METERS.map(m=><div key={m.key}><span>{m.label}</span><b>{game.meters[m.key]}/100</b></div>)}</div>
        <button type="button" onClick={reset}>MAIN LAGI</button><small>Prototipe HUD — sistem penuh tetap mengikuti engine tim.</small>
      </div>
    </div>}
    {sceneError && <div className="outpost-error" role="alert">Gagal memuat Phaser: {sceneError}</div>}
  </section><p className="below-note">CRATER · ASET KARAKTER ASLI · TUTORIAL NOE · 3 KARTU / 15 DETIK SETIAP CYCLE</p></main>;
}
