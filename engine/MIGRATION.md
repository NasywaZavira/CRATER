> **Pembaruan terbaru:** katalog aktif kini **80 kartu GDD dengan klasifikasi 4 meter × 6 jenis aktivitas**. Dokumen ini memuat catatan versi sebelumnya. Lihat `METER_CATEGORY_UPDATE.md` di root proyek.

# Integrasi HUD / perubahan breaking v3 → v4

Engine kini mempunyai **kontrak baru** karena data card addendum tidak kompatibel dengan `Card` lama.

## Map field kartu

| Sebelum | Sekarang |
|---|---|
| `card.name` | `localize(card.title)` |
| `card.description` string | `localize(card.description)` (NASA fact) |
| `card.deck` / 6 categories | `card.category` (`operations`, `construction`, `repair`, `research`) |
| `card.costs`, `card.effects` berupa array `CardEffect[]` | `card.effects` lengkap `MeterEffects` dengan 4 angka |
| `card.delayedEffects` | `card.delayed?.effects` dan `card.delayed?.afterSols` |
| `card.source`, `card.fact` string | `card.fact.sourceName`, `card.fact.dataset`, `card.fact.sourceUrl` |
| gambar eksternal berdasar ID | `card.artKey` (string, tanpa file gambar dalam engine) |
| `requiresCrew`, `durationCycles`, `permanent`, `rejectionPenalty`, `validitySol` | DIHAPUS dari aturan kartu |

## Game state dan hooks

- `state.hand`: 3 `CardDefinition` untuk tiap fase kecuali malam atau bencana.
- `state.selectedCardId`: ID terpilih atau `null`.
- `state.phaseState`: `selecting` → `resolved` → `ADVANCE_CYCLE`; saat bencana `repair` → `resolved`; saat malam `night` → `END_SOL`.
- `state.activeDisaster?.repairChoices`: 3 card `repair` siap ditampilkan saat bencana.
- `state.pendingEffects`: `{ cardId, playedSol, dueSol, effects }[]`.
- Hilang: `morningGroups`, `morningPicks`, `commandHand`, `activeMissions`, `assignments`, `activeBuffs`, dan aksi `SELECT_DAILY`, `CONFIRM_MORNING`, `ASSIGN`, `UNASSIGN`, `USE_STORED`.

```ts
import { CATEGORY_LABEL, formatCardEffect, localize } from './logic';
const title = localize(card.title, 'en');
const category = CATEGORY_LABEL[card.category];
const body = localize(card.description, 'en');
const displayPower = formatCardEffect(card.effects.power); // '—', '+10', '-10'
```

```ts
// Contoh flow gameplay
const { state, start, selectCard, executeCard, advanceCycle, selectRepair, endSol } = useGameState();
start(2026);
// state.hand = 3 operations
selectCard(state.hand[0].id);
executeCard();
advanceCycle(); // 3 research, atau bencana + repairChoices
// saat phaseState === 'repair': selectRepair(state.activeDisaster.repairChoices[0].id)
// pada night: endSol(); delay afterSols=1 aktif di pagi Sol berikutnya
```

Jangan menjadikan `description` teks aksi; itu adalah fakta NASA yang disuplai dari JSON. Deskripsi tindakan untuk UI tambahan **tidak ada** dalam schema, jadi UI jangan mengarangnya tanpa data baru.
