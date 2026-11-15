import { describe, expect, it } from 'vitest';
import { drawThree, CARD_POOL } from '../../src/demo/cards';
import { newGame, nextCycle, pickCard } from '../../src/demo/game';

describe('Kartu dan Sol HUD prototype', () => {
  it('mengundi tepat 3 kartu unik dari fase yang sesuai', () => {
    for(const phase of ['morning','afternoon','evening'] as const) {
      const offer = drawThree(phase,()=>0.47);
      expect(offer).toHaveLength(3);
      expect(new Set(offer.map(card=>card.id)).size).toBe(3);
      expect(offer.every(card=>card.phase===phase)).toBe(true);
    }
  });
  it('mulai di Sol 1, morning, 4 meter pada 80',()=>{
    const g = newGame(()=>0.2);
    expect(g.sol).toBe(1); expect(g.phase).toBe('morning');
    expect(Object.values(g.meters)).toEqual([80,80,80,80]);
    expect(g.offer).toHaveLength(3);
  });
  it('pilih kartu sekali, meter berubah dan satu astronaut ditugaskan',()=>{
    const g = newGame(()=>0.9), card=g.offer[0];
    const next=pickCard(g,card.id);
    expect(next.selectedId).toBe(card.id);
    expect(next.working).toBe(card.crew);
    for(const [key,value] of Object.entries(card.delta)) expect(next.meters[key as keyof typeof next.meters]).toBe(Math.min(100,Math.max(0,80+(value ?? 0))));
    expect(pickCard(next,g.offer[1].id)).toBe(next);
  });
  it('lanjut cycle harus setelah memilih kartu, dan reset kerja di cycle berikutnya',()=>{
    const g=newGame(()=>0.2);expect(nextCycle(g)).toBe(g);
    const chosen=pickCard(g,g.offer[0].id);
    const next=nextCycle(chosen,()=>0.2);
    expect(next.phase).toBe('afternoon');expect(next.working).toBe(null);expect(next.selectedId).toBe(null);
  });
  it('setiap 3 keputusan menaikkan Sol, dan berhenti sesudah 8 Sol',()=>{
    let g=newGame(()=>0.1);
    for(let i=0;i<24;i++) {
      const card=g.offer[0];
      g=pickCard(g,card.id);
      g=nextCycle(g,()=>0.1);
    }
    expect(g.ended).toBe(true);
    expect(g.sol).toBe(8);
    expect(g.log).toHaveLength(24);
  });
  it('pool mencakup setiap phase dan semua target meter muncul',()=>{
    expect(new Set(CARD_POOL.map(c=>c.phase)).size).toBe(3);
    expect(new Set(CARD_POOL.flatMap(c=>Object.keys(c.delta))).size).toBe(4);
  });
});
