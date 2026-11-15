import type { Cycle } from '../bridge/scene-snapshot';

/** 4 tampilan cahaya. Engine hanya punya 3 cycle; 'evening' (sore) dipakai sebagai jeda afternoon -> night. */
export type Look = Cycle | 'evening';

export interface LightingPreset {
  color: number; // warna overlay
  alpha: number; // 0..1
  label: string;
  celestial: 'sun-low' | 'sun-high' | 'sun-set' | 'moon';
  sky: number; // warna langit di jendela (fallback shapes)
  ground: number; // warna tanah di jendela (fallback shapes)
}

/**
 * Warna sky/ground fallback mengikuti referensi "A Day on Mars" + Frame 4-6 Clara/Vira.
 * Ganti dengan hex palet resmi mereka bila sudah ada.
 */
export const LIGHTING: Record<Look, LightingPreset> = {
  morning: { color: 0xffb27a, alpha: 0.12, label: 'MORNING', celestial: 'sun-low', sky: 0xe8895a, ground: 0x9a4a2c },
  afternoon: { color: 0xffe0a0, alpha: 0.04, label: 'AFTERNOON', celestial: 'sun-high', sky: 0xd9d9d9, ground: 0xb98a4e },
  evening: { color: 0xff8a50, alpha: 0.2, label: 'EVENING', celestial: 'sun-set', sky: 0x6f7aa0, ground: 0x4a2a24 },
  night: { color: 0x0a1030, alpha: 0.5, label: 'NIGHT', celestial: 'moon', sky: 0x3b3e46, ground: 0x23252b },
};

/**
 * Urutan tampilan menuju cycle tujuan. afternoon -> night melewati sore (matahari terbenam),
 * sisanya langsung. Murni agar bisa dites.
 */
export function lookPath(from: Look, to: Cycle): Look[] {
  if (from === 'afternoon' && to === 'night') return ['evening', 'night'];
  return [to];
}

/** Interpolasi warna 0xRRGGBB, t di 0..1. */
export function lerpColor(a: number, b: number, t: number): number {
  const k = Math.min(1, Math.max(0, t));
  const ch = (shift: number) => {
    const x = (a >> shift) & 0xff;
    const y = (b >> shift) & 0xff;
    return Math.round(x + (y - x) * k);
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}
