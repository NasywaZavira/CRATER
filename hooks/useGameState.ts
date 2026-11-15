'use client';
import type { Dispatch } from 'react';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { GameAction, GameState } from '../types';
import { gameReducer } from '../logic/gameReducer';
import { createInitialState } from '../logic/initialState';
import { parseSave, serializeSave, type ParseSaveResult } from '../logic/save';
import { createLocalStorageSaveStorage } from '../logic/storage';
const INITIAL_STATE = createInitialState();
export interface UseGameStateResult {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  start: (seed: number) => void;
  restart: (seed: number) => void;
  selectCard: (cardId: string) => void;
  executeCard: () => void;
  rejectCard: () => void;
  selectRepair: (cardId: string) => void;
  skipRepair: () => void;
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
  }, [state, storage]);
  const send = useCallback((action: GameAction) => dispatch(action), []);
  const loadGame = useCallback((): ParseSaveResult | null => {
    const raw = storage.load();
    if (!raw) return null;
    const result = parseSave(raw);
    if (result.ok) dispatch({ type: 'LOAD_STATE', state: result.state });
    return result;
  }, [storage]);
  return {
    state, dispatch,
    start: seed => send({ type: 'START', seed }),
    restart: seed => send({ type: 'RESTART', seed }),
    selectCard: cardId => send({ type: 'SELECT_CARD', cardId }),
    executeCard: () => send({ type: 'EXECUTE_CARD' }),
    rejectCard: () => send({ type: 'REJECT_CARD' }),
    selectRepair: cardId => send({ type: 'SELECT_REPAIR', cardId }),
    skipRepair: () => send({ type: 'SKIP_REPAIR' }),
    setRation: (cosmonautId, food, water) => send({ type: 'SET_RATION', cosmonautId, food, water }),
    advanceCycle: () => send({ type: 'ADVANCE_CYCLE' }),
    endSol: () => send({ type: 'END_SOL' }),
    loadGame,
    clearSave: () => storage.clear(),
  };
}
