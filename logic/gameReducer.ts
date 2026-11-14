import type { Card, Cosmonaut, GameAction, GameState } from '../types';
import { evaluateCharacterEffects } from './characterEffects';
import { DEFAULT_CONTENT, type GameContent } from './content';
import { getNextCycle, isCardAllowedInCycle } from './cycle';
import { drawHand } from './draw';
import { startGame } from './initialState';
import { applyEffects, areMetersDepleted } from './meters';

function tickCosmonauts(
  cosmonauts: readonly Cosmonaut[],
  assignedIds: readonly string[],
  cooldownCycles: number,
): Cosmonaut[] {
  const assigned = new Set(assignedIds);
  const normalizedCooldown = Math.max(0, Math.floor(cooldownCycles));

  return cosmonauts.map(cosmonaut => {
    if (assigned.has(cosmonaut.id)) {
      return {
        ...cosmonaut,
        cooldown: normalizedCooldown,
        available: normalizedCooldown === 0,
      };
    }

    if (cosmonaut.cooldown <= 0) {
      return cosmonaut.available
        ? cosmonaut
        : { ...cosmonaut, available: true };
    }

    const cooldown = Math.max(0, cosmonaut.cooldown - 1);
    return {
      ...cosmonaut,
      cooldown,
      available: cooldown === 0,
    };
  });
}

function tickCardCooldowns(
  cooldowns: Readonly<Record<string, number>>,
): Record<string, number> {
  const next: Record<string, number> = {};

  for (const cardId of Object.keys(cooldowns).sort()) {
    const remaining = cooldowns[cardId] - 1;
    if (remaining > 0) next[cardId] = remaining;
  }

  return next;
}

function markCardsUsed(
  cooldowns: Readonly<Record<string, number>>,
  usedCardIds: readonly string[],
  cooldownCycles: number,
): Record<string, number> {
  const next = tickCardCooldowns(cooldowns);
  const normalizedCooldown = Math.max(0, Math.floor(cooldownCycles));

  if (normalizedCooldown > 0) {
    for (const cardId of [...usedCardIds].sort()) {
      next[cardId] = normalizedCooldown;
    }
  }

  return next;
}

function selectCard(
  state: GameState,
  cardId: string,
  content: GameContent,
): GameState {
  if (state.phase !== 'playing') return state;

  const card = state.hand.find(candidate => candidate.id === cardId);
  if (!card || !isCardAllowedInCycle(card, state.cycle)) return state;

  const requiredPicks = content.balance.requiredPicks[state.cycle];

  // Blueprint v2.2: setiap cycle memilih tepat 1 kartu.
  // Fallback multi-pick dipertahankan agar perilaku tetap ditentukan config.
  if (requiredPicks <= 1) {
    if (
      state.selectedCardIds.length === 1 &&
      state.selectedCardIds[0] === cardId
    ) {
      return state;
    }

    return {
      ...state,
      selectedCardIds: [cardId],
      assignments: [],
    };
  }

  if (state.selectedCardIds.includes(cardId)) {
    return {
      ...state,
      selectedCardIds: state.selectedCardIds.filter(id => id !== cardId),
    };
  }

  if (state.selectedCardIds.length >= requiredPicks) return state;

  return {
    ...state,
    selectedCardIds: [...state.selectedCardIds, cardId],
  };
}

function assignCosmonaut(state: GameState, cosmonautId: string): GameState {
  if (state.phase !== 'playing') return state;
  if (state.cycle === 'night') return state;

  const cardId = state.selectedCardIds[0];
  if (!cardId) return state;

  const card = state.hand.find(candidate => candidate.id === cardId);
  if (!card || !isCardAllowedInCycle(card, state.cycle)) return state;

  const cosmonaut = state.cosmonauts.find(
    candidate => candidate.id === cosmonautId,
  );
  if (!cosmonaut) return state;
  if (!cosmonaut.available || cosmonaut.cooldown > 0) return state;

  const existing = state.assignments.find(
    assignment => assignment.cardId === cardId,
  );
  if (existing?.cosmonautIds.includes(cosmonautId)) return state;

  const assignments = existing
    ? state.assignments.map(assignment =>
        assignment.cardId === cardId
          ? {
              ...assignment,
              cosmonautIds: [...assignment.cosmonautIds, cosmonautId],
            }
          : assignment,
      )
    : [...state.assignments, { cardId, cosmonautIds: [cosmonautId] }];

  return { ...state, assignments };
}

function shuffleHand(state: GameState, content: GameContent): GameState {
  if (state.phase !== 'playing' || state.shuffleUsed) return state;

  const draw = drawHand({
    cards: content.cards,
    cycle: state.cycle,
    handSize: content.balance.handSize[state.cycle],
    rngState: state.rngState,
    cooldowns: state.cardCooldowns,
  });

  return {
    ...state,
    hand: draw.hand,
    rngState: draw.rngState,
    shuffleUsed: true,
    selectedCardIds: [],
    assignments: [],
  };
}

function advanceCycle(
  state: GameState,
  content: GameContent,
): GameState {
  if (state.phase !== 'playing' || state.cycle === 'night') return state;

  const requiredPicks = content.balance.requiredPicks[state.cycle];
  if (state.selectedCardIds.length !== requiredPicks) return state;

  const card = state.hand.find(
    candidate => candidate.id === state.selectedCardIds[0],
  );
  if (!card || !isCardAllowedInCycle(card, state.cycle)) return state;

  const assignment = state.assignments.find(
    item => item.cardId === card.id,
  );
  if (!assignment || assignment.cosmonautIds.length < 1) return state;

  const character = evaluateCharacterEffects(
    assignment.cosmonautIds,
    state.rngState,
    content.balance.characterRules,
  );

  const meters = applyEffects(state.meters, [
    ...card.effects,
    ...character.effects,
  ]);

  const cosmonauts = tickCosmonauts(
    state.cosmonauts,
    assignment.cosmonautIds,
    content.balance.cosmonautCooldownCycles,
  );

  const cardCooldowns = markCardsUsed(
    state.cardCooldowns,
    [card.id],
    content.balance.cardCooldownCycles,
  );

  const nextCycle = getNextCycle(state.cycle);
  if (!nextCycle) return state;

  const draw = drawHand({
    cards: content.cards,
    cycle: nextCycle,
    handSize: content.balance.handSize[nextCycle],
    rngState: character.rngState,
    cooldowns: cardCooldowns,
  });

  return {
    ...state,
    cycle: nextCycle,
    hand: draw.hand,
    meters,
    cosmonauts,
    cardCooldowns,
    rngState: draw.rngState,
    selectedCardIds: [],
    assignments: [],
    shuffleUsed: false,
  };
}

function endSol(state: GameState, content: GameContent): GameState {
  if (state.phase !== 'playing' || state.cycle !== 'night') return state;

  const requiredPicks = content.balance.requiredPicks.night;
  if (state.selectedCardIds.length !== requiredPicks) return state;
  if (new Set(state.selectedCardIds).size !== requiredPicks) return state;

  const selectedCards: Card[] = [];

  for (const cardId of state.selectedCardIds) {
    const card = state.hand.find(candidate => candidate.id === cardId);
    if (!card || !isCardAllowedInCycle(card, state.cycle)) return state;
    if (card.category !== 'daily') return state;
    selectedCards.push(card);
  }

  // Efek kartu harian + konsumsi ration dihitung sebagai satu batch,
  // lalu di-clamp sekali di ujung.
  const meters = applyEffects(state.meters, [
    ...selectedCards.flatMap(card => card.effects),
    ...content.balance.rationConsumption,
  ]);

  const cosmonauts = tickCosmonauts(
    state.cosmonauts,
    [],
    content.balance.cosmonautCooldownCycles,
  );

  const cardCooldowns = markCardsUsed(
    state.cardCooldowns,
    state.selectedCardIds,
    content.balance.cardCooldownCycles,
  );

  const depleted = areMetersDepleted(meters);
  const nextSol = state.sol + 1;

  if (depleted.length > 0) {
    return {
      ...state,
      sol: nextSol,
      meters,
      cosmonauts,
      cardCooldowns,
      hand: [],
      selectedCardIds: [],
      assignments: [],
      shuffleUsed: false,
      phase: 'ended',
      outcome: {
        status: 'lost',
        reason: 'meter-depleted',
        sol: nextSol,
        meters: depleted,
      },
    };
  }

  const draw = drawHand({
    cards: content.cards,
    cycle: 'morning',
    handSize: content.balance.handSize.morning,
    rngState: state.rngState,
    cooldowns: cardCooldowns,
  });

  return {
    ...state,
    sol: nextSol,
    cycle: 'morning',
    meters,
    cosmonauts,
    cardCooldowns,
    hand: draw.hand,
    rngState: draw.rngState,
    selectedCardIds: [],
    assignments: [],
    shuffleUsed: false,
    outcome: null,
  };
}

export function transition(
  state: GameState,
  action: GameAction,
  content: GameContent = DEFAULT_CONTENT,
): GameState {
  switch (action.type) {
    case 'START':
      if (state.phase !== 'idle') return state;
      return startGame(action.seed, content);

    case 'RESTART':
      return startGame(action.seed, content);

    case 'SELECT_CARD':
      return selectCard(state, action.cardId, content);

    case 'ASSIGN':
      return assignCosmonaut(state, action.cosmonautId);

    case 'SHUFFLE':
      return shuffleHand(state, content);

    case 'ADVANCE_CYCLE':
      return advanceCycle(state, content);

    case 'END_SOL':
      return endSol(state, content);

    // Day 1: timed event belum aktif.
    case 'RESOLVE_EVENT':
    case 'EVENT_TIMEOUT':
      return state;

    default:
      return state;
  }
}

export function gameReducer(
  state: GameState,
  action: GameAction,
): GameState {
  return transition(state, action, DEFAULT_CONTENT);
}
