> **Pembaruan terbaru:** katalog aktif kini **80 kartu GDD dengan klasifikasi 4 meter × 6 jenis aktivitas**. Dokumen ini memuat catatan versi sebelumnya. Lihat `METER_CATEGORY_UPDATE.md` di root proyek.

# CRATER — Figma card icon integration

## Sumber data dan randomisasi

- **Katalog aktif:** `engine/data/cards.json` — **20 kartu addendum**, masing-masing 5 `operations`, `research`, `construction`, `repair`.
- **Arsip katalog 80 kartu (tidak dijalankan):** `_preserved_versions/legacy-80-cards/cards.gdd-80.json`, dipertahankan byte-for-byte dari ZIP pengguna karena tidak cocok dengan validator addendum v4 (termasuk kategori `exploration` dan `upgrade`).
- `engine/data/cards.ts` memvalidasi dan membaca data aktif, `engine/logic/draw.ts` mengundi **3 kartu tanpa duplikat dalam satu penawaran** dengan generator Mulberry32, dan `engine/logic/cycle.ts` memilih kategori menurut fase. FIX hanya muncul pada bencana.
- `src/App.tsx` membaca `game.hand`/`activeDisaster.repairChoices` melalui `useGameState`; tidak ada daftar kartu hard-coded dalam UI. Saat **DEPLOY**, engine menghitung `effects` dari JSON, dan `delayed` diterapkan pada Sol yang ditentukan. Tidak ada perubahan angka efek kartu.
- Restart/misi baru menggunakan seed acak baru, sementara satu misi tetap deterministik mengikuti seed dalam state untuk penyimpanan/pengujian ulang.

## Gambar pengguna

- **Empat PNG asli** pengguna disalin tanpa modifikasi byte ke `public/assets/cards/original-figma/` dan diberi nama menurut indikator: `blue-life-support.png`, `purple-shielding.png`, `yellow-power.png`, `green-food.png`.
- `public/assets/cards/icons/{lifeSupport,shielding,power,food}.png` adalah **crop piksel gambar asli**, tanpa desain ulang atau generasi AI. Koordinat crop dan checksum SHA-256 terdapat di `CARD_ART_ASSETS.json`.
- Panel kartu dibuat responsif dengan HTML/CSS. Karena screenshot desain berisi tulisan “Clean Air Filter” dan angka efek contoh yang tertanam, **screenshot penuh tidak digunakan sebagai background di kartu lain** (akan menyesatkan). Hanya gambar ilustrasinya yang ditampilkan sebagai ikon, sehingga judul/deskripsi, label kategori dan efek selalu sesuai JSON kartu yang terpilih.
- Warna/icon mengikuti **meter dengan manfaat positif terbesar** (termasuk efek tunda), bukan kategori kartu. Misalnya Clean Air Filter berikon silang biru (lifeSupport +10). `src/cards/card-visual.ts` hanya mengatur tampilan; pemilihan dan perhitungan kartu engine tidak terpengaruh.
- Label kategori dan fakta NASA tetap ditampilkan dari JSON, termasuk `fact.dataset` dan `fact.sourceName`.

## Uji mandiri

Dari root hasil ekstrak:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Jika uji browser belum dijalankan di lingkungan ini, statusnya dijelaskan terpisah dalam jawaban, bukan diklaim lulus.
