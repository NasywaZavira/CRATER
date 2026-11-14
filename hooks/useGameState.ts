'use client';

import type { Dispatch } from 'react';
import { useCallback, useReducer } from 'react';
import type {
  GameAction,
  GameState,
  MorningPlayInput,
} from '../types';
import { gameReducer } from '../logic/gameReducer';
import { createInitialState } from '../logic/initialState';

const INITIAL_STATE = createInitialState();

export interface UseGameStateResult {
  state: GameState;
  dispatch: Dispatch<GameAction>;

  start: (seed: number) => void;
  restart: (seed: number) => void;

  selectDaily: (groupIndex: number, cardId: string) => void;
  confirmMorning: (playNow?: MorningPlayInput[]) => void;

  selectCard: (cardId: string) => void;
  assign: (cosmonautId: string) => void;
  unassign: (cosmonautId: string) => void;
  executeCard: () => void;
  rejectCard: () => void;

  selectRepair: (cardId: string, cosmonautIds?: string[]) => void;
  skipRepair: () => void;

  setRation: (cosmonautId: string, food: boolean, water: boolean) => void;
  advanceCycle: () => void;
  endSol: () => void;
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

  const selectDaily = useCallback(
    (groupIndex: number, cardId: string) => {
      dispatch({ type: 'SELECT_DAILY', groupIndex, cardId });
    },
    [dispatch],
  );

  const confirmMorning = useCallback(
    (playNow: MorningPlayInput[] = []) => {
      dispatch({ type: 'CONFIRM_MORNING', playNow });
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

  const unassign = useCallback(
    (cosmonautId: string) => {
      dispatch({ type: 'UNASSIGN', cosmonautId });
    },
    [dispatch],
  );

  const executeCard = useCallback(() => {
    dispatch({ type: 'EXECUTE_CARD' });
  }, [dispatch]);

  const rejectCard = useCallback(() => {
    dispatch({ type: 'REJECT_CARD' });
  }, [dispatch]);

  const selectRepair = useCallback(
    (cardId: string, cosmonautIds?: string[]) => {
      dispatch({ type: 'SELECT_REPAIR', cardId, cosmonautIds });
    },
    [dispatch],
  );

  const skipRepair = useCallback(() => {
    dispatch({ type: 'SKIP_REPAIR' });
  }, [dispatch]);

  const setRation = useCallback(
    (cosmonautId: string, food: boolean, water: boolean) => {
      dispatch({ type: 'SET_RATION', cosmonautId, food, water });
    },
    [dispatch],
  );

  const advanceCycle = useCallback(() => {
    dispatch({ type: 'ADVANCE_CYCLE' });
  }, [dispatch]);

  const endSol = useCallback(() => {
    dispatch({ type: 'END_SOL' });
  }, [dispatch]);

  return {
    state,
    dispatch,
    start,
    restart,
    selectDaily,
    confirmMorning,
    selectCard,
    assign,
    unassign,
    executeCard,
    rejectCard,
    selectRepair,
    skipRepair,
    setRation,
    advanceCycle,
    endSol,
  };
}
