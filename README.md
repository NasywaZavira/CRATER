> **Pembaruan terbaru:** katalog aktif kini **80 kartu GDD dengan klasifikasi 4 meter × 6 jenis aktivitas**. Dokumen ini memuat catatan versi sebelumnya. Lihat `METER_CATEGORY_UPDATE.md` di root proyek.

# CRATER — Mars Outpost (Original Character Edition)

**Versi:** tutorial Noe, 15-second card transmissions, React + TypeScript + Phaser 4, desktop 16:9.

## Mulai dengan cara paling mudah

1. Ekstrak ZIP.
2. Klik dua kali **demo.html** untuk memainkan prototype langsung di browser, tanpa npm.
3. Klik **LANJUT** pada panel Noe: sapaan → penjelasan SOL → penjelasan 4 pilar → penjelasan kartu.
4. Klik **MULAI MISI**, tunggu **15 detik** sampai 3 kartu muncul.
5. Pilih 1 kartu. Meter diperbarui, astronaut yang bekerja hilang sebentar, dan setelah sekitar 1,8 detik game masuk ke cycle berikutnya dan kembali menunggu 15 detik.
6. Ulangi sampai Sol 8. Cycle: Morning → Afternoon → Evening → Sol berikutnya.

## Menjalankan project React + Phaser

Pastikan Node.js 20+ terpasang. Buka folder ini di VS Code, lalu jalankan:

```sh
npm install
npm run dev
```

Buka URL lokal dari Vite (biasanya http://localhost:5173). Untuk pemeriksaan:

```sh
npm run typecheck
npm run build
```

`npm run lint` belum dikonfigurasi. Ketika `npm audit fix --force` memasang major versi Vitest, jalankan ulang `npm run test` untuk memastikan tidak ada pengujian yang berubah.

## Urutan tutorial dan game

- Tutorial 1: layar outpost gelap, Noe terang dan menyapa.
- Tutorial 2: kotak merah + panah menyorot Sol / Morning, Afternoon, Evening.
- Tutorial 3: kotak merah + panah menyorot 4 pilar.
- Tutorial 4: Noe menjelaskan mekanik 3 kartu.
- Game: 15 detik tanpa kartu → **3 kartu tersusun tengah** → pilih 1 → astronaut bertugas menghilang → efek bar → 15 detik tanpa kartu pada cycle berikutnya.
- Empat pilar awal 80/100: Life Support, Shielding, Power, Food System.
- Tidak ada 3 garis indikator kecil di panel SOL.
- Portrait Noe berasal dari `guide-noe.png` asli, **hanya di-crop sebagai framing** untuk UI (`guide-noe-portrait.png`). Gambar karakter dan desain tidak digambar ulang. Toria, Sylvan, Corin, dan Cirra tetap memakai file sumber original dengan hash identik.
- Tiga ilustrasi atas kartu adalah potongan ilustrasi non-karakter dari mockup kartu yang sebelumnya disetujui, tanpa menggambar ulang astronaut atau Noe.

## Struktur penting

- `src/App.tsx`: tutorial Noe, highlight, timer dan sistem pemilihan 3 kartu.
- `src/styles/outpost.css`: tata letak desktop, kartu, portrait, HUD dan sorotan tutorial.
- `src/demo/cards.ts`: katalog mini dan efek contoh 3 kartu.
- `src/demo/game.ts`: perubahan meter, perpindahan cycle, hasil akhir prototype.
- `src/phaser/OutpostScene.ts`: asli Mars Outpost, sprites kru terpisah, idle animation dan perubahan langit Mars.
- `src/bridge/SceneBridge.tsx`: penghubung React dan Phaser.
- `public/assets`: aset asli (termasuk 5 PNG karakter) + pemandangan Mars + tiga gambar kartu non-karakter.
- `demo.html`: versi playable mandiri tanpa dependensi (sistem sama untuk prototype).

## Batasan

Ini **prototipe game flow** untuk tugas outpost/HUD. Bukan implementasi penuh 80 kartu, trait karakter, bencana, resource ration, atau seluruh aturan ending GDD. Perubahan fase dan assignment sementara dapat diganti ketika dihubungkan ke engine tim Pocut.

## Preview screenshot nyata

- `PREVIEW_01_NOE.png`: sapaan Noe.
- `PREVIEW_02_SOL.png`: highlight merah Sol.
- `PREVIEW_03_PILAR.png`: highlight merah empat pilar.
- `PREVIEW_04_PENJELASAN.png`: Noe menjelaskan kartu.
- `PREVIEW_05_MENUNGGU.png`: countdown 15 detik.
- `PREVIEW_06_KARTU.png`: tampilan 3 kartu asli dari aplikasi.

## NOV 2026 — NASA JSON addendum integration

The playable React HUD in `src/App.tsx` now uses `engine/hooks/useGameState` as the game state source. The 20 science-backed cards are loaded from `engine/data/cards.json`, not `src/demo/*` (previous demo code preserved under `_preserved_versions/legacy-demo`). Each card shows its NASA dataset and source name; source URL is available from Noe's result panel. Night ration handling, conditional FIX cards, delayed effects, and archive-scheduled Sol 3 Solar Particle Event are controlled by the engine.

`engine/data/donki-sep-archive.json` is **historical NASA CCMC DONKI data**, not a live feed or a NASA prediction for Mars. Four non-character SVG art pieces are under `public/assets/cards/`; all original crew artwork is unchanged.

For actual executable validation on your workstation:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

See `PRIORITY_FIX_REPORT.md` and `NASA_VERIFICATION.md` for exact changes, science sources, simulations, verification limitations, and the required browser smoke test.
