# ENAM — OutpostScene + Bridge (BASE-14 s/d BASE-19, milik Akbar)

    npm install
    npm run dev        # harness dengan fixture + tombol Day/Cycle/Unmount
    npm run typecheck && npm test && npm run build

## Isi
- `src/phaser/OutpostScene.ts` — satu scene: background, 4 kru, lighting, label cycle. Hanya render SceneSnapshot.
- `src/phaser/lighting.ts`, `sprites.ts`, `config.ts` — preset cahaya, kru (PNG atau shapes fallback), config Phaser.
- `src/bridge/typed-event-bus.ts` — event bus bertipe (tanpa Phaser, bisa dites). Event: scene-ready, scene-snapshot, scene-error.
- `src/bridge/SceneBridge.tsx` — komponen React: mount Phaser, kirim snapshot terbaru setelah ready/remount, cleanup saat unmount.
- `src/contracts/*` — SALINAN SEMENTARA dari Blueprint; ganti dengan versi A setelah contract freeze.
- `src/App.tsx` — harness dev saja (milik Alip di repo asli); jangan di-merge.

## Saat merge ke repo CRATER
Salin hanya `src/phaser/**`, `src/bridge/**`, `tests/bridge/**`. Buang `contracts/` dan `App.tsx` dari PR.
Catatan: `enam:scene-error` adalah tambahan di luar Blueprint; kabari A.
