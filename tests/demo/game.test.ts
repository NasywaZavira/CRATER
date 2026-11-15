import { describe, expect, it } from 'vitest';
import { BALANCE, CARD_LIBRARY, DEFAULT_CONTENT, DONKI_ARCHIVE, createInitialState, transition } from '../../engine/logic';
import { sceneFromEngine } from '../../src/bridge/engine-snapshot';

/** Replaces demo card tests. The UI now consumes engine v4, never src/demo/*. */
const deterministicContent = {
  ...DEFAULT_CONTENT,
  useDonkiArchive: false,
  balance: { ...BALANCE, disasterChances: { morning: 0, afternoon: 0, evening: 0, night: 0 } },
};
const start = (seed: number) => transition(createInitialState(deterministicContent), { type: 'START', seed }, deterministicContent);

describe('Website UI to engine integration', () => {
  it('starts Sol 1 with three operations cards from JSON', () => {
    const game = start(20240511);
    expect(game.sol).toBe(1);
    expect(game.cycle).toBe('morning');
    expect(game.hand).toHaveLength(3);
    expect(game.hand.every(card => CARD_LIBRARY.some(source => source === card))).toBe(true);
    expect(game.hand.every(card => card.category === 'operations')).toBe(true);
  });
  it('updates meters using selected JSON card', () => {
    let game = start(3);
    const card = game.hand[0];
    game = transition(game, { type: 'SELECT_CARD', cardId: card.id }, deterministicContent);
    game = transition(game, { type: 'EXECUTE_CARD' }, deterministicContent);
    expect(game.playedCards.at(-1)?.cardId).toBe(card.id);
    for (const key of ['lifeSupport', 'shielding', 'power', 'food'] as const) {
      expect(game.meters[key].value).toBe(Math.min(100, Math.max(0, 80 + card.effects[key])));
    }
  });
  it('applies penalty for skip; no free skip', () => {
    const before = start(3);
    const after = transition(before, { type: 'REJECT_CARD' }, deterministicContent);
    expect(after.meters.power.value).toBe(before.meters.power.value + BALANCE.skipPenalty.power);
    expect(after.phaseState).toBe('resolved');
  });
  it('supports afternoon, evening, and night phases in the UI', () => {
    let game = start(3);
    for (const expected of ['afternoon', 'evening', 'night'] as const) {
      game = transition(game, { type: 'REJECT_CARD' }, deterministicContent);
      game = transition(game, { type: 'ADVANCE_CYCLE' }, deterministicContent);
      expect(game.cycle).toBe(expected);
    }
    expect(game.phaseState).toBe('night');
    game = transition(game, { type: 'END_SOL' }, deterministicContent);
    expect(game.sol).toBe(2);
  });
  it('maps crew, Sol, cycle and disaster hazard to Phaser snapshot', () => {
    const game = start(1);
    const snapshot = sceneFromEngine(game, 'construction');
    expect(snapshot.sol).toBe(1);
    expect(snapshot.cycle).toBe('morning');
    expect(snapshot.hazard).toBe('none');
    expect(snapshot.crew.find(c => c.id === 'toria')?.available).toBe(false);
    expect(snapshot.crew.find(c => c.id === 'cirra')?.available).toBe(true);
    expect(sceneFromEngine(game, 'upgrade').crew.find(c => c.id === 'cirra')?.available).toBe(false);
    expect(sceneFromEngine(game, 'exploration').crew.find(c => c.id === 'sylvan')?.available).toBe(false);
    expect(sceneFromEngine({ ...game, activeDisaster: { id: 'solarParticle', sol: 3, cycle: 'afternoon', repairChoices: [] } }, null).hazard).toBe('solar-storm');
  });
  it('contains historically sourced NASA SEP archive with explicit simulation schedule', () => {
    expect(DONKI_ARCHIVE.status).toBe('historical_archive_not_live');
    expect(DONKI_ARCHIVE.events[0].id).toBe('2024-05-11T04:07:00-SEP-001');
    expect(DONKI_ARCHIVE.events[0].sourceUrl).toContain('ccmc.gsfc.nasa.gov');
    expect(DONKI_ARCHIVE.events[0].simulationNote).toContain('NOT a NASA forecast');
  });
});
