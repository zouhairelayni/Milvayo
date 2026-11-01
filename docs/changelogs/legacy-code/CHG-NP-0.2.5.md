# CHG-NP-0.2.5 — Controlled QA handoff

## 0. READ FIRST — 60-second handoff

| Field | Value |
|---|---|
| Project | Niyarvo Projects (independent from RIVNA and Niyarvo Control Center) |
| Batch | NP v0.2.5 — Gantt viewport and shared Unslop UI |
| Baseline | v0.2.4-LOCAL-QA.zip |
| Delivery | Complete project-root ZIP, standalone changelog, standalone results |
| Status | **QA candidate — runtime unverified** |
| Work branch | `work`, to be used by user; no Git action executed here |
| Storage | AsyncStorage key `niyarvo-projects-v1` unchanged; no migration |
| Firebase | Not connected or deployed |
| Git main | Unmodified |

## 1. Changes made (observed source changes)

- **Zoom**: `GanttView.js` accepts two-point pinch distance from chart touches, uses a bounded day scale 6–96 px/day, recalculates horizontal scrolling to preserve the midpoint's date. Presets Days/Weeks/Months and accessible `+`, `−`, `Fit` controls; compact bar indicators at high-level overview zoom.
- **Two-axis auto-pan while linking**: introduced independent vertical chart ScrollView, horizontal date ScrollView, a viewport geometry reference, scroll offsets, 40ms edge-pan loop, and offset-corrected dependency hit testing. The finger contact offset is calibrated within the port hitbox and remeasured asynchronously if available. Cancel/two-touch interruption stops the loop; on unmount the timer is cleared.
- **Touch state**: pinchActive and isLinkDragging states prevent scroll from remaining disabled after gesture release. Tap-to-link remains available and can scroll to distant destinations.
- **Shared mobile design**: `src/design.cjs` graphite and Niyarvo violet tokens used by both App and Gantt; shared Button/Chip/IconButton/Input refinements and consistent touch heights; compact mobile header and bottom navigation; secondary section copy hidden on narrow layouts; Gantt toolbar progressive disclosure.
- **Preserved behavior**: Kanban card gesture code unchanged. Gantt task shift/resize and dependency model functions unchanged. Project import/export and backup logic unchanged. No roadmap import and no new package dependencies.

## 2. Files

- Modified: `App.js`, `src/GanttView.js`, `package.json`, `app.json`, `README.md`, `tests/gantt-ui-contract.test.cjs`.
- Added: `src/design.cjs`, `src/viewport.cjs`, `tests/viewport.test.cjs`, `docs/NP-QA-0.2.5.md`, `docs/UNSLOP-NP-0.2.5.md`, this changelog.

## 3. Executed evidence

| Check | Result |
|---|---|
| Node `npm test` (model/contract/viewport) | **Pass — 66/66** |
| JSX parse with TypeScript 5 parser | **Pass — 0 syntax errors** in App.js/GanttView.js |
| ZIP structural integrity | Verified during packaging |
| `npx expo install --check` in this environment | **Not run** (Expo packages/node_modules unavailable) |
| Metro Web bundle in this environment | **Not run** |
| Android Expo Go real pinch/pan | **Not run** |
| iOS runtime | **Not run** |
| Firebase Hosting deploy | **Not performed** |
| Git work commit, main merge | **Not performed** |

## 4. Known risks / unresolved

1. Native responder capture and nested ScrollView touch propagation require actual device testing; pinch may conflict with bar handlers on some devices. Accessible zoom controls are fallback.
2. Connector offset was reported intermittently on first touch. The new offset calibration is a proposed correction; not verified on user phone.
3. Edge pan is bounded by the 90–540 day calendar window. Use Earlier/Later for dates outside the currently generated window.
4. UI design pass touches shared components and Gantt but is **not a pixel-perfect full application redesign**. Audit every main screen on real Android before acceptance.
5. Critical path remains calendar-day/finish-to-start only. Complex link crossings are not guaranteed to be eliminated.

## 5. User Termux QA commands

```sh
cd ~/NiyarvoProjects
git switch work
git status --short
# Export workspace JSON backup first; preserve existing uncommitted work.
unzip -o ~/storage/downloads/NiyarvoProjects-v0.2.5-LOCAL-QA.zip -d .
npm test
npx expo install --check
npx expo start
```

**QA order:** pinch zoom; zoom controls/Fit; independent horizontal and vertical chart scroll; connector auto-pan in all directions and correct target on first attempt; link deletion; move/resize; Kanban regression; app-wide mobile visual check; persistence after restart. See `docs/NP-QA-0.2.5.md`.

## 6. Merge gate

Only after Android and Web interaction QA passes: checkpoint on `work`, review diff and data export, then merge to `main`, tag version, and eventually deploy to **a new, independent** Firebase project. No force-push.
