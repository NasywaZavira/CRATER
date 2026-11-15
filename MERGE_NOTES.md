# CRATER Merge Notes

## Inputs and merge policy

- Base: `CRATER-feat-engine-ui-intregration(1).zip` — the existing engine, Phaser scene, HUD, card presentation, and assets remain active.
- Phaser contribution: `CRATER-feat-phaser-a(1).zip` — added the cinematic introduction/ending, associated tests, and the original `NOE.png` and `LOGO 1.png` files.
- Content reference: `cards_updated.json` — **only `description` was copied** into `engine/data/cards.json` for all 80 matching card IDs. The incoming JSON filename was not used inside the project.

## Gameplay and interface adjustments

- The card transmission delay changes from **15 seconds to 3 seconds** (the `WAIT_SECONDS` constant in `src/App.tsx`).
- User-facing instructions, buttons, tutorial text, status messages and accessibility labels in the integrated game are in English.
- Tutorial instructions fade in, and the three randomly drawn cards appear with a staggered fade/slide animation. Reduced-motion settings are supported.
- Mobile portrait layouts use a full-height outpost, legible meter and Noe UI, and a horizontally swipeable three-card deck. Mobile landscape has minimum-size text overrides.
- The original Phaser mission cinematic is connected at the beginning; engine-driven mission outcomes trigger the appropriate ending cinematic, followed by the existing result report. Crew-health aborts go directly to the accurate report because the supplied cinematic only has meter-failure scripts.

## Source preservation

- Original base files: 120.
- Base files intentionally changed: 3 (`engine/data/cards.json`, `src/App.tsx`, `src/styles/outpost.css`).
- Base files left identical byte-for-byte: 117.
- Phaser-only files added: 8.
- Phaser files with different versions at the same path: 14; the original Phaser versions are retained in `_merge_sources/phaser-a/`, while the engine/UI versions remain active.
- Shared files identical in both ZIPs: 21.
- All 80 cards retain their **identical IDs, categories, effects, costs, NASA source metadata, meter classifications, and other pre-existing fields**. Only `description` was updated. Longer descriptions may warrant a later scientific source review because the user requested that `fact` metadata not be replaced.

## Preserved Phaser variants of files with collisions

- `.gitignore`
- `README.md`
- `package-lock.json`
- `package.json`
- `public/assets/mars-sky-afternoon.png`
- `public/assets/mars-sky-evening.png`
- `public/assets/mars-sky-morning.png`
- `public/assets/mars-sky-night.png`
- `src/App.tsx`
- `src/contracts/fixtures.ts`
- `src/styles/outpost.css`
- `src/styles/theme.css`
- `tests/bridge/typed-event-bus.test.ts`
- `tsconfig.json`

## Verification

- Compared both input ZIPs by relative paths and exact file bytes.
- Compared 80 card descriptions against the supplied updated JSON and every non-description field against the original JSON.
- Parsed all application and engine TypeScript/TSX source files and the edited CSS without syntax errors.
- Independently type-checked and compiled the engine logic using system TypeScript.
- Ran the compiled engine with 80 cards, a starting game, and a three-card offer without duplicated IDs.
- Full `npm run build`, Vitest, and real browser/mobile rendering **were not verified** because package installation from npm registry failed in the execution environment (EAI_AGAIN). Run `npm ci`, `npm run typecheck`, `npm test`, and `npm run build` on a system with dependencies available before deploying.

## Important scope note

The Phased gameplay, meter effects, character artwork, Phaser scene, and existing UI controls were not redesigned. The phaser branch's differing sky images and its alternative `App.tsx`/CSS have been preserved as source copies, not allowed to overwrite the active engine-powered gameplay.
