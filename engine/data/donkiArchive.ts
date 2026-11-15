import raw from './donki-sep-archive.json';
import type { Cycle } from '../types';
/** Data historis NASA DONKI, diadaptasi ke jadwal Sol simulasi (bukan live). */
export const DONKI_ARCHIVE_LABEL = 'ARSIP NASA DONKI (11 Mei 2024) · BUKAN DATA LIVE';
export const DONKI_ARCHIVE = raw;
export function isArchivedSolarEventDue(sol: number, cycle: Cycle): boolean {
  return DONKI_ARCHIVE.events.some(event => event.scheduledSol === sol && event.scheduledCycle === cycle);
}
