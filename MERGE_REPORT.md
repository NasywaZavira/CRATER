# CRATER – Laporan Perbandingan dan Merge 3 ZIP

## Sumber (semua sumber dibaca langsung dari ZIP unggahan)

1. `CRATER-feat-engine-p (1).zip`: **33 file**; engine game kartu JSON addendum v4, data, state, reducer, save, dan pengujian.
2. `CRATER-feat-phaser-a.zip`: **36 file**; React + Phaser scene, bridge, gambar crew / lingkungan, kontrak, dan pengujian.
3. `CRATER-website.zip`: **55 file**; website frontend/HUD tutorial Noe, prototipe kartu, Phaser, asset tambahan, serta pengujian.

Jumlah berkas input: **124** (menghitung duplikat). Total nama path unik jika semua root disamakan: **85**.

## Perbandingan file

- Phaser vs website: 34 file dengan path sama, terdiri dari **27 isi identik** dan **7 isi berbeda**.
- Website tidak mempunyai **2 file Phaser**, yaitu `src/contracts/fixtures.ts` dan `src/contracts/types.ts`; keduanya sudah ditambahkan ke posisi aslinya.
- Engine tidak mempunyai frontend runtime (tidak ada `src/App.tsx`, `index.html`, dan asset PNG). Website/Phaser tidak mempunyai 20 kartu JSON engine / reducer / save v4.
- Website masih memakai `src/demo/cards.ts` dan `src/demo/game.ts` **prototipe lama**, bukan reducer engine v4.
- Tidak ada dokumen GDD lengkap (mis. .docx/.pdf) di tiga ZIP ini.

### File yang *khusus ada* dalam masing-masing ZIP (path dinormalisasi)

**Engine saja (28):**
- `.gitattributes`
- `DECISIONS.md`
- `MIGRATION.md`
- `VERIFICATION.md`
- `data/balance.ts`
- `data/cards.json`
- `data/cards.ts`
- `data/cosmonauts.json`
- `data/disasters.ts`
- `data/endings.ts`
- `hooks/useGameState.ts`
- `logic/content.ts`
- `logic/cycle.ts`
- `logic/draw.ts`
- `logic/errors.ts`
- `logic/gameReducer.ts`
- `logic/index.ts`
- `logic/initialState.ts`
- `logic/meters.ts`
- `logic/rng.ts`
- `logic/save.ts`
- `logic/storage.ts`
- `logic/validateBalance.ts`
- `logic/version.ts`
- `tests/card-logic.test.ts`
- `tests/save.test.ts`
- `types/index.ts`
- `vitest.config.ts`

**Phaser saja (2):**
- `src/contracts/fixtures.ts`
- `src/contracts/types.ts`

**Website saja (21):**
- `ASSET_ORIGINAL_CHECKSUMS.txt`
- `INTEGRASI_TIM.md`
- `PREVIEW_01_NOE.png`
- `PREVIEW_02_SOL.png`
- `PREVIEW_03_PILAR.png`
- `PREVIEW_04_PENJELASAN.png`
- `PREVIEW_05_MENUNGGU.png`
- `PREVIEW_06_KARTU.png`
- `demo.html`
- `public/assets/card-antenna.jpg`
- `public/assets/card-hydro.jpg`
- `public/assets/card-shield.jpg`
- `public/assets/cycle-afternoon.png`
- `public/assets/cycle-evening.png`
- `public/assets/cycle-morning.png`
- `public/assets/guide-noe-portrait.png`
- `public/assets/guide-noe.png`
- `src/demo/cards.ts`
- `src/demo/game.ts`
- `tests/bridge/crew-visibility.test.ts`
- `tests/demo/game.test.ts`

### Konflik path Phaser vs website (7 file)

| Path aktif (versi website) | Salinan asli versi Phaser |
|---|---|
| `package.json` | `_preserved_versions/feat-phaser-a/package.json` |
| `package-lock.json` | `_preserved_versions/feat-phaser-a/package-lock.json` |
| `README.md` | `_preserved_versions/feat-phaser-a/README.md` |
| `src/App.tsx` | `_preserved_versions/feat-phaser-a/src/App.tsx` |
| `tests/bridge/typed-event-bus.test.ts` | `_preserved_versions/feat-phaser-a/tests/bridge/typed-event-bus.test.ts` |
| `src/styles/theme.css` | `_preserved_versions/feat-phaser-a/src/styles/theme.css` |
| `src/styles/outpost.css` | `_preserved_versions/feat-phaser-a/src/styles/outpost.css` |

Perbedaan utama: `src/App.tsx` di website adalah tutorial + HUD kartu, sedangkan di Phaser berisi demonstrasi scene; `src/styles/outpost.css` dan `theme.css` mempunyai styling berbeda; `README.md` berbeda sesuai fungsi cabang; `package.json` memakai versi Vitest berbeda, demikian pula lockfile-nya; dan tes event bus pada Phaser mengimpor fixture dari `src/contracts` sementara tes website dari `src/bridge`.

## Kebijakan merge: non-destruktif

- Root proyek = **versi website asli**, sehingga tidak ada penggantian tampilan, file logika demo, konfigurasi, maupun artwork pada website.
- File Phaser yang belum ada pada website disalin ke tempatnya (`src/contracts/`). File Phaser yang identik direferensikan dengan salinan website yang sama byte-nya.
- **Semua file yang bertabrakan** dipertahankan dalam dua versi: aktif = website; alternatif = `_preserved_versions/feat-phaser-a/`.
- Keseluruhan engine disimpan tanpa modifikasi di **`engine/`**, lengkap dengan file konfigurasi, lockfile, tes, dan 20-card JSON. Path relatif dalam paket engine tetap bekerja.
- `MERGE_MANIFEST.json` mencatat setiap file asal → lokasi akhir dan SHA-256. Setiap isi file sumber diverifikasi byte-for-byte; laporan ini adalah file tambahan baru.

**Penting: ini penggabungan berkas tanpa mengubah logika orisinal, BUKAN integrasi runtime antara engine v4 dan HUD.** Menyambungkan data kartu JSON ke UI membutuhkan pengubahan `src/App.tsx`/`src/demo/*`; hal tersebut sengaja tidak dilakukan karena kamu meminta **tidak mengurangi atau mengubah hal-hal lain**. Akibatnya ketika dijalankan, website akan tetap menggunakan kartu prototipe, bukan JSON engine yang baru. Engine v4 ada sebagai library terpisah di dalam ZIP yang sama.

## Cara menjalankan

Website (root):

```sh
npm ci
npm run build
npm test
npm run dev
```

Engine (sebagai paket tersendiri):

```sh
cd engine
npm ci
npm run typecheck
npm test
```

**Jangan** menjalankan `npm install`/`npm ci` dengan menganggap dua `package.json` ini satu package; keduanya sengaja dipertahankan utuh. Mengubah dependency atau lockfile dapat mengubah versi asli tiap proyek.
