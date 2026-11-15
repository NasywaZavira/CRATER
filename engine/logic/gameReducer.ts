import type {
  CardDefinition, Cosmonaut, Cycle, GameAction, GameOutcome, GameState,
  MeterEffects, Meters, PendingEffect, Rations, SolReport,
} from '../types';
import { DISASTER_DAMAGE, DISASTER_IDS } from '../data/disasters';
import { applyMeterEffects, areMetersDepleted, METER_KEYS, meterValues } from './meters';
import { DEFAULT_CONTENT, type GameContent } from './content';
import { CYCLES, getNextCycle } from './cycle';
import { drawHand, drawRepairChoices } from './draw';
import { startGame } from './initialState';
import { nextRandom } from './rng';
import { SCHEMA_VERSION } from './version';
import { isArchivedSolarEventDue } from '../data/donkiArchive';

function allZero(): MeterEffects {
  return { lifeSupport: 0, shielding: 0, power: 0, food: 0 };
}
function isPlaying(state: GameState): boolean {
  return state.phase === 'playing' && state.outcome === null;
}
function withOutcome(state: GameState, outcome: GameOutcome | null): GameState {
  return outcome ? { ...state, phase: 'ended', phaseState: 'resolved', hand: [], selectedCardId: null, activeDisaster: null, outcome } : state;
}
/** Ending 8 Sol memakai threshold meter GDD; kondisi kru juga menentukan Abort. */
export function resolveOutcome(state: GameState, isEndOfCampaign = false): GameOutcome | null {
  const depleted = areMetersDepleted(state.meters);
  if (depleted.length) {
    return { status: 'lost', endingId: 'abort', reason: 'meter-depleted', sol: state.sol, meters: depleted };
  }
  if (state.cosmonauts.length > 0 && state.cosmonauts.every(c => c.condition === 'unwell')) {
    return { status: 'lost', endingId: 'abort', reason: 'crew-unwell', sol: state.sol, meters: [] };
  }
  if (isEndOfCampaign) {
    const values = meterValues(state.meters);
    const score = Math.min(...Object.values(values));
    const endingId = score >= 70 ? 'gold' : score >= 40 ? 'silver' : 'bronze';
    return { status: 'won', endingId, sol: state.sol, meters: values };
  }
  return null;
}

function finishStep(state: GameState): GameState {
  return withOutcome(state, resolveOutcome(state));
}

/** Kartu menggunakan delta JSON secara utuh, tanpa modifier trait/cost/rejection lama. */
function playCard(state: GameState, card: CardDefinition): GameState {
  // Legacy GDD has afterSols=0 entries whose meter effects are all zero and whose
  // ration metadata is not part of this meter engine. Keep them in JSON without
  // queuing invalid dueSol=playedSol save records.
  const hasDelayedMeterDelta = card.delayed && card.delayed.afterSols >= 1
    && Object.values(card.delayed.effects).some(delta => delta !== 0);
  const dueSol = hasDelayedMeterDelta ? state.sol + card.delayed!.afterSols : undefined;
  const pendingEffects: PendingEffect[] = dueSol === undefined ? state.pendingEffects : [
    ...state.pendingEffects,
    { cardId: card.id, playedSol: state.sol, dueSol, effects: { ...card.delayed!.effects } },
  ];
  return finishStep({
    ...state,
    meters: applyMeterEffects(state.meters, card.effects),
    pendingEffects,
    playedCards: [...state.playedCards, {
      cardId: card.id, sol: state.sol, cycle: state.cycle,
      category: card.category, effects: { ...card.effects },
      ...(dueSol === undefined ? {} : { delayedDueSol: dueSol }),
    }],
    selectedCardId: null,
    hand: [],
    activeDisaster: null,
    phaseState: 'resolved',
  });
}

function enterCycle(state: GameState, cycle: Cycle, content: GameContent): GameState {
  const basis: GameState = {
    ...state, cycle, hand: [], selectedCardId: null, activeDisaster: null,
    phaseState: cycle === 'night' ? 'night' : 'selecting',
  };
  if (cycle === 'night') return basis;

  let rngState = basis.rngState;
  const absolutePhase = (basis.sol - 1) * 4 + CYCLES.indexOf(cycle);
  const archiveDue = content.useDonkiArchive && isArchivedSolarEventDue(basis.sol, cycle)
    && !basis.disasterHistory.some(d => d.id === 'solarParticle');
  const allowed = !(basis.sol === 1 && cycle === 'morning')
    && basis.disasterHistory.length < content.balance.maxDisasters
    && (archiveDue || basis.lastDisasterPhase === null || absolutePhase - basis.lastDisasterPhase >= content.balance.disasterMinPhaseGap);

  if (allowed) {
    const roll = nextRandom(rngState);
    rngState = roll.rngState;
    if (archiveDue || roll.value < content.balance.disasterChances[cycle]) {
      const unused = DISASTER_IDS.filter(id => !basis.disasterHistory.some(entry => entry.id === id));
      if (unused.length) {
        const typeRoll = nextRandom(rngState);
        rngState = typeRoll.rngState;
        const id = archiveDue ? 'solarParticle' : unused[Math.floor(typeRoll.value * unused.length)];
        const drawn = drawRepairChoices(content.cards, content.balance.repairChoices, rngState);
        const meters = applyMeterEffects(basis.meters, DISASTER_DAMAGE[id]);
        const disaster: GameState = {
          ...basis, meters, rngState: drawn.rngState,
          lastDisasterPhase: absolutePhase,
          disasterHistory: [...basis.disasterHistory, { id, sol: basis.sol, cycle }],
          phaseState: 'repair',
          activeDisaster: { id, sol: basis.sol, cycle, repairChoices: drawn.hand },
        };
        return finishStep(disaster);
      }
    }
  }
  const draw = drawHand({
    cards: content.cards, cycle, handSize: content.balance.phaseCardCount, rngState,
  });
  return { ...basis, rngState: draw.rngState, hand: draw.hand };
}

function advanceCycle(state: GameState, content: GameContent): GameState {
  if (!isPlaying(state) || state.cycle === 'night' || state.phaseState !== 'resolved') return state;
  const next = getNextCycle(state.cycle);
  return next ? enterCycle(state, next, content) : state;
}

function gainNightResources(state: GameState, content: GameContent): GameState {
  const balance = content.balance;
  let rations: Rations = { ...state.rations };
  const crew: Cosmonaut[] = state.cosmonauts.map(c => ({ ...c, ration: { ...c.ration } }));
  // Beri ration sesuai pilihan pemain. Jika stok kurang, tak boleh menjadi negatif.
  const updatedCrew: Cosmonaut[] = crew.map(c => {
    const gotFood = c.ration.food && rations.food > 0;
    if (gotFood) rations.food -= 1;
    const gotWater = c.ration.water && rations.water > 0;
    if (gotWater) rations.water -= 1;
    if (gotFood && gotWater) {
      const nights = c.fullRationNights + 1;
      return {
        ...c, consecutiveMissedNights: 0, fullRationNights: nights,
        condition: (c.condition === 'unwell' && nights < 2) ? 'unwell' : 'ready',
      };
    }
    const misses = c.consecutiveMissedNights + 1;
    return { ...c, fullRationNights: 0, consecutiveMissedNights: misses, condition: misses >= 2 ? 'unwell' : 'tired' };
  });

  // GDD: irigasi, produksi dari kondisi meter, pemulihan solar, lalu decay.
  rations.water = Math.max(0, rations.water - balance.irrigation.water);
  const foodYield = state.meters.food.value >= 50 ? 3 : state.meters.food.value >= 30 ? 2 : 1;
  const waterYield = state.meters.lifeSupport.value >= 50 ? 3 : state.meters.lifeSupport.value >= 30 ? 2 : 1;
  const adjustedFoodYield = state.meters.power.value < 30 ? 0 : state.meters.power.value < 50 ? Math.max(0, foodYield - 1) : foodYield;
  rations.food += adjustedFoodYield;
  rations.water += waterYield;
  const effects = allZero();
  effects.power = (balance.solarRecovery[state.sol - 1] ?? 0) - balance.irrigation.power;
  if (state.meters.power.value < 30) effects.lifeSupport -= 5;
  for (const key of METER_KEYS) effects[key] -= balance.passiveDecay[key];
  const meters = applyMeterEffects(state.meters, effects);
  return { ...state, rations, cosmonauts: updatedCrew, meters };
}

function makeSolReport(state: GameState): SolReport {
  return {
    sol: state.sol, meters: meterValues(state.meters), rations: { ...state.rations },
    conditions: Object.fromEntries(state.cosmonauts.map(c => [c.id, c.condition])),
    cardIds: state.playedCards.filter(p => p.sol === state.sol).map(p => p.cardId),
    delayedCardIds: [],
    disasters: state.disasterHistory.filter(d => d.sol === state.sol).map(d => d.id),
  };
}

function endSol(state: GameState, content: GameContent): GameState {
  if (!isPlaying(state) || state.cycle !== 'night' || state.phaseState !== 'night') return state;
  const evaluated = gainNightResources(state, content);
  const report = makeSolReport(evaluated);
  const completed: GameState = { ...evaluated, solReports: [...state.solReports, report] };
  const result = resolveOutcome(completed, state.sol >= content.balance.maxSols);
  if (result) return withOutcome(completed, result);

  const nextSol = state.sol + 1;
  const due = completed.pendingEffects.filter(effect => effect.dueSol <= nextSol);
  let meters: Meters = completed.meters;
  for (const pending of due) meters = applyMeterEffects(meters, pending.effects);
  const transitioned: GameState = {
    ...completed, sol: nextSol, meters,
    pendingEffects: completed.pendingEffects.filter(effect => effect.dueSol > nextSol),
    // Timing is deterministic: end Sol 1 => Sol 2; delayed afterSols=1 resolves here.
    solReports: completed.solReports.map(r => r.sol === state.sol ? { ...r, delayedCardIds: due.map(d => d.cardId) } : r),
  };
  const immediateOutcome = resolveOutcome(transitioned);
  if (immediateOutcome) return withOutcome(transitioned, immediateOutcome);
  // Pagi Sol berikutnya juga dapat mengalami bencana; pagi Sol pertama tidak.
  return enterCycle(transitioned, 'morning', content);
}

export function transition(state: GameState, action: GameAction, content: GameContent = DEFAULT_CONTENT): GameState {
  if (action.type === 'LOAD_STATE') return action.state.schemaVersion === SCHEMA_VERSION ? action.state : state;
  if (action.type === 'START' || action.type === 'RESTART') return startGame(action.seed, content);
  if (!isPlaying(state)) return state;
  switch (action.type) {
    case 'SELECT_CARD':
      if (state.phaseState !== 'selecting' || !state.hand.some(c => c.id === action.cardId)) return state;
      return { ...state, selectedCardId: action.cardId };
    case 'EXECUTE_CARD': {
      if (state.phaseState !== 'selecting') return state;
      const card = state.hand.find(c => c.id === state.selectedCardId);
      return card ? playCard(state, card) : state;
    }
    case 'REJECT_CARD':
      if (state.phaseState !== 'selecting') return state;
      // Penalti skip berasal dari lingkungan/balance, tidak mengubah nilai JSON kartu.
      return finishStep({ ...state, meters: applyMeterEffects(state.meters, content.balance.skipPenalty),
        skippedCardIds: [...state.skippedCardIds, ...(state.selectedCardId ? [state.selectedCardId] : [])],
        selectedCardId: null, hand: [], phaseState: 'resolved' });
    case 'SELECT_REPAIR': {
      if (state.phaseState !== 'repair' || !state.activeDisaster) return state;
      const card = state.activeDisaster.repairChoices.find(c => c.id === action.cardId);
      return card ? playCard(state, card) : state;
    }
    case 'SKIP_REPAIR':
      if (state.phaseState !== 'repair' || !state.activeDisaster) return state;
      return finishStep({ ...state, meters: applyMeterEffects(state.meters, content.balance.skipRepairPenalty), activeDisaster: null, phaseState: 'resolved' });
    case 'SET_RATION':
      if (state.cycle !== 'night' || state.phaseState !== 'night' || !state.cosmonauts.some(c => c.id === action.cosmonautId)) return state;
      return { ...state, cosmonauts: state.cosmonauts.map(c => c.id === action.cosmonautId
        ? { ...c, ration: { food: action.food, water: action.water } } : c) };
    case 'ADVANCE_CYCLE': return advanceCycle(state, content);
    case 'END_SOL': return endSol(state, content);
  }
}
export function gameReducer(state: GameState, action: GameAction): GameState {
  return transition(state, action);
}
