import type { SceneSnapshot } from '../contracts/types';

export interface LightingPreset {
  color: number; // warna overlay
  alpha: number; // 0..1
  label: string;
  celestial: 'sun-low' | 'sun-high' | 'moon';
}

/** Preset pencahayaan morning/afternoon/night (BASE-18). Cukup overlay warna + penanda matahari/bulan. */
export const LIGHTING: Record<SceneSnapshot['theme'], LightingPreset> = {
  morning: { color: 0xffb27a, alpha: 0.18, label: 'MORNING', celestial: 'sun-low' },
  afternoon: { color: 0xffe0a0, alpha: 0.05, label: 'AFTERNOON', celestial: 'sun-high' },
  night: { color: 0x0a1030, alpha: 0.6, label: 'NIGHT', celestial: 'moon' },
};
