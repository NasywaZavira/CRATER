'use client';

import type { Dispatch } from 'react';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type {
  GameAction,
  GameState,
  MorningPlayInput,
} from '../types';
import { gameReducer } from '../logic/gameReducer';
import { createInitialState } from '../logic/initialState';
import {
  parseSave,
  serializeSave,
  type ParseSaveResult,
} from '../logic/save';
import { createLocalStorageSaveStorage } from '../logic/storage';

const INITIAL_STATE = createInitialState();

export interface UseGameStateResult {
  state: GameState;
  dispatch: Dispatch<GameAction>;

  start: (seed: number) => void;
  restart: (seed: number) => void;

  selectDaily: (groupIndex: number, cardId: string) => void;
  confirmMorning: (
    playNow?: MorningPlayInput[],
    store?: string[],
  ) => void;

  selectCard: (cardId: string) => void;
  assign: (cosmonautId: string) => void;
  unassign: (cosmonautId: string) => void;
  executeCard: () => void;
  rejectCard: () => void;

  selectRepair: (cardId: string, cosmonautIds?: string[]) => void;
  skipRepair: () => void;

  useStored: (cardId: string, cosmonautIds?: string[]) => void;
  setRation: (cosmonautId: string, food: boolean, water: boolean) => void;
  advanceCycle: () => void;
  endSol: () => void;

  loadGame: () => ParseSaveResult | null;
  clearSave: () => void;
}

export function useGameState(): UseGameStateResult {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const storage = useMemo(() => createLocalStorageSaveStorage(), []);

  useEffect(() => {
    if (state.phase === 'playing' || state.phase === 'ended') {
      storage.save(serializeSave(state, new Date().toISOString()));
    }
    // Save only at phase boundaries (sol, cycle, or phase changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.seed, state.sol, state.cycle, state.phase, storage]);

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
    (playNow: MorningPlayInput[] = [], store: string[] = []) => {
      dispatch({ type: 'CONFIRM_MORNING', playNow, store });
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

  const useStored = useCallback(
    (cardId: string, cosmonautIds?: string[]) => {
      dispatch({ type: 'USE_STORED', cardId, cosmonautIds });
    },
    [dispatch],
  );

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

  const loadGame = useCallback((): ParseSaveResult | null => {
    const json = storage.load();
    if (!json) return null;

    const result = parseSave(json);
    if (result.ok) {
      dispatch({ type: 'LOAD_STATE', state: result.state });
    }
    return result;
  }, [dispatch, storage]);

  const clearSave = useCallback(() => {
    storage.clear();
  }, [storage]);

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
    useStored,
    setRation,
    advanceCycle,
    endSol,
    loadGame,
    clearSave,
  };
}
