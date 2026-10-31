# CHG-NP-0.3.1 — Accent preferences, monochrome branding, hierarchical Gantt

## 0. READ FIRST — technical handoff

| Field | Observed result |
|---|---|
| Project | Niyarvo Projects; independent of RIVNA / Niyarvo Control Center |
| Source baseline | `NiyarvoProjects-v0.3.0-LOCAL-QA.zip` |
| Candidate | `v0.3.1` — LOCAL QA; NOT ACCEPTED |
| Branch | User-managed `work`; no Git operations performed |
| Firebase | `niyarvoprojects` left unconnected, no deploy |
| Android ID | `com.niyarvo.projects` unchanged |
| Platform | Expo SDK 58, React Native, Metro; no dependency additions |
| Tests | 184/184 Node tests passed (175 previous + 9 added) |
| UI parse | `App.js`, `GanttView.js`, `BrandMark.js`, `SchedulingPanel.js`, `TaskConfigurationPanel.js` passed TypeScript JSX parsing |
| Web / Android / iOS interaction QA | **Not run / not verified** |

## 1. Changes to the product

- Added `src/theme.cjs` with 10 named accent choices, the same names as RIVNA: Aqua, Mint, Lime, Amber, Orange, Coral, Pink, Fuchsia, Violet, Indigo. The **default is orange `#D97757`** (Claude/Anthropic clay). The names align; other color values were chosen for Niyarvo rather than claiming exact Rivna palette equivalence without its source.
- Added `src/design.cjs` theme update function. Existing `purple` and `purpleDim` tokens remain backward-compatible aliases for the **selected accent**; their current values are not permanently violet. Existing semantic warning/success colors are unchanged.
- Added a complete **Settings → Accent color** swatch selector with selection state, a tintable Niyarvo mark preview and accessible color labels. Selection is stored under `niyarvo-projects-accent-v1` in AsyncStorage, separately from user project JSON. Invalid saved values fall back to orange without changing workspace contents.
- Added `src/BrandMark.js`, faithfully using the original monochrome Niyarvo symbol paths supplied by the user; the mark changes color at runtime across platforms. The desktop sidebar now uses this component. Web browser favicon updates to the accent color.
- Regenerated `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`, `assets/brand-symbol.png`, and `public/icons/*` from the user's centered monochrome symbol with a dark background and **orange default**. These **static installed launcher/PWA icons do not change** when preferences change; native alternate icon capabilities are not implemented.
- Added independent hierarchical Gantt logic in `src/gantt.cjs` with stable ordering, nested rows, collapse/expand and calculated parent schedule range/progress. UI has **Tree** mode with expandable rows and parent summary bars, retaining existing Status/Stage modes.
- Summary bars are read-only navigation/overview elements, not draggable child-reschedulers. Existing leaf task move, resize, dependency creation and Kanban dragging are not rewritten.
- Updated `AGENTS.md`, `README.md` and version in `package.json` / `app.json`.

## 2. Behavioral safeguards

- Preference changes do not mutate, re-import, or migrate projects and do not affect Firebase.
- Derived rollups use `planning.progressRollups` and existing weight rules; nested leaf tasks are not double-counted.
- Collapsing parent rows only hides descendants from display. All tasks remain intact in the project, dependency graph and exports.
- Cyclic/missing parent references in hierarchy rendering are bounded with a visited set; validation rules for imported projects remain unchanged.
- Only project-scheduled tasks are shown as Gantt bars; parent summaries derive from child dates and do not create new task dates.
- Semantic colors for errors, validation, Done and other workflow states remain independent of the personal accent.

## 3. Testing evidence

- `node --test tests/*.test.cjs` — 184 pass, 0 fail.
- `typescript.transpileModule` with JSX parsing (five UI files) — 0 syntax errors.
- `JSON.parse` of `app.json`, `package.json`, and `public/manifest.json` — pass.
- ZIP entries integrity — verified.
- Metro, device layout, Web interaction and iOS runtime — **Not run**. No user acceptance implied.

## 4. QA instructions

1. Export a workspace JSON backup on v0.3.0; ensure the `work` branch and working files are safely checkpointed before extracting.
2. Extract the full ZIP at project root; use `npm test`, `npx expo install --check`, and `npx expo start`.
3. In Settings choose Orange, Aqua, Mint, Violet and back to Orange; verify primary buttons, sidebar/bottom navigation, Gantt controls and monochrome symbol recolor immediately. Close and reopen; preference should persist.
4. Check all ten swatch names and accessible tap targets; on Web check the tab favicon. Do not expect the installed home screen icon to change after picking an accent.
5. Timeline → Tree: expand/collapse multiple nesting levels; check parent summary dates and weighted progress against child tasks. Confirm collapsing never deletes tasks or links.
6. Retest Kanban press/hold drag, Gantt move/resize, dependency creation/removal, schedules, workspace export/import, restore and release verification.
7. Android portrait/landscape: check selected accent color, safe-area spacing and Gantt view controls for clipping.

No commits, pushes, merges, Firebase operations or deployment were performed.
