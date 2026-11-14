'use client';

import type { Dispatch } from 'react';
import { useCallback, useReducer } from 'react';
import type { GameAction, GameState } from '../types';
import { gameReducer } from '../logic/gameReducer';
import { createInitialState } from '../logic/initialState';

const INITIAL_STATE = createInitialState();

export interface UseGameStateResult {
  state: GameState;
  dispatch: Dispatch<GameAction>;

  start: (seed: number) => void;
  restart: (seed: number) => void;
  selectCard: (cardId: string) => void;
  assign: (cosmonautId: string) => void;
  shuffle: () => void;
  advanceCycle: () => void;
  endSol: () => void;
  resolveEvent: (eventId: string, optionId: string) => void;
  eventTimeout: (eventId: string) => void;
}

export function useGameState(): UseGameStateResult {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  const start = useCallback(
    (seed: number) => {
      dispatch({ type: 'START', seed });
    },
    [dispatch],
  );

  const restart = useCallback(
    (seed: number) => {
      dispatch({ type: 'RESTART', seed });
    },
    [dispatch],
  );

  const selectCard = useCallback(
    (cardId: string) => {
      dispatch({ type: 'SELECT_CARD', cardId });
    },
    [dispatch],
  );

  const assign = useCallback(
    (cosmonautId: string) => {
      dispatch({ type: 'ASSIGN', cosmonautId });
    },
    [dispatch],
  );

  const shuffle = useCallback(() => {
    dispatch({ type: 'SHUFFLE' });
  }, [dispatch]);

  const advanceCycle = useCallback(() => {
    dispatch({ type: 'ADVANCE_CYCLE' });
  }, [dispatch]);

  const endSol = useCallback(() => {
    dispatch({ type: 'END_SOL' });
  }, [dispatch]);

  const resolveEvent = useCallback(
    (eventId: string, optionId: string) => {
      dispatch({ type: 'RESOLVE_EVENT', eventId, optionId });
    },
    [dispatch],
  );

  const eventTimeout = useCallback(
    (eventId: string) => {
      dispatch({ type: 'EVENT_TIMEOUT', eventId });
    },
    [dispatch],
  );

  return {
    state,
    dispatch,
    start,
    restart,
    selectCard,
    assign,
    shuffle,
    advanceCycle,
    endSol,
    resolveEvent,
    eventTimeout,
  };
}
