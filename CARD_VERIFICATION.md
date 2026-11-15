> **Pembaruan terbaru:** katalog aktif kini **80 kartu GDD dengan klasifikasi 4 meter × 6 jenis aktivitas**. Dokumen ini memuat catatan versi sebelumnya. Lihat `METER_CATEGORY_UPDATE.md` di root proyek.

# Card integration verification

Date: 2026-11-15

## What was checked

- `npm run typecheck` at project root: **PASS** (TypeScript 5.9, reused development dependencies from prior uploaded Windows archive; root TypeScript typecheck is platform-independent).
- `tsc --noEmit` under `engine/`: **PASS** (types from a local temporary development directory, not shipped).
- Direct Node/TypeScript engine runner: **19 assertions PASS** for 20-card catalog, 4 categories, delayed cards, 3 unique draws, deterministic RNG with given seed, category cycle, `DEPLOY` effects, and original artwork checksum.
- Old original ZIP file-by-file diff: only these pre-existing files changed: `engine/data/cards.json`, `src/App.tsx`, `src/styles/outpost.css`. All other pre-existing files are unchanged byte-for-byte.
- Existing 80-card JSON archived byte-for-byte in `_preserved_versions/legacy-80-cards/cards.gdd-80.json`.
- Four original card PNGs copied byte-for-byte to `public/assets/cards/original-figma/`, pixel crops saved in `public/assets/cards/icons/`.

## What could not be checked

- Official Vitest (`npm test`) and Vite browser build (`npm run build`) **not verified**: previously uploaded `node_modules` contains Windows-only Rollup bindings while this environment is Linux, and the npm registry cannot be reached (`EAI_AGAIN`).
- Visual check in a rendered browser **not verified**. `CARD_UI_PREVIEW.html` is provided as a static layout aid, but the actual app should be checked using `npm ci && npm run dev` on the user's machine.

## Note on gameplay

The active card pool is the 20-card JSON addendum. In the received ZIP, `engine/data/cards.json` had **80 cards with categories / effects incompatible with the current validator**; that was not a valid source for the active addendum engine. Old data remains available in the archive, unchanged. The JSON `effects` and `delayed` numbers of the restored 20 cards are not edited by the UI.
