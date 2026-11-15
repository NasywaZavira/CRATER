import { describe, expect, it } from 'vitest';
import { CARD_LIBRARY, SCHEMA_VERSION, createInitialState, parseSave, serializeSave, transition } from '../logic';

describe('save v4', () => {
  it('round trips canonical cards from JSON', () => {
    const game = transition(createInitialState(), { type: 'START', seed: 23 });
    const saved = serializeSave(game, '2026-11-15T00:00:00Z');
    const parsed = parseSave(saved);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state.hand.map(c => c.id)).toEqual(game.hand.map(c => c.id));
      expect(parsed.state.hand[0]).toBe(CARD_LIBRARY.find(c => c.id === game.hand[0].id));
      expect(parsed.state.schemaVersion).toBe(SCHEMA_VERSION);
    }
  });
  it('refuses v3 data instead of silently mapping old 80 cards', () => {
    const game = transition(createInitialState(), { type: 'START', seed: 1 });
    const obj = JSON.parse(serializeSave(game)) as { schemaVersion: number };
    obj.schemaVersion = 3;
    expect(parseSave(JSON.stringify(obj))).toEqual({ ok: false, error: 'unsupported-version' });
  });
  it('refuses unknown legacy card ID', () => {
    const game = transition(createInitialState(), { type: 'START', seed: 1 });
    const obj = JSON.parse(serializeSave(game)) as { state: { hand: string[] } };
    obj.state.hand = ['DR-01'];
    expect(parseSave(JSON.stringify(obj))).toEqual({ ok: false, error: 'unknown-card' });
  });
  it('refuses unparseable JSON', () => {
    expect(parseSave('{bad')).toEqual({ ok: false, error: 'not-json' });
  });
});
