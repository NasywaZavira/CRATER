import { drawThree, type ActionCard, type CrewId, type MeterKey, type Phase } from './cards';

export const PHASES: Phase[] = ['morning', 'afternoon', 'evening'];
export const PHASE_LABEL: Record<Phase,string> = { morning:'Morning', afternoon:'Afternoon', evening:'Evening' };
export const METER_KEYS: MeterKey[] = ['life', 'shielding', 'power', 'food'];
export type Meters = Record<MeterKey, number>;
export type CrewAvailability = Record<CrewId, boolean>;

export interface DemoState {
  sol: number;
  phase: Phase;
  meters: Meters;
  offer: ActionCard[];
  selectedId: string | null;
  working: CrewId | null;
  ended: boolean;
  lastDelta: Partial<Meters>;
  log: { sol: number; phase: Phase; card: string }[];
}

const cap = (n: number) => Math.min(100, Math.max(0, n));
export function newGame(random: () => number = Math.random): DemoState {
  return {
    sol: 1, phase: 'morning', meters: { life:80, shielding:80, power:80, food:80 },
    offer: drawThree('morning', random), selectedId: null, working: null,
    ended: false, lastDelta: {}, log: [],
  };
}
export function pickCard(game: DemoState, id: string): DemoState {
  if (game.selectedId || game.ended) return game;
  const card = game.offer.find(c => c.id === id);
  if (!card) return game;
  const meters = { ...game.meters };
  for (const key of METER_KEYS) meters[key] = cap(meters[key] + (card.delta[key] ?? 0));
  return {
    ...game, meters, selectedId: id, working: card.crew,
    lastDelta: card.delta,
    log: [...game.log, {sol:game.sol,phase:game.phase,card:id}],
  };
}
/** Tiga fase ditampilkan. Setelah Evening terjadi evaluasi malam otomatis (pasif saja).
 * Food/Water Ration, produksi malam, cooldown dan event bencana dipegang engine tim, BUKAN prototype.
 */
export function nextCycle(game: DemoState, random: () => number = Math.random): DemoState {
  if (!game.selectedId || game.ended) return game;
  const index = PHASES.indexOf(game.phase);
  if (index < 2) {
    const phase = PHASES[index + 1];
    return { ...game, phase, offer: drawThree(phase, random), selectedId:null, working:null, lastDelta:{} };
  }
  const meters = { ...game.meters, life:cap(game.meters.life-3), shielding:cap(game.meters.shielding-2), power:cap(game.meters.power-3), food:cap(game.meters.food-2) };
  if (game.sol === 8 || Object.values(meters).some(value => value === 0)) {
    return { ...game, meters, working:null, ended:true, selectedId:game.selectedId, lastDelta:{} };
  }
  return { ...game, sol:game.sol+1, phase:'morning', meters, offer:drawThree('morning', random), selectedId:null, working:null, lastDelta:{} };
}
export function statusLabel(meters: Meters): string {
  if (Object.values(meters).some(value=>value===0)) return 'Misi gagal: salah satu sistem berhenti.';
  if (Object.values(meters).every(value=>value>=70)) return 'Pos Mars bertahan dengan sangat baik!';
  if (Object.values(meters).every(value=>value>=40)) return 'Pos Mars berhasil bertahan.';
  return 'Pos bertahan, tetapi sistem memerlukan perbaikan.';
}
export function selectedCard(game: DemoState): ActionCard | undefined {
  return game.offer.find(card => card.id === game.selectedId);
}
