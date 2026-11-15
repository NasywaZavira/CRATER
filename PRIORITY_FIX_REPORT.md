# CRATER — Priority 1 & 2 implementation report

Date: 2026-11-15. Input: `CRATER_MERGE_Engine_Phaser_Website.zip` plus original `cards(1).json`.

## Priority 1

1. **Fixed** `engine/logic/validateBalance.ts`: removed references to `dailyGroups`, `dailyPerGroup`, `commandHandCapacity`, `characterRules`; now validates the actual balance schema, phase card count, rations, decay and skip penalties.
2. **Connected** main `src/App.tsx` to `engine/hooks/useGameState.ts`; engine owns all game state (cards, selection, meters, 8 Sol, phases, night, disasters, save). No imports from `src/demo/*` remain in active app. The old demo files were preserved under `_preserved_versions/legacy-demo/src-demo/`.
3. **NASA science sources** appear on each card as `NASA DATASET` / `SUMBER`, and source link is clickable in Noe's post-selection dialogue.
4. **Historical NASA archive:** `engine/data/donki-sep-archive.json` contains the May 11, 2024 STEREO-A SEP observation from NASA CCMC DONKI notification 20240511-AL-013. Game schedules the associated `solarParticle` repair event for **Sol 3 afternoon**; the mapping is a game-design choice, not a real-time prediction or evidence Mars received this exact STEREO-A particle measurement. Every related UI says **ARSIP / BUKAN LIVE**.
5. **Balance:** passive nighttime decay increased from LS/SH/PW/FD `3/2/3/2` to `5/5/6/5`, and rejecting cards or repairs now applies defined penalties in `engine/data/balance.ts` (instead of zero). JSON card `effects` and `delayed` values remain unchanged. Simulations: 1,000 seeded random-play campaigns yielded **241 wins (24.1%)** versus 100% reported before; average minimum meter **4.58** (including failed runs). All-skip policy lost in all 1,000 runs.

## Priority 2

6. Replaced all **10 original null `fact.sourceUrl`** fields with verified NASA / NASA JPL / paper index links. All 20 now have non-null source URLs. See `NASA_VERIFICATION.md`.
7. Retained 20 card title/description/effects from the user-supplied JSON. Corrected metadata publication year for Hassler et al. (online Dec 2013; journal Jan 2014). 0.67 mSv/day is supported by NASA 2013 public release. Details: `NASA_VERIFICATION.md`.
8. Removed obsolete runtime `src/demo/*` files; replaced `tests/demo/game.test.ts` with 6 engine-integration tests. Test no longer assumes automatic success at Sol 8 (game may fail early). Updated skip-only engine test accordingly.
9. Created four **new original SVG category illustrations** for operations / construction / repair / research in `public/assets/cards/`. Existing character and outpost artwork was not modified or replaced. Source `artKey` values remain in cards JSON; artwork on the website is selected by category.

## Additional integrations

- `src/bridge/engine-snapshot.ts`: engine `GameState` → real `SceneSnapshot` (Sol/cycle/crew/hazard). Sprite hiding on active tasks is **visual-only**, determined by card category, because the new JSON has no crew-assignment field; it is not a gameplay bonus.
- Night panel: set food/water rations and end Sol via engine.
- FIX card flow appears for engine disasters; skip repair has penalty.
- 15-second wait before each morning/afternoon/evening offer retained; Noe tutorial and original assets retained.
- React action functions made stable across renders so UI animation timers do not get reset by unnecessary callback re-creation.

## Verification: what was and was not run

- `npm run typecheck`: **PASS** using `tsc` and the user-supplied Windows `node_modules` archive, with local Node type declarations.
- `tsc --noEmit -p engine/tsconfig.json`: **PASS**.
- 16 engine test cases: **16/16 PASS** via TypeScript-to-CJS transpilation and a minimal Node `node:test` adapter implementing the assertions used in these Vitest tests.
- 14 website / bridge test cases: **14/14 PASS** via the same Node adapter.
- `npm test` / `npm run build` **NOT VERIFIED via the official Vitest/Vite runners** in this Linux environment: the only cached packages were installed on Windows and lack Linux `@rollup/rollup-linux-x64-gnu` / `@esbuild/linux-x64` binaries. Network npm installation failed. These results must not be represented as actual Vitest or Vite passes.
- Browser smoke test of Phaser scene and card layout **NOT EXECUTED** in this container.

To verify on your Windows computer: run `npm ci && npm run typecheck && npm test && npm run build` in the project root; run `npm ci && npm run typecheck && npm test` in `engine/` as well. If a dependency issue persists, send the full terminal output before changing game logic.

## Preservation checks

- Original PNG and JPG contents compared byte-for-byte against original merged ZIP. No originals changed.
- Original JSON `id`, `category`, `title`, `description`, `artKey`, `effects`, `delayed` all unchanged against `cards(1).json`.
- No files from the three original input ZIPs were intentionally deleted from the deliverable: old demo code is archived under `_preserved_versions` to keep it from executing, while all original character artwork remains in place.
