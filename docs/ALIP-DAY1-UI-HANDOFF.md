# ENAM — Alip Day 1 UI Work

## Scope owned by Alip

Per `ENAM_Checklist_Parallel_Development_V0-V8`:

- V0-02: independent mobile-first shell with Phaser slot, card panel and Noe; runnable with fixtures.
- V1-02: show the Phaser scene beside React HUD/cards, with HTML fallback if the scene is unavailable.
- V2-02: show Day 1/8, Morning/Afternoon/Night and a day-summary panel from a supplied view model.
- V3-02: display a three-card hand, select one card once, and support touch/keyboard input.
- V4-02: crew assignment selector; unavailable crew is disabled with a reason; crew limits come from the supplied view model.
- V5-02: four resource meters and resource deltas from the supplied view model.
- V6-02: 30-second event modal, three options, Contact Earth does not pause the timer, timeout fallback dispatches once.
- V7-03: Noe dialogue and daily journal with three decisions, resource deltas, and a verified NASA source link when supplied.
- V8-02: final 320–390 px walkthrough after the production preview and integrated 24-choice run exist.

## Day 1 schedule alignment

The Day 1 schedule calls out the UI core: four meters (target 100, initial value 80), cards, a cosmonaut assignment panel, and a cycle cooldown indicator. This project now has:

- Four mock resource meters at 80/100.
- A reusable three-card choice component. The component renders whatever hand the engine supplies; it does not draw or shuffle cards.
- A crew assignment panel with a configurable selection limit and unavailable state.
- A cycle cooldown indicator. It is display-only and renders status/progress supplied by the view model.
- A mobile-first shell, Phaser mount slot, fallback scene, Noe panel, event modal and journal foundation.

## Ownership boundaries

- Alip owns `src/ui/**`, `src/screens/**`, and `src/styles/**`.
- `src/ui/types/uiViewModel.ts` is a **provisional UI presentation model**, not the official shared `GameState`, `GameAction`, `Meter`, `Cosmonaut`, `Card`, `TimedEvent` or `NasaFact` contract.
- A owns the official contracts, engine, state and data integration. The official `GameViewModel` should be mapped into `UiGameViewModel` through an adapter after V0-01 is agreed.
- Akbar owns Phaser scene code and bridge. The UI exposes the `data-phaser-mount="outpost"` host and HTML fallback; it does not create or control the Phaser scene.
- Paran owns card catalog, balancing and verified NASA facts. The three cards and NASA text in the fixture are UI-only examples, not approved content or factual NASA claims.
- Clara/Vira own final visual and optional audio assets. Placeholder shapes remain until their handoff arrives.

## Important unresolved count discrepancy

The checklist overview/rules specify **4 crew**, while the Day 1 schedule image mentions **5 cosmonauts** in the data/schema handoff. The UI selector is array-driven and does not hardcode a crew count. The current fixture uses four crew members to match the checklist; confirm the final count with A/Paran before replacing the fixture.

## What the UI intentionally does not do

- No resource formulas, consumption, RNG, card shuffling, cycle transitions, cooldown timer, crew-trait effects, or event-resolution rules.
- No NASA DONKI fetch or invented NASA facts.
- No direct writes to `src/engine/**`, `src/contracts/**`, `src/state/**`, `src/data/**`, `src/phaser/**` or `src/bridge/**`.

The UI emits callbacks such as `onSelectCard`, `onAssignCrew`, `onChooseEvent` and `onEventTimeout`. The integration layer owned by A connects these to the official `GameAction` dispatcher.

## Run locally

From the project root:

```powershell
npm install
npm run dev
```

Quality checks:

```powershell
npm run build
npm run lint
npm audit --omit=dev
```

This source archive intentionally omits `node_modules/` and `dist/`. Keep the existing local `node_modules` when overlaying this update into `D:\NASA`; otherwise run `npm install` once.
