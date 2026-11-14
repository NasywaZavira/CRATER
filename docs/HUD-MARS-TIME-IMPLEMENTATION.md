# ENAM HUD implementation notes

## Visual intent

The interface is a browser-based Mars survival game. The base surface stays muted slate/metallic grey with translucent glass panels so the four resource signals remain legible without overwhelming the gameplay scene. Visible interface text is in English.

### Resource rails and color semantics

The four horizontal rails follow the user's wireframe order (top to bottom):

| Rail | Primary | Accent | Meaning from the supplied quick-reference table |
|---|---|---|---|
| Shielding | Metallic grey `#9CA3AF` | Deep violet `#7C3AED` | Strength, armor, cosmic barrier |
| Food | Vibrant green `#39E75F` | Warm orange `#F97316` | Growth, nature, nourishment, appetite |
| Life Support | Light cyan `#29C7EE` | White `#F8FAFC` | Purity, breath, calm, hydration |
| Power | Bright yellow `#FDE725` | Electric amber `#F59E0B` | Energy, alertness, active current |

The four top bars are ordered purple/green/cyan/yellow to match the supplied sketch. Shielding's metallic grey primary is blended toward its deep-violet accent so the rail reads violet while the detailed meter retains the metallic base.

### Layout positions

- Upper-left: circular Mars clock. It displays local mean solar time (LMST), the global Mars Sol Date (MSD), the configured site longitude, and the separate ENAM mission day.
- Upper/right header: ENAM identity, current cycle, and four resource rails.
- Detailed resource panel: numerical resource values and deltas, using the same colors and Iconify icons.
- Bottom-left: `Contact Earth` control opens a communications preview. It does not establish a live connection.

## Mars clock — astronomical model

The clock follows the NASA GISS Mars24 algorithm based on Allison and McEwen. It uses the browser's Earth timestamp, converts it to Julian Date in UT and then Terrestrial Time (TT), and derives Mars mean solar time. NASA's Mars24 algorithm documentation gives the equations and a worked reference case.

```text
JD_UT = 2440587.5 + UnixMilliseconds / 86400000
JD_TT = JD_UT + (TT - UTC) / 86400
d = (JD_TT - 2451549.5) / 1.0274912517 + 44796 - 0.0009626
MSD = d
MST = mod_24(24 * MSD)
LMST = mod_24(MST - longitudeWest / 15)
Local clock fraction = mod_1(MSD - longitudeWest / 360)
```

- `1.0274912517` is the Mars solar day in Earth days (about 24 Earth hours, 39 Earth minutes, 35.244 Earth seconds).
- The displayed clock is a 24-Mars-hour clock with 60 minutes and 60 seconds per hour/minute. One displayed Mars clock-second is about `1.0274912517` Earth SI seconds; the UI refresh interval uses this duration.
- `MSD` is the global sequential Mars Sol Date. Its integer part is the global Sol count and does not shift with longitude.
- `LMST` is site-local mean solar time. The longitude offset changes the clock time, not the global MSD label. East longitude is supplied as a negative west longitude.
- `Mission Day 1/8` is ENAM's fictional campaign day and is not the astronomical Mars Sol Date.

### TT−UTC handling

For dates from 1972 onward, the implementation uses the historical TAI−UTC leap-second table and adds 32.184 seconds to obtain TT−UTC. The current table entry is TAI−UTC = 37 seconds, giving TT−UTC = 69.184 seconds. IERS Bulletin C 72 (6 July 2026) says no leap second will be introduced at the end of December 2026 and confirms UTC−TAI = −37 seconds from 1 January 2017 until further notice. Update the table only if a later IERS bulletin announces a change. For dates before 1972, the code uses the pre-1972 polynomial documented by Mars24.

### Verification vector

NASA GISS's worked example uses Earth UTC `2000-01-06 00:00:00`, TT−UTC `64.184 s`, and longitude `0°W`. The expected Mars mean/local mean solar clock is `23:59:39`. The implementation reproduces this value.

### Location assumption — must be confirmed

The current site longitude is deliberately `0°W` (Airy-0 / prime-meridian reference). This is a transparent placeholder, not a claim that the fictional ENAM outpost is located at Airy-0. The actual local clock cannot be site-specific until the project provides the outpost's approved Mars longitude. Change `MARS_SITE_LONGITUDE_WEST_DEG` in `src/ui/time/marsTime.ts` when coordinates are confirmed.

## Earth communications panel

The bottom-left `Contact Earth` control is a local UI preview. It can emit optional UI intent callbacks, but it does not send a message or establish a real connection. One-way light time remains `Awaiting orbital data`; an actual value requires time-tagged Earth/Mars positions from a validated planetary ephemeris and a defined light-time calculation. Do not invent or hard-code a delay.

## Icon system

HUD/UI symbols use Iconify web-component icons (Material Design Icons names) through the loader in `index.html`. No extra npm package is required. Text labels and progress values remain visible if the remote icon service is unavailable.

## Muse Dash — design-system takeaways

This is a design reference, not a request to copy game artwork or proprietary assets. Muse Dash's in-game interface makes the most important play-state information glanceable (score, combo, pause, Fever progress). Community UI tweaks also document consistent score colors for performance states, synchronizing HP/Fever bar animations, and tabular scoreboard numbers. ENAM adapts only these broad principles:

- Keep status bars in fixed, predictable positions.
- Use consistent color semantics for the same resource everywhere.
- Provide immediate visual feedback for selected cards, assigned crew, cooldowns, and event timers.
- Use tabular/monospace numerals for clocks and resource values.
- Keep the background subdued so the gameplay and status signals stay readable.

ENAM retains its own grey metal/glass base and the four resource colors from the team's reference table. No Muse Dash icons, characters, music, or artwork are included.

## Background handoff

The current implementation uses a low-contrast CSS metal/glass texture as a temporary background. `docs/BACKGROUND-REFERENCES.md` lists official NASA habitat references that Clara can use as visual inspiration. The production background should be supplied/approved by the art team and placed behind a darkened overlay so bars, text, and crew assets remain legible.

## Integration boundary

This remains a React presentation layer. The official engine still owns `GameState`, calculations, randomization, cycle transitions, event outcomes, and resource updates. Akbar owns the Phaser scene/bridge; Paran owns approved card content/balancing and NASA facts; the art team owns final character/background/audio assets. When the official contract arrives, create an adapter from the official `GameViewModel`/`GameAction` to the provisional UI view model rather than rewriting the HUD components.

## Local commands

```powershell
npm install
npm run dev
npm run build
npm run lint
```

## Source references

- NASA GISS Mars24 algorithm and worked examples: https://www.giss.nasa.gov/tools/mars24/help/algorithm.html
- NASA GISS Mars solar-time technical notes: https://www.giss.nasa.gov/tools/mars24/help/notes.html
- IERS Bulletin C 72 (6 July 2026): https://datacenter.iers.org/data/html/bulletinc-072.html
- Muse Dash gameplay overview: https://musedash.fandom.com/wiki/Gameplay
- Community-documented Muse Dash UI tweaks (unofficial): https://github.com/bnfour/md-mods
- Accessible game HUD guidance: https://accessiblegamedesign.com/guidelines/HUD.html
