# CRATER — Pembaruan klasifikasi 80 kartu (15 November 2026)

## Yang aktif di proyek ini

- **80 kartu GDD** pada `engine/data/cards.json`: 20 operations, 10 research, 10 exploration, 10 construction, 10 upgrade, 20 repair.
- Setiap kartu memiliki `primaryMeter`: `lifeSupport`, `shielding`, `power`, atau `food`, dikurasi berdasarkan konteks kartu; `relatedMeters` berisi target positif lain jika ada.
- Jenis aktivitas **tetap** memakai field `category` asli (6 jenis). Struktur kelompok runtime: `GROUPED_CARDS_BY_METER[meter][category]` dari `engine/logic/cardGrouping.ts`.
- Contoh: `UP-06 Hydrogen-Rich Polymer Lining` adalah `shielding → upgrade`; `RS-03 Regolith Shield Depth Study` adalah `shielding → research`; `DR-01 Morning ARED Resistance Workout` adalah `lifeSupport → operations` walau yang berubah langsung hanyalah Power -3.
- UI menampilkan tag `METER • KATEGORI` dan ikon Figma berdasarkan `primaryMeter`, **bukan** efek positif numerik terbesar. Semua artwork asli tetap utuh.
- Pengundian: Morning dari 20 operations; Afternoon dari gabungan 10 research + 10 exploration; Evening dari gabungan 10 construction + 10 upgrade; FIX saat bencana dari 20 repair. Tetap 3 kartu acak unik per penawaran, deterministik selama satu misi.

## Batasan yang penting untuk tim

**Klasifikasi ini bukan implementasi menyeluruh semua aturan GDD.** Engine yang diterima masih hanya menerapkan angka `effects` (4 meter), `delayed.effects` yang jatuh tempo pada Sol mendatang, penalti skip, decay, bencana, dan ransum malam generik. Metadata GDD asli seperti `cost`, `assignment`, `statusEffects`, `bonus`, `passiveReduction`, `requires`, `rations`, dan efek malam `delayed.afterSols=0` **dipertahankan pada JSON tetapi belum diimplementasikan sebagai aksi gameplay**. Kartu tanpa delta negatif dibolehkan dalam katalog GDD karena metadata biaya terpisah belum terintegrasi. Jangan mengklaim semua mekanik 80 kartu GDD sudah dijalankan.

Dua kartu GDD menyimpan `delayed.afterSols=0` dengan `rations.water=1` tanpa efek meter: data tetap ada, namun engine tidak memasukkannya ke antrean meter tertunda agar tidak merusak validasi save. Ini bukan berarti bonus ransum malam sudah dihitung.

**20 kartu addendum** dari ZIP sebelumnya disimpan di `_preserved_versions/addendum-20-cards/cards.addendum-20.json` (byte-for-byte), tetapi **tidak masuk undian** pada versi ini. Katalog asli 80 kartu disimpan juga di `_preserved_versions/legacy-80-cards/cards.gdd-80.json` tanpa modifikasi. Versi save sebelumnya berisi ID dari 20 kartu dapat gagal dimuat karena katalog aktif berubah; migrasi save belum dibuat.

`demo.html` adalah prototipe terpisah dari React/Phaser aktif. Gunakan `npm run dev` untuk menguji katalog 80 kartu.

## Peta perubahan kode

- **Aktifkan 80 + klasifikasi:** `engine/data/cards.json`; `engine/types/index.ts`; `engine/data/cards.ts`
- **Indeks meter → subkategori:** `engine/logic/cardGrouping.ts`; `engine/logic/index.ts`
- **Undian enam kategori:** `engine/logic/draw.ts`; `engine/logic/cycle.ts`
- **Keselamatan save untuk metadata GDD:** `engine/logic/gameReducer.ts`
- **HUD dan ilustrasi:** `src/App.tsx`; `src/cards/card-visual.ts`; `src/styles/outpost.css`
- **Phaser kru:** `src/bridge/engine-snapshot.ts`
- **Pengujian:** `engine/tests`, `tests/bridge`
- **Daftar semua 80:** `CARD_METER_CATEGORY_INDEX.md`

## Hasil verifikasi

- Root `tsc --noEmit`: lulus.
- `engine` TypeScript check: lulus.
- Direct Node smoke test pada transpile engine: 423 asersi lulus untuk validasi, 4×6 indeks, pengundian ketiga fase, kesesuaian kategori, save, dan satu simulasi hingga ending.
- Tes resmi `npm test` / build Vite: belum dijalankan sampai lulus, karena dependensi yang tersedia pada lingkungan pemeriksaan berasal dari Windows (Rollup Linux binding tidak ada). Lakukan `npm ci && npm run typecheck && npm test && npm run build` pada OS yang memiliki dependensi sesuai.
