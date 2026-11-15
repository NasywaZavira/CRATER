# Verifikasi integrasi Addendum v4

## Asal data

- Input: `cards(1).json` yang diunggah pengguna.
- Salinan: `data/cards.json` (byte-for-byte identical).
- SHA-256: `25e2e18f373530cb2910908c749fb45a20eaddbf36be4fc300d6afe376366f31`.
- 20 kartu / 4 kategori, masing-masing 5 kartu.
- 4 kartu mempunyai `delayed` dengan `afterSols = 1`.
- 10 nilai `fact.sourceUrl` adalah `null` dan tidak diisi dengan sumber baru.

## QA yang benar-benar dilakukan saat pembuatan

- TypeScript diperiksa memakai `tsc` global untuk modul engine dan file lainnya memakai *temporary test declarations* untuk React/Vitest (bukan dependensi produksi). Tidak ada error TypeScript pada pemeriksaan tersebut.
- Modul engine dikompilasi ke CommonJS sementara, lalu diuji dengan Node `assert`: validasi 20 kartu, label kategori, instant meter, delayed meter, siklus, bencana FIX, save v4, penolakan save lama, dan 100 simulasi 8 Sol. Semua pemeriksaan manual lulus.
- `npm ci` di lingkungan pembuatan mengalami timeout; **`npm test` via Vitest asli belum berhasil dijalankan**. Setelah ekstraksi di komputer pengguna, jalankan `npm ci && npm run typecheck && npm test` untuk pemeriksaan resmi.

## Cakupan

ZIP ini adalah **engine** berdasarkan `CRATER-feat-engine-p(1).zip`, bukan game HUD/Phaser lengkap. Kode React HUD dari repo lain tidak tersedia dalam ZIP engine sehingga belum diintegrasikan/dijalankan dalam aplikasi. Panduan perubahan kontrak ada di `MIGRATION.md`.
