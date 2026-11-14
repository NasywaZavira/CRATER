# ENAM HUD patch — files to merge into the project root

Extract this patch into `D:\NASA` and allow the listed files to merge/overwrite. It does not contain `node_modules`, `dist`, or the project lockfile. No new npm package is required by this HUD patch.

## Modified files
- `index.html` — English page metadata and Iconify web-component loader.
- `vite.config.ts` — preserves the React plugin and enables Tailwind CSS v4 through `@tailwindcss/vite`.
- `src/index.css` — imports Tailwind and design tokens; sets the muted spacecraft-monitoring background texture.
- `src/styles/tokens.css` — muted metal/glass base plus the four resource palettes.
- `src/ui/GameHeader.tsx` — top-left Mars clock, mission day, current cycle, and four status rails.
- `src/ui/TopResourceRail.tsx` — rails in the wireframe order: Shielding, Food, Life Support, Power.
- `src/ui/ResourceHUD.tsx` — detailed resource meters and Iconify icons using the same palette.
- `src/ui/MarsClockHUD.tsx` — local Mars clock, global MSD, and separate ENAM mission-day counter.
- `src/ui/time/marsTime.ts` — NASA GISS Mars24 mean-solar-time calculation and global MSD calculation.
- `src/ui/EarthCommsHUD.tsx` — fixed bottom-left Earth communications preview.
- `src/ui/GamePage.tsx` — mounts the Earth communications control and routes UI intents through optional callbacks.
- `src/ui/TimedEvent.tsx` — event countdown lifecycle/lint correction from the previous UI patch.

## Added/supporting files
- `src/ui/IconifyIcon.tsx` — typed wrapper around the Iconify web component.
- `docs/HUD-MARS-TIME-IMPLEMENTATION.md` — formula, assumptions, benchmark, and integration notes.
- `docs/BACKGROUND-REFERENCES.md` — official NASA habitat visual references for the art handoff.

## Merge instructions
1. Stop the Vite dev server with `Ctrl + C`.
2. Extract the ZIP directly into the existing project root (`D:\NASA`), not inside a new nested `NASA` folder.
3. Allow overwrite for the exact files listed above.
4. From `D:\NASA`, run `npm install` only if the existing dependency installation is missing or incomplete. The patch itself adds no new dependency.
5. Run `npm run dev`, then `npm run build` and `npm run lint`.

## Important assumptions and boundaries
- The current Mars site longitude is `0°W` (Airy-0 / prime-meridian reference) because the ENAM outpost coordinates have not been supplied. Replace `MARS_SITE_LONGITUDE_WEST_DEG` in `src/ui/time/marsTime.ts` when the approved site longitude is known. East longitude is represented as a negative west longitude.
- The top-line sequence follows the user's wireframe: purple, green, cyan, yellow. Resource color meanings follow the supplied quick-reference table.
- The global Mars Sol Date (MSD) is independent of longitude. Longitude shifts local mean solar time (LMST), not the global MSD. `Mission Day 1/8` is a separate ENAM campaign counter.
- The Earth panel is a UI preview only. It does not send messages or calculate one-way light time; that requires an approved ephemeris/communications layer.
- Background uses a muted CSS metal/glass texture. Use the supplied NASA HERA/CHAPEA references only as visual references until Clara supplies the approved production background.
- A still owns the official game state, formulas, RNG, and cycle transitions; Akbar owns Phaser scenes/bridge; Paran owns approved card data and NASA facts; Clara/Vira own final art/audio. This patch is presentation-only and does not replace those responsibilities.
