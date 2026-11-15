> **Pembaruan terbaru:** katalog aktif kini **80 kartu GDD dengan klasifikasi 4 meter × 6 jenis aktivitas**. Dokumen ini memuat catatan versi sebelumnya. Lihat `METER_CATEGORY_UPDATE.md` di root proyek.

# CRATER – engine kartu JSON addendum (v4)

Basis kode: ZIP `CRATER-feat-engine-p(1).zip`, dengan konten kartu **sepenuhnya** digantikan oleh file pengguna `cards(1).json` yang disalin tanpa edit menjadi `data/cards.json`.

## Aturan kartu v4

- **20 kartu**: 5 `operations`, 5 `research`, 5 `construction`, 5 `repair`.
- Nama/teks berasal dari `title.en` dan `description.en`; `description` adalah fakta NASA singkat, bukan narasi misi lama.
- Atur top-left label dengan `CATEGORY_LABEL` dari `types/index.ts` / `logic/index.ts`.
- Art diminta berdasarkan `artKey`, misalnya `ops/clean-air-filter`. **File PNG terkait tidak disertakan di ZIP sumber**, jadi tidak ada gambar yang dibuat atau dimodifikasi.
- Effects: 4 angka meter (`lifeSupport`, `shielding`, `power`, `food`); 0 berarti `—` di UI. Delta negatif/positif **dihitung bersamaan** dan di-clamp ke 0–100. Tidak ada syarat harus mampu membayar; jika turun ke 0, permainan kalah.
- Efek tertunda hanya berasal dari `delayed`: antri hingga memasuki Sol `solSaatDimainkan + afterSols`. Contoh: card dimainkan pada Sol 1 dengan `afterSols: 1` → efek aktif setelah mengakhiri Sol 1, saat memasuki Sol 2.
- Tidak ada lagi `costs`, `rejectionPenalty`, `requiresCrew`, `durationCycles`, buff keahlian, upgrade permanen, atau `disasterId` pada kartu.
- `fact.sourceUrl === null` dibiarkan kosong; **tidak membuat URL sumber yang tidak diberikan**.

## Fase dan pemilihan kartu

| Fase | Kategori | Penawaran | Penyelesaian |
|---|---|---:|---|
| Morning | `operations` = DAILY ROUTINE | 3 kartu | Pilih 1 lalu execute, atau skip |
| Afternoon | `research` = RESEARCH | 3 kartu | Pilih 1 lalu execute, atau skip |
| Evening | `construction` = UPGRADE | 3 kartu | Pilih 1 lalu execute, atau skip |
| Night | Evaluasi Sol | 0 | `END_SOL` |
| Saat bencana | `repair` = FIX | 3 kartu | `SELECT_REPAIR`, atau `SKIP_REPAIR` |

Pagi di GDD lama meminta 9 kartu Daily Routine, tetapi addendum hanya menyediakan **5** operations. Karena itu fase pagi v4 memakai 3 pilihan, bukan mengulang kartu 9 kali. Kategori `repair` berlaku untuk **semua** jenis bencana, karena JSON baru tidak memiliki pemetaan kartu ke `disasterId`.

Bencana, pemulihan solar, decay, irigasi, 8 Sol, 4 meter, serta ration kru mengikuti kerangka GDD sejauh tidak bertentangan dengan skema kartu baru. Empat astronaut masih ada dalam state dan menerima ration malam; **kartu v4 tidak dapat memberikan bonus/penugasan kru** karena fieldnya tidak ada. Kriteria medali disederhanakan ke ambang 70/40 untuk meter; lihat `DECISIONS.md`.

## File penting

- `data/cards.json` — **sumber kebenaran tunggal**, 20 kartu; jangan edit `data/cards.ts` untuk mengganti data kartu.
- `data/cards.ts` — validasi JSON dan helper UI (`localize`, `formatCardEffect`).
- `types/index.ts` — `CardDefinition`, `MeterEffects`, `NasaFactSource`, `CATEGORY_LABEL`, state/action baru.
- `logic/draw.ts` — 3 pilihan sesuai kategori/fase.
- `logic/gameReducer.ts` — efek kartu, waktu Sol, bencana, ration, ending.
- `logic/save.ts` — save v4, hidrasi ID ke kartu kanonis dari JSON.
- `hooks/useGameState.ts` — React hook dengan API baru.
- `MIGRATION.md` — perubahan kontrak dari engine lama untuk integrasi HUD.

## Tes

```sh
npm ci
npm run typecheck
npm test
```

Ini **library engine**, bukan project Vite/Phaser/React lengkap. ZIP sumber memang tidak memiliki `src/App.tsx`, gambar, atau executable frontend; untuk integrasi perlu menyesuaikan pemanggil engine dengan `MIGRATION.md`.
