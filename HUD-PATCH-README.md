# ENAM HUD patch — install guide

## What this patch adds

- Mars Local Mean Solar Time (LMST) clock in the upper-left circle.
- Global Mars Sol Date (MSD), shown separately from the ENAM Mission Day counter.
- Four top rails in the provided order: Shielding (violet), Food (green), Life Support (cyan), Power (yellow).
- Detailed resource meters with the same resource color meanings.
- Bottom-left Contact Earth UI panel (preview only).
- Iconify-based clock, resource, and communications symbols.
- A muted spacecraft-console background texture while waiting for the final art asset.

## Install

1. Stop the dev server in VS Code (`Ctrl + C`).
2. Extract this ZIP directly into `D:\NASA`. Do not extract it into `D:\NASA\NASA`.
3. Merge folders and allow overwrite of files in the patch.
4. Open the `D:\NASA` project folder in VS Code.
5. If local packages are missing, run `npm install`. No new package is added by this patch.
6. Run `npm run dev`; check the clock, top rails, and Contact Earth button.
7. Run `npm run build` and `npm run lint`.

## Files to modify/replace

- `index.html`
- `vite.config.ts`
- `src/index.css`
- `src/styles/tokens.css`
- `src/ui/GameHeader.tsx`
- `src/ui/TopResourceRail.tsx`
- `src/ui/ResourceHUD.tsx`
- `src/ui/MarsClockHUD.tsx`
- `src/ui/EarthCommsHUD.tsx`
- `src/ui/GamePage.tsx`
- `src/ui/TimedEvent.tsx`
- `src/ui/time/marsTime.ts`

## Files to add if not present

- `src/ui/IconifyIcon.tsx`
- `docs/HUD-MARS-TIME-IMPLEMENTATION.md`
- `docs/BACKGROUND-REFERENCES.md`
- `HUD-UPDATE-FILES.md`

## Mars clock assumptions

- The code follows NASA GISS Mars24's Mars mean-solar-time method.
- The current longitude is `0°W` only as a temporary prime-meridian reference. It must be replaced when the fictional outpost longitude is approved.
- MSD is a global Sol count; the site longitude changes local clock time (LMST), not the MSD number.
- The ENAM Mission Day (e.g. 1/8) is a separate gameplay counter.
- The display derives from the computer's current Earth timestamp; the laptop clock must be correct.

## Integration boundary

The Earth panel does not actually transmit messages. It is ready to emit optional UI callbacks for the integration layer. A must supply the official game contract/actions, Akbar supplies the Phaser scene/bridge, Paran supplies validated card/NASA content, and Clara/Vira supply final visual/audio assets.
